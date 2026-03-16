export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { fetchAllRecent } from '@/lib/congress-api'
import { analyzeBatch } from '@/lib/gemini-analysis'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * GET /api/signals
 * Fetches signals from Supabase. If ?refresh=true, runs a poll first then returns results.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request?.url ?? '')
    const refresh = searchParams?.get?.('refresh') === 'true'
    const force = searchParams?.get?.('force') === 'true'
    const sector = searchParams?.get?.('sector')
    const limit = parseInt(searchParams?.get?.('limit') ?? '50') || 50

    // If refresh requested, run the poll SYNCHRONOUSLY before returning
    if (refresh && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        console.log('[signals] Refresh requested — running poll inline...')
        const adminClient = createAdminClient()

        // Check rate limit (2 min cooldown, skipped if force=true)
        let skipPoll = false
        if (!force) {
          try {
            const { data: pollState } = await adminClient
              .from('poll_state')
              .select('last_poll_time')
              .single()
            if (pollState?.last_poll_time) {
              const lastPoll = new Date(pollState.last_poll_time)?.getTime?.() ?? 0
              if (lastPoll > Date.now() - 2 * 60 * 1000) {
                console.log('[signals] Skipping poll — last poll was < 2 min ago')
                skipPoll = true
              }
            }
          } catch { /* first poll */ }
        }

        if (!skipPoll) {
          const rawItems = await fetchAllRecent()
          console.log(`[signals] Fetched ${rawItems?.length ?? 0} items from Congress.gov`)

          if ((rawItems?.length ?? 0) > 0) {
            // Filter already-processed
            const congressIds = (rawItems ?? [])?.map?.((item: any) => item?.congress_gov_id)?.filter?.(Boolean) ?? []
            const { data: existing } = await adminClient
              .from('signals')
              .select('congress_gov_id')
              .in('congress_gov_id', congressIds)
            const existingIds = new Set((existing ?? [])?.map?.((e: any) => e?.congress_gov_id))
            const newItems = (rawItems ?? [])?.filter?.((item: any) => !existingIds?.has?.(item?.congress_gov_id))

            if ((newItems?.length ?? 0) > 0) {
              const toAnalyze = newItems?.slice?.(0, 5) ?? []
              console.log(`[signals] Analyzing ${toAnalyze?.length} new items with AI...`)
              const analyzed = await analyzeBatch(toAnalyze, 5)

              for (const signal of analyzed ?? []) {
                try {
                  await adminClient.from('signals').upsert({
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
                } catch (err: any) {
                  console.error('Insert error:', err?.message)
                }
              }
              console.log(`[signals] Stored ${analyzed?.length ?? 0} new signals`)
            }
          }

          // Update poll state
          try {
            await adminClient.from('poll_state').upsert({
              id: 'main',
              last_poll_time: new Date().toISOString(),
              bills_processed: rawItems?.length ?? 0,
              votes_processed: 0,
              errors: null,
            }, { onConflict: 'id' })
          } catch { /* non-critical */ }
        }
      } catch (err: any) {
        console.error('[signals] Inline poll error:', err?.message)
        // Continue to return whatever signals exist
      }
    }

    const supabase = await createServerSupabaseClient()

    let query = supabase
      .from('signals')
      .select('*')
      .order('event_date', { ascending: false })
      .limit(limit)

    if (sector && sector !== 'all') {
      query = query.contains('affected_sectors', [sector])
    }

    const { data, error } = await query

    if (error) {
      console.error('Supabase signals error:', error)
      return NextResponse.json({ signals: [], error: error?.message ?? 'Database error' }, { status: 200 })
    }

    return NextResponse.json({ signals: data ?? [] })
  } catch (error: any) {
    console.error('Signals API error:', error)
    return NextResponse.json({ signals: [], error: error?.message ?? 'Failed to fetch signals' }, { status: 500 })
  }
}
