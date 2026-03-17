export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { NextResponse } from 'next/server'
import { fetchRecentContracts, fetchSectorContracts, SECTOR_NAICS_MAP } from '@/lib/usaspending-api'
import { analyzeContractItem, filterContractsForRelevance } from '@/lib/gemini-analysis'
import type { RawContractItem } from '@/lib/gemini-analysis'
import type { Signal } from '@/lib/types'
import { createAdminClient, createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * GET /api/cron/poll-contracts
 * Polls USAspending.gov for recent large contract awards,
 * cross-references with existing bill signals, and stores analyzed results.
 * Auth: cron secret (header or query param) OR authenticated user session.
 */
export async function GET(request: Request) {
  // Try cron secret first (header or query param)
  const authHeader = request.headers.get('authorization')
  const url = new URL(request.url)
  const secretParam = url.searchParams.get('secret')
  const cronSecretMatch = process.env.CRON_SECRET && (
    authHeader === `Bearer ${process.env.CRON_SECRET}` || secretParam === process.env.CRON_SECRET
  )

  if (!cronSecretMatch) {
    // Fall back to user session auth (for Poll Now from dashboard)
    try {
      const supabase = await createServerSupabaseClient()
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  // Optional: target specific sector for context-aware polling
  const targetSector = url.searchParams.get('sector') ?? undefined
  return runContractPoll(targetSector)
}

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return runContractPoll()
}

async function runContractPoll(targetSector?: string) {
  const startTime = Date.now()

  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY not configured.' }, { status: 503 })
    }

    const adminClient = createAdminClient()

    // Get last poll time for contracts
    let sinceDate: string | undefined
    try {
      const { data: pollState } = await adminClient
        .from('poll_state')
        .select('last_poll_time')
        .eq('id', 'contracts')
        .single()
      if (pollState?.last_poll_time) {
        // Convert ISO datetime to YYYY-MM-DD for USAspending
        sinceDate = pollState.last_poll_time.split('T')[0]
      }
    } catch {
      // First contract poll — no state yet, will default to 7 days ago
    }

    // Cooldown: skip if polled within 30 min
    if (sinceDate) {
      const { data: pollState } = await adminClient
        .from('poll_state')
        .select('last_poll_time')
        .eq('id', 'contracts')
        .single()
      const lastPoll = new Date(pollState?.last_poll_time ?? 0).getTime()
      const fifteenMinAgo = Date.now() - 15 * 60 * 1000
      if (lastPoll > fifteenMinAgo) {
        return NextResponse.json({
          status: 'skipped',
          message: 'Last contract poll was less than 15 minutes ago',
        })
      }
    }

    // 1. Fetch contracts: generic large contracts + sector-targeted in parallel
    // If a target sector is specified (from Poll Now), prioritize that sector
    const sectorsToFetch = targetSector && SECTOR_NAICS_MAP[targetSector]
      ? [targetSector]
      : Object.keys(SECTOR_NAICS_MAP)
    const sectorLimit = targetSector ? 25 : 10
    console.log(`[contracts] Polling USAspending.gov (generic + ${sectorsToFetch.length} sectors${targetSector ? ` [targeted: ${targetSector}]` : ''})...`)
    const [genericResult, sectorResult] = await Promise.allSettled([
      fetchRecentContracts(sinceDate, 25_000_000, 75),
      fetchSectorContracts(sectorsToFetch, sinceDate, sectorLimit),
    ])

    // Merge and deduplicate
    const genericContracts = genericResult.status === 'fulfilled' ? genericResult.value : []
    const sectorContracts = sectorResult.status === 'fulfilled' ? sectorResult.value : []
    const mergedMap = new Map<string, RawContractItem>()
    for (const c of [...genericContracts, ...sectorContracts]) {
      if (!mergedMap.has(c.generated_internal_id)) {
        mergedMap.set(c.generated_internal_id, c)
      }
    }
    const rawContracts = Array.from(mergedMap.values())
    console.log(`[contracts] Fetched ${genericContracts.length} generic + ${sectorContracts.length} sector-targeted → ${rawContracts.length} unique`)

    if (rawContracts.length === 0) {
      await updateContractPollState(adminClient, 0, 0, null)
      return NextResponse.json({ status: 'ok', message: 'No new contracts', items_fetched: 0 })
    }

    // 2. Dedup against existing signals
    const contractIds = rawContracts.map(c => `contract-${c.generated_internal_id}`).filter(Boolean)
    const { data: existing } = await adminClient
      .from('signals')
      .select('congress_gov_id')
      .in('congress_gov_id', contractIds)

    const existingIds = new Set((existing ?? []).map((e: any) => e.congress_gov_id))
    const newContracts = rawContracts.filter(c => !existingIds.has(`contract-${c.generated_internal_id}`))
    console.log(`[contracts] ${newContracts.length} new contracts (${existingIds.size} already in DB)`)

    if (newContracts.length === 0) {
      await updateContractPollState(adminClient, rawContracts.length, 0, null)
      return NextResponse.json({ status: 'ok', message: 'All contracts already processed', items_fetched: rawContracts.length })
    }

    // 3. AI relevance filter
    const relevant = await filterContractsForRelevance(newContracts)
    console.log(`[contracts] ${relevant.length} contracts passed relevance filter`)

    if (relevant.length === 0) {
      await updateContractPollState(adminClient, rawContracts.length, 0, null)
      return NextResponse.json({ status: 'ok', message: 'No market-relevant contracts', items_fetched: rawContracts.length, items_new: newContracts.length })
    }

    // 4. Fetch related bill signals from DB for context
    // Look for bill signals in the same sectors that these contracts touch
    const { data: recentBillSignals } = await adminClient
      .from('signals')
      .select('title, bill_number, sentiment, impact_score, affected_sectors, event_type')
      .in('event_type', ['bill', 'vote', 'hearing'])
      .order('created_at', { ascending: false })
      .limit(20)

    const billSignals: Array<Partial<Signal>> = (recentBillSignals ?? []) as Array<Partial<Signal>>

    // 5. Analyze each contract (max 15 per poll)
    const toAnalyze = relevant.slice(0, 15)
    console.log(`[contracts] Analyzing ${toAnalyze.length} contracts...`)

    const analyzed: Array<Partial<Signal>> = []
    for (let i = 0; i < toAnalyze.length; i += 2) {
      const chunk = toAnalyze.slice(i, i + 2)
      const results = await Promise.allSettled(
        chunk.map((contract: RawContractItem) => analyzeContractItem(contract, billSignals))
      )
      for (const r of results) {
        if (r.status === 'fulfilled' && r.value) {
          analyzed.push(r.value)
        }
      }
      // Small delay between chunks
      if (i + 2 < toAnalyze.length) {
        await new Promise(r => setTimeout(r, 500))
      }
    }
    console.log(`[contracts] Got ${analyzed.length} analyses`)

    // 6. Quality gate
    const quality = analyzed.filter((s: any) => {
      const score = s?.impact_score ?? 0
      const sectors = s?.affected_sectors ?? []
      if (score <= 2 && sectors.length === 0) {
        console.log(`[contracts] Skipping low-quality: "${s?.title?.slice(0, 50)}" (score=${score})`)
        return false
      }
      return true
    })
    console.log(`[contracts] ${quality.length}/${analyzed.length} passed quality gate`)

    // 7. Store in Supabase
    let inserted = 0
    for (const signal of quality) {
      try {
        const { error: insertError } = await adminClient
          .from('signals')
          .insert({
            event_type: signal?.event_type ?? 'contract_award',
            title: signal?.title ?? 'Untitled Contract',
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

        if (insertError) {
          console.error('[contracts] Insert error:', insertError.message)
        } else {
          inserted++
        }
      } catch (err: any) {
        console.error('[contracts] Failed to insert:', err?.message)
      }
    }

    // 8. Update poll state
    await updateContractPollState(adminClient, rawContracts.length, inserted, null)

    const elapsed = Date.now() - startTime
    return NextResponse.json({
      status: 'ok',
      items_fetched: rawContracts.length,
      items_new: newContracts.length,
      items_relevant: relevant.length,
      items_analyzed: analyzed.length,
      items_stored: inserted,
      elapsed_ms: elapsed,
    })
  } catch (error: any) {
    console.error('[contracts] Poll error:', error)
    return NextResponse.json({
      status: 'error',
      error: error?.message ?? 'Contract poll failed',
    }, { status: 500 })
  }
}

async function updateContractPollState(adminClient: any, fetched: number, stored: number, errors: string | null) {
  try {
    await adminClient.from('poll_state').upsert({
      id: 'contracts',
      last_poll_time: new Date().toISOString(),
      bills_processed: fetched,
      votes_processed: stored,
      errors: errors,
    }, { onConflict: 'id' })
  } catch (err: any) {
    console.error('[contracts] Failed to update poll state:', err?.message)
  }
}
