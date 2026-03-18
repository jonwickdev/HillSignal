export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { NextResponse } from 'next/server'
import { fetchRecentBills } from '@/lib/congress-api'
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
  const reset = url.searchParams.get('reset') === 'true'

  // Reset cursor if requested — allows re-running backfill to fill gaps
  if (reset) {
    const adminClient = createAdminClient()
    const stateId = type === 'contracts' ? 'backfill_contracts' : 'backfill_bills'
    await adminClient.from('poll_state').delete().eq('id', stateId)
    return NextResponse.json({
      status: 'reset',
      message: `Backfill cursor for ${type} has been reset. Run again without &reset=true to start fresh.`,
    })
  }
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

  // Fetch window: cursor - 7 days to cursor
  // Congress.gov requires format: YYYY-MM-DDTHH:MM:SSZ (no milliseconds)
  const fmtDate = (d: Date) => d.toISOString().replace(/\.\d{3}Z$/, 'Z')
  const windowStart = new Date(cursor.getTime() - 7 * 24 * 60 * 60 * 1000)
  const fromDateTime = fmtDate(windowStart < ninetyDaysAgo ? ninetyDaysAgo : windowStart)
  const toDateTime = fmtDate(cursor)

  console.log(`[backfill] Bills window: ${fromDateTime} → ${toDateTime}`)

  try {
    // 1. Fetch bills for this window (pass toDateTime to avoid overlap)
    const rawItems = await fetchRecentBills(fromDateTime, 250, toDateTime)
    console.log(`[backfill] Fetched ${rawItems.length} bills`)

    let stored = 0
    let analyzed = 0
    let relevantCount = 0

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
        relevantCount = relevant.length
        console.log(`[backfill] ${relevant.length} passed market-relevance filter`)

        if (relevant.length > 0) {
          // STRATEGY: Store ALL relevant bills. Deep AI analysis for top 20,
          // basic metadata records for the rest. This builds a comprehensive
          // database for "follow the money" analysis later.

          const analyzedIds = new Set<string>()

          // 4a. Deep analysis for top 20 (no enrichment — list data is sufficient)
          const toAnalyze = relevant.slice(0, 20)
          console.log(`[backfill] Deep-analyzing ${toAnalyze.length} of ${relevant.length} relevant items...`)
          const results = await analyzeBatch(toAnalyze, 5)
          analyzed = results.length

          // Store deep-analyzed signals (with quality gate)
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
            if (!insertError) {
              stored++
              if (signal?.congress_gov_id) analyzedIds.add(signal.congress_gov_id)
            }
          }

          // 4b. Bulk-store remaining relevant bills as basic records (no AI call needed)
          // These have title, policy area, source URL, and bill number from Congress.gov
          const remaining = relevant.filter(item => !analyzedIds.has(item.congress_gov_id))
          if (remaining.length > 0) {
            const basicRows = remaining.map(item => {
              const policyArea = item?.raw?.policyArea?.name ?? null
              return {
                event_type: 'bill',
                title: item?.title ?? 'Untitled',
                summary: item?.description ?? '',
                full_analysis: null,
                impact_score: 3,
                sentiment: 'neutral',
                affected_sectors: policyArea ? [policyArea] : [],
                tickers: [],
                source_url: item?.source_url ?? null,
                congress_gov_id: item?.congress_gov_id ?? null,
                bill_number: item?.bill_number ?? null,
                committee: item?.committee ?? null,
                legislators: item?.legislators ?? [],
                event_date: item?.date ?? new Date().toISOString(),
                key_takeaways: [],
                market_implications: null,
              }
            })
            // Insert in chunks of 50 to stay under Supabase payload limits
            let basicStored = 0
            for (let i = 0; i < basicRows.length; i += 50) {
              const chunk = basicRows.slice(i, i + 50)
              const { error: bulkErr, data: bulkData } = await adminClient
                .from('signals')
                .insert(chunk)
                .select('id')
              if (!bulkErr) basicStored += (bulkData?.length ?? chunk.length)
            }
            stored += basicStored
            console.log(`[backfill] Stored ${quality.length} deep-analyzed + ${basicStored} basic records = ${stored} total`)
          } else {
            console.log(`[backfill] Stored ${quality.length} deep-analyzed signals (all relevant were analyzed)`)
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
      batch: { fetched: rawItems.length, relevant: relevantCount, deep_analyzed: analyzed, stored_total: stored },
      totals: { processed: totalProcessed, stored: totalStored },
      days_remaining: daysRemaining,
      elapsed_ms: elapsed,
      message: isComplete
        ? `Bill backfill complete. ${totalStored} signals stored from ${totalProcessed} bills.`
        : `Processed 7-day window. ~${daysRemaining} days remaining. Call again to continue.`,
    })
  } catch (error: any) {
    console.error('[backfill] Error:', error)
    return NextResponse.json({ status: 'error', error: error?.message ?? 'Backfill failed' }, { status: 500 })
  }
}

/**
 * Backfill contracts: processes ONE sector per call with pagination.
 * State tracked in poll_state 'backfill_contracts':
 *   - errors: JSON { completedSectors: string[], currentSector: string|null, currentPage: number }
 *   - votes_processed: total contracts stored
 *
 * 30-day lookback, $10M minimum, all 12 tracked sectors.
 * Call repeatedly until status === 'complete'.
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

  // Parse state
  let state: { completedSectors: string[]; currentSector: string | null; currentPage: number } = {
    completedSectors: [],
    currentSector: null,
    currentPage: 1,
  }
  if (backfillState?.errors) {
    try {
      const parsed = JSON.parse(backfillState.errors)
      // Handle legacy format (string array)
      if (Array.isArray(parsed)) {
        state = { completedSectors: parsed, currentSector: null, currentPage: 1 }
      } else {
        state = { ...state, ...parsed }
      }
    } catch { /* fresh start */ }
  }

  const allSectors = Object.keys(SECTOR_NAICS_MAP)
  const remainingSectors = allSectors.filter(s => !state.completedSectors.includes(s))

  // If no current sector, pick next
  if (!state.currentSector) {
    if (remainingSectors.length === 0) {
      return NextResponse.json({
        status: 'complete',
        message: `Contract backfill complete. ${backfillState?.votes_processed ?? 0} signals stored across all ${allSectors.length} sectors.`,
        total_stored: backfillState?.votes_processed ?? 0,
        sectors: allSectors.length,
      })
    }
    state.currentSector = remainingSectors[0]
    state.currentPage = 1
  }

  const sector = state.currentSector!
  const naicsCodes = SECTOR_NAICS_MAP[sector]
  console.log(`[backfill] Processing sector: ${sector} (page ${state.currentPage})`)

  try {
    // 30-day lookback, $10M minimum
    const sinceDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const endDate = new Date().toISOString().split('T')[0]

    // Fetch one page of contracts for this sector (100 per page)
    const { items: rawContracts, hasMore } = await fetchRecentContracts(
      sinceDate, 10_000_000, 100, naicsCodes, state.currentPage, endDate
    )
    console.log(`[backfill] Fetched ${rawContracts.length} contracts for ${sector} page ${state.currentPage} (hasMore: ${hasMore})`)

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
      console.log(`[backfill] ${newContracts.length} new contracts (${existingIds.size} already in DB)`)

      if (newContracts.length > 0) {
        // Filter for relevance
        const relevant = await filterContractsForRelevance(newContracts)
        console.log(`[backfill] ${relevant.length} passed relevance filter`)

        if (relevant.length > 0) {
          // Get bill signals for context
          const { data: billSignals } = await adminClient
            .from('signals')
            .select('title, bill_number, sentiment, impact_score, affected_sectors, event_type')
            .eq('event_type', 'bill')
            .order('created_at', { ascending: false })
            .limit(20)

          const relatedBills: Array<Partial<Signal>> = (billSignals ?? []) as Array<Partial<Signal>>

          // Analyze up to 15 per call (3 at a time for parallelism)
          const toAnalyze = relevant.slice(0, 15)
          console.log(`[backfill] Analyzing ${toAnalyze.length} contracts...`)

          for (let i = 0; i < toAnalyze.length; i += 3) {
            // Time check: bail if we're approaching 55s
            if (Date.now() - startTime > 50_000) {
              console.log(`[backfill] Approaching timeout, saving progress (analyzed ${i}/${toAnalyze.length})`)
              break
            }
            const chunk = toAnalyze.slice(i, i + 3)
            const results = await Promise.allSettled(
              chunk.map((contract: RawContractItem) => analyzeContractItem(contract, relatedBills))
            )
            for (const r of results) {
              if (r.status === 'fulfilled' && r.value) {
                const signal = r.value
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
                  raw_data: (signal as any)?.raw_data ?? null,
                })
                if (!insertError) stored++
              }
            }
            if (i + 3 < toAnalyze.length) {
              await new Promise(r => setTimeout(r, 300))
            }
          }
        }
      }
    }

    // Advance state
    const totalStored = (backfillState?.votes_processed ?? 0) + stored
    if (hasMore && rawContracts.length > 0) {
      // More pages in this sector
      state.currentPage++
    } else {
      // Sector complete, move to next
      state.completedSectors.push(sector)
      state.currentSector = null
      state.currentPage = 1
    }

    const sectorsRemaining = allSectors.filter(s => !state.completedSectors.includes(s))
    const isComplete = state.currentSector === null && sectorsRemaining.length === 0

    await adminClient.from('poll_state').upsert({
      id: 'backfill_contracts',
      last_poll_time: new Date().toISOString(),
      bills_processed: state.completedSectors.length,
      votes_processed: totalStored,
      errors: JSON.stringify(state),
    }, { onConflict: 'id' })

    const elapsed = Date.now() - startTime

    return NextResponse.json({
      status: isComplete ? 'complete' : 'in_progress',
      current_sector: sector,
      current_page: hasMore ? state.currentPage : 'done',
      sectors_completed: state.completedSectors,
      sectors_remaining: sectorsRemaining.filter(s => s !== state.currentSector),
      batch: { fetched: rawContracts.length, stored },
      totals: { sectors_done: state.completedSectors.length, sectors_total: allSectors.length, stored: totalStored },
      elapsed_ms: elapsed,
      message: isComplete
        ? `Contract backfill complete. ${totalStored} signals stored across ${allSectors.length} sectors.`
        : `${sector} page ${hasMore ? state.currentPage - 1 : state.currentPage}: ${rawContracts.length} fetched, ${stored} stored. Call again to continue.`,
    })
  } catch (error: any) {
    console.error('[backfill] Error:', error)
    return NextResponse.json({ status: 'error', error: error?.message ?? 'Backfill failed' }, { status: 500 })
  }
}
