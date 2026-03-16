export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { NextResponse } from 'next/server'
import { fetchAllRecent } from '@/lib/congress-api'
import { analyzeBatch, filterForMarketRelevance } from '@/lib/gemini-analysis'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * GET /api/cron/poll-congress
 * Vercel cron triggers this via GET.
 * Polls Congress.gov for recent activity, analyzes with RouteLLM, stores in Supabase.
 */
export async function GET(request: Request) {
  // Verify cron secret if set (Vercel sends this header)
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return runPoll()
}

/** POST handler kept for manual triggers */
export async function POST(request: Request) {
  return runPoll()
}

async function runPoll() {
  const startTime = Date.now()

  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({
        error: 'SUPABASE_SERVICE_ROLE_KEY not configured.',
      }, { status: 503 })
    }

    const adminClient = createAdminClient()

    // Get last poll time
    let fromDateTime: string | undefined
    try {
      const { data: pollState } = await adminClient
        .from('poll_state')
        .select('last_poll_time')
        .single()
      if (pollState?.last_poll_time) {
        fromDateTime = pollState.last_poll_time
      }
    } catch {
      // First poll - no state yet
    }

    // Cooldown: skip if polled within 10 min
    if (fromDateTime) {
      const lastPoll = new Date(fromDateTime)?.getTime?.() ?? 0
      const tenMinAgo = Date.now() - 10 * 60 * 1000
      if (lastPoll > tenMinAgo) {
        return NextResponse.json({
          status: 'skipped',
          message: 'Last poll was less than 10 minutes ago',
          last_poll: fromDateTime,
        })
      }
    }

    // 1. Fetch from Congress.gov
    console.log('Polling Congress.gov...', fromDateTime ? `since ${fromDateTime}` : 'initial poll')
    const rawItems = await fetchAllRecent(fromDateTime)
    console.log(`Fetched ${rawItems?.length ?? 0} items from Congress.gov`)

    if ((rawItems?.length ?? 0) === 0) {
      await updatePollState(adminClient, 0, 0, null)
      return NextResponse.json({ status: 'ok', message: 'No new items', items_fetched: 0 })
    }

    // 2. Filter out already-processed items
    const congressIds = (rawItems ?? [])?.map?.((item: any) => item?.congress_gov_id)?.filter?.(Boolean) ?? []
    const { data: existing } = await adminClient
      .from('signals')
      .select('congress_gov_id')
      .in('congress_gov_id', congressIds)

    const existingIds = new Set((existing ?? [])?.map?.((e: any) => e?.congress_gov_id))
    const newItems = (rawItems ?? [])?.filter?.((item: any) => !existingIds?.has?.(item?.congress_gov_id))
    console.log(`${newItems?.length ?? 0} new items to analyze (${existingIds?.size ?? 0} already in DB)`)

    if ((newItems?.length ?? 0) === 0) {
      await updatePollState(adminClient, rawItems?.length ?? 0, 0, null)
      return NextResponse.json({ status: 'ok', message: 'All items already processed', items_fetched: rawItems?.length ?? 0 })
    }

    // 3. Pre-filter for market relevance (AI filter)
    const relevant = await filterForMarketRelevance(newItems ?? [])
    console.log(`${relevant?.length ?? 0} items passed market-relevance filter`)

    if ((relevant?.length ?? 0) === 0) {
      await updatePollState(adminClient, rawItems?.length ?? 0, 0, null)
      return NextResponse.json({ status: 'ok', message: 'No market-relevant items', items_fetched: rawItems?.length ?? 0, items_new: newItems?.length ?? 0 })
    }

    // 4. Analyze with RouteLLM (max 10 items per poll)
    const toAnalyze = relevant?.slice?.(0, 10) ?? []
    console.log(`Analyzing ${toAnalyze?.length ?? 0} items with RouteLLM...`)
    const analyzed = await analyzeBatch(toAnalyze, 2)
    console.log(`Got ${analyzed?.length ?? 0} analyses`)

    // 5. Quality gate: skip low-impact or vague analyses
    const quality = (analyzed ?? []).filter((s: any) => {
      const score = s?.impact_score ?? 0
      const sectors = s?.affected_sectors ?? []
      if (score <= 3 && sectors.length === 0) {
        console.log(`[cron] Skipping low-quality: "${s?.title?.slice?.(0, 50)}" (score=${score}, sectors=0)`)
        return false
      }
      return true
    })
    console.log(`[cron] ${quality.length}/${analyzed?.length ?? 0} passed quality gate`)

    // 6. Store in Supabase (insert, not upsert — we already filtered duplicates)
    let inserted = 0
    for (const signal of quality ?? []) {
      try {
        const { error: insertError } = await adminClient
          .from('signals')
          .insert({
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

        if (insertError) {
          console.error('Insert error:', insertError?.message)
        } else {
          inserted++
        }
      } catch (err: any) {
        console.error('Failed to insert signal:', err?.message)
      }
    }

    // 6. Update poll state
    await updatePollState(adminClient, rawItems?.length ?? 0, inserted, null)

    const elapsed = Date.now() - startTime
    return NextResponse.json({
      status: 'ok',
      items_fetched: rawItems?.length ?? 0,
      items_new: newItems?.length ?? 0,
      items_relevant: relevant?.length ?? 0,
      items_analyzed: analyzed?.length ?? 0,
      items_stored: inserted,
      elapsed_ms: elapsed,
    })
  } catch (error: any) {
    console.error('Poll error:', error)
    return NextResponse.json({
      status: 'error',
      error: error?.message ?? 'Poll failed',
    }, { status: 500 })
  }
}

async function updatePollState(adminClient: any, fetched: number, stored: number, errors: string | null) {
  try {
    await adminClient.from('poll_state').upsert({
      id: 'main',
      last_poll_time: new Date().toISOString(),
      bills_processed: fetched,
      votes_processed: stored,
      errors: errors,
    }, { onConflict: 'id' })
  } catch (err: any) {
    console.error('Failed to update poll state:', err?.message)
  }
}