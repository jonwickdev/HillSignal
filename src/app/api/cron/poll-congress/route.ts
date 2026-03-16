export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { fetchAllRecent } from '@/lib/congress-api'
import { analyzeBatch } from '@/lib/gemini-analysis'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * POST /api/cron/poll-congress
 * Polls Congress.gov for recent activity, analyzes with Gemini, stores in Supabase.
 */
export async function POST(request: Request) {
  const startTime = Date.now()
  
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({
        error: 'SUPABASE_SERVICE_ROLE_KEY not configured. Cannot write to database.',
        hint: 'Set the SUPABASE_SERVICE_ROLE_KEY environment variable.',
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

    // Check if we polled recently (within 10 min) to avoid hammering
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

    // 3. Analyze with Gemini (batch, max 10 items per poll to control costs)
    const toAnalyze = newItems?.slice?.(0, 10) ?? []
    console.log(`Analyzing ${toAnalyze?.length ?? 0} items with Gemini...`)
    const analyzed = await analyzeBatch(toAnalyze, 2)
    console.log(`Got ${analyzed?.length ?? 0} analyses`)

    // 4. Store in Supabase
    let inserted = 0
    for (const signal of analyzed ?? []) {
      try {
        const { error: insertError } = await adminClient
          .from('signals')
          .upsert({
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
          }, { onConflict: 'congress_gov_id' })

        if (insertError) {
          console.error('Insert error:', insertError?.message)
        } else {
          inserted++
        }
      } catch (err: any) {
        console.error('Failed to insert signal:', err?.message)
      }
    }

    // 5. Update poll state
    await updatePollState(adminClient, rawItems?.length ?? 0, inserted, null)

    const elapsed = Date.now() - startTime
    return NextResponse.json({
      status: 'ok',
      items_fetched: rawItems?.length ?? 0,
      items_new: newItems?.length ?? 0,
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
