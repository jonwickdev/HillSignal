export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { NextResponse } from 'next/server'
import { fetchRecentBills, enrichBillItems } from '@/lib/congress-api'
import { fetchRecentContracts, fetchSectorContracts, SECTOR_NAICS_MAP } from '@/lib/usaspending-api'
import { analyzeBatch, filterForMarketRelevance, analyzeContractItem, filterContractsForRelevance } from '@/lib/gemini-analysis'
import type { RawContractItem } from '@/lib/gemini-analysis'
import type { Signal } from '@/lib/types'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * GET /api/admin/backfill?type=bills|contracts&secret=xxx
 *
 * Historical backfill endpoint. Processes one batch per call.
 * Call repeatedly until response.status === 'complete'.
 *
 * Bills: Fetches 250 bills per call using date-range pagination (90 days back).
 * Contracts: Fetches sector-by-sector contracts for last 90 days.
 *
 * Protected by CRON_SECRET.
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const secret = url.searchParams.get('secret')
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const type = url.searchParams.get('type') ?? 'bills'
  if (type === 'contracts') {
    return backfillContracts()
  }
  return backfillBills()
}

/**
 * Backfill bills: uses poll_state row 'backfill_bills' to track progress.
 * Each call fetches 250 bills from a moving date window, processes them.
 */
async function backfillBills() {
  const startTime = Date.now()
  const adminClient = createAdminClient()

  // Get backfill state
  let backfillState: any = null
  try {
    const { data } = await adminClient
      .from('poll_state')
      .select('*')
      .eq('id', 'backfill_bills')
      .single()
    backfillState = data
  } catch { /* first call */ }

  // Determine date window
  // We work backwards from today in ~7-day chunks
  const now = new Date()
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

  // Current cursor: the "toDateTime" for next fetch. Start from now, work backward.
  let cursor = backfillState?.errors // reusing 'errors' field to store cursor date
    ? new Date(backfillState.errors)
    : now

  // If cursor is already past 90 days ago, we're done
  if (cursor <= ninetyDaysAgo) {
    return NextResponse.json({
      status: 'complete',
      message: 'Bill backfill complete — 90 days covered',
      total_processed: backfillState?.bills_processed ?? 0,
      total_stored: backfillState?.votes_processed ?? 0,
    })
  }

  // Fetch window: cursor - 3 days to cursor (smaller windows to stay under Vercel 60s limit)
  // Congress.gov requires format: YYYY-MM-DDTHH:MM:SSZ (no milliseconds)
  const fmtDate = (d: Date) => d.toISOString().replace(/\.\d{3}Z$/, 'Z')
  const windowStart = new Date(cursor.getTime() - 3 * 24 * 60 * 60 * 1000)
  const fromDateTime = fmtDate(windowStart < ninetyDaysAgo ? ninetyDaysAgo : windowStart)
  const toDateTime = fmtDate(cursor)

  console.log(`[backfill] Bills window: ${fromDateTime} → ${toDateTime}`)

  try {
    // 1. Fetch bills for this window (pass toDateTime to avoid overlap)
    const rawItems = await fetchRecentBills(fromDateTime, 100, toDateTime)
    console.log(`[backfill] Fetched ${rawItems.length} bills`)

    let stored = 0
    let analyzed = 0

    if (rawItems.length > 0) {
      // 2. Dedup against existing DB
      const congressIds = rawItems.map(item => item.congress_gov_id).filter(Boolean)
      const { data: existing } = await adminClient
        .from('signals')
        .select('congress_gov_id')
        .in('congress_gov_id', congressIds)
      const existingIds = new Set((existing ?? []).map((e: any) => e.congress_gov_id))
      const newItems = rawItems.filter(item => !existingIds.has(item.congress_gov_id))
      console.log(`[backfill] ${newItems.length} new items (${existingIds.size} already in DB)`)

      if (newItems.length > 0) {
        // 3. Filter for market relevance
        const relevant = await filterForMarketRelevance(newItems)
        console.log(`[backfill] ${relevant.length} passed market-relevance filter`)

        if (relevant.length > 0) {
          // 4. Only enrich the subset we'll analyze (enriching all 100+ burns too much time)
          const toEnrich = relevant.slice(0, 8)
          const enriched = await enrichBillItems(toEnrich)

          // 5. Analyze (max 8 per call to stay within Vercel 60s limit)
          console.log(`[backfill] Analyzing ${enriched.length} items...`)
          const results = await analyzeBatch(enriched, 3)
          analyzed = results.length

          // 6. Quality gate + store
          const quality = results.filter((s: any) => {
            const score = s?.impact_score ?? 0
            const sectors = s?.affected_sectors ?? []
            return score > 2 || sectors.length > 0
          })

          for (const signal of quality) {
            const { error: insertError } = await adminClient.from('signals').insert({
              event_type: signal?.event_type ?? 'bill',
              title: signal?.title ?? 'Untitled',
              summary: signal?.summary ?? '',
              full_analysis: signal?.full_analysis ?? null,
              impact_score: signal?.impact_score ?? 5,
              sentiment: signal?.sentiment ?? 'neutral',
              affected_sectors: signal?.affected_sectors ?? [],
              tickers: signal?.tickers ?? [],
              source_url: signal?.source_url ?? null,
              congress_gov_id: signal?.congress_gov_id ?? null,
              bill_number: signal?.bill_number ?? null,
              committee: signal?.committee ?? null,
              legislators: signal?.legislators ?? [],
              event_date: signal?.event_date ?? new Date().toISOString(),
              key_takeaways: signal?.key_takeaways ?? [],
              market_implications: signal?.market_implications ?? null,
            })
            if (!insertError) stored++
          }
        }
      }
    }

    // 7. Move cursor backward
    const newCursor = windowStart < ninetyDaysAgo ? ninetyDaysAgo : windowStart
    const totalProcessed = (backfillState?.bills_processed ?? 0) + rawItems.length
    const totalStored = (backfillState?.votes_processed ?? 0) + stored

    await adminClient.from('poll_state').upsert({
      id: 'backfill_bills',
      last_poll_time: new Date().toISOString(),
      bills_processed: totalProcessed,
      votes_processed: totalStored, // reusing field for total stored count
      errors: newCursor.toISOString(), // reusing field for cursor
    }, { onConflict: 'id' })

    const isComplete = newCursor <= ninetyDaysAgo
    const elapsed = Date.now() - startTime
    const daysRemaining = isComplete ? 0 : Math.ceil((newCursor.getTime() - ninetyDaysAgo.getTime()) / (24 * 60 * 60 * 1000))

    return NextResponse.json({
      status: isComplete ? 'complete' : 'in_progress',
      window: { from: fromDateTime, to: toDateTime },
      batch: { fetched: rawItems.length, analyzed, stored },
      totals: { processed: totalProcessed, stored: totalStored },
      days_remaining: daysRemaining,
      elapsed_ms: elapsed,
      message: isComplete
        ? `Bill backfill complete. ${totalStored} signals stored from ${totalProcessed} bills.`
        : `Processed 3-day window. ~${daysRemaining} days remaining. Call again to continue.`,
    })
  } catch (error: any) {
    console.error('[backfill] Error:', error)
    return NextResponse.json({ status: 'error', error: error?.message ?? 'Backfill failed' }, { status: 500 })
  }
}

/**
 * Backfill contracts: uses poll_state row 'backfill_contracts' to track progress.
 * Each call processes one sector. Tracks which sectors are done.
 */
async function backfillContracts() {
  const startTime = Date.now()
  const adminClient = createAdminClient()

  // Get backfill state
  let backfillState: any = null
  try {
    const { data } = await adminClient
      .from('poll_state')
      .select('*')
      .eq('id', 'backfill_contracts')
      .single()
    backfillState = data
  } catch { /* first call */ }

  const allSectors = Object.keys(SECTOR_NAICS_MAP)
  const completedSectors: string[] = backfillState?.errors
    ? JSON.parse(backfillState.errors)
    : []
  const remainingSectors = allSectors.filter(s => !completedSectors.includes(s))

  if (remainingSectors.length === 0) {
    return NextResponse.json({
      status: 'complete',
      message: `Contract backfill complete. ${backfillState?.votes_processed ?? 0} signals stored across all sectors.`,
      total_stored: backfillState?.votes_processed ?? 0,
    })
  }

  // Process next 2 sectors
  const batch = remainingSectors.slice(0, 2)
  console.log(`[backfill] Contract sectors: ${batch.join(', ')} (${remainingSectors.length} remaining)`)

  try {
    // 90-day lookback for contracts
    const sinceDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    // Fetch from all batch sectors with lower threshold ($10M)
    const rawContracts = await fetchSectorContracts(batch, sinceDate, 30)
    console.log(`[backfill] Fetched ${rawContracts.length} contracts for ${batch.join(', ')}`)

    let stored = 0

    if (rawContracts.length > 0) {
      // Dedup against existing
      const contractIds = rawContracts.map(c => `contract-${c.generated_internal_id}`)
      const { data: existing } = await adminClient
        .from('signals')
        .select('congress_gov_id')
        .in('congress_gov_id', contractIds)
      const existingIds = new Set((existing ?? []).map((e: any) => e.congress_gov_id))
      const newContracts = rawContracts.filter(c => !existingIds.has(`contract-${c.generated_internal_id}`))
      console.log(`[backfill] ${newContracts.length} new contracts`)

      if (newContracts.length > 0) {
        // Filter for relevance
        const relevant = await filterContractsForRelevance(newContracts)
        console.log(`[backfill] ${relevant.length} passed relevance filter`)

        if (relevant.length > 0) {
          // Get bill signals for context
          const { data: billSignals } = await adminClient
            .from('signals')
            .select('title, bill_number, sentiment, impact_score, affected_sectors, event_type')
            .in('event_type', ['bill', 'vote', 'hearing'])
            .order('created_at', { ascending: false })
            .limit(20)

          const relatedBills: Array<Partial<Signal>> = (billSignals ?? []) as Array<Partial<Signal>>

          // Analyze (max 10 per call)
          const toAnalyze = relevant.slice(0, 10)
          console.log(`[backfill] Analyzing ${toAnalyze.length} contracts...`)

          for (let i = 0; i < toAnalyze.length; i += 3) {
            const chunk = toAnalyze.slice(i, i + 3)
            const results = await Promise.allSettled(
              chunk.map((contract: RawContractItem) => analyzeContractItem(contract, relatedBills))
            )
            for (const r of results) {
              if (r.status === 'fulfilled' && r.value) {
                const signal = r.value
                // Quality gate
                const score = signal?.impact_score ?? 0
                const sectors = signal?.affected_sectors ?? []
                if (score <= 2 && sectors.length === 0) continue

                const { error: insertError } = await adminClient.from('signals').insert({
                  event_type: signal?.event_type ?? 'contract_award',
                  title: signal?.title ?? 'Untitled',
                  summary: signal?.summary ?? '',
                  full_analysis: signal?.full_analysis ?? null,
                  impact_score: signal?.impact_score ?? 5,
                  sentiment: signal?.sentiment ?? 'neutral',
                  affected_sectors: signal?.affected_sectors ?? [],
                  tickers: signal?.tickers ?? [],
                  source_url: signal?.source_url ?? null,
                  congress_gov_id: signal?.congress_gov_id ?? null,
                  bill_number: null,
                  committee: null,
                  legislators: [],
                  event_date: signal?.event_date ?? new Date().toISOString(),
                  key_takeaways: signal?.key_takeaways ?? [],
                  market_implications: signal?.market_implications ?? null,
                })
                if (!insertError) stored++
              }
            }
            if (i + 3 < toAnalyze.length) {
              await new Promise(r => setTimeout(r, 500))
            }
          }
        }
      }
    }

    // Update state
    const newCompleted = [...completedSectors, ...batch]
    const totalStored = (backfillState?.votes_processed ?? 0) + stored

    await adminClient.from('poll_state').upsert({
      id: 'backfill_contracts',
      last_poll_time: new Date().toISOString(),
      bills_processed: newCompleted.length,
      votes_processed: totalStored,
      errors: JSON.stringify(newCompleted),
    }, { onConflict: 'id' })

    const isComplete = newCompleted.length >= allSectors.length
    const elapsed = Date.now() - startTime

    return NextResponse.json({
      status: isComplete ? 'complete' : 'in_progress',
      sectors_processed: batch,
      sectors_remaining: allSectors.filter(s => !newCompleted.includes(s)),
      batch: { fetched: rawContracts.length, stored },
      totals: { sectors_done: newCompleted.length, sectors_total: allSectors.length, stored: totalStored },
      elapsed_ms: elapsed,
      message: isComplete
        ? `Contract backfill complete. ${totalStored} signals stored.`
        : `Processed ${batch.join(', ')}. ${allSectors.length - newCompleted.length} sectors remaining. Call again.`,
    })
  } catch (error: any) {
    console.error('[backfill] Error:', error)
    return NextResponse.json({ status: 'error', error: error?.message ?? 'Backfill failed' }, { status: 500 })
  }
}
