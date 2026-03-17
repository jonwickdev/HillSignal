export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { NextResponse } from 'next/server'
import { createAdminClient, createServerSupabaseClient } from '@/lib/supabase/server'
import { fetchAllRecent } from '@/lib/congress-api'
import { analyzeBatch, filterForMarketRelevance } from '@/lib/gemini-analysis'

/**
 * GET /api/signals
 * Fetches signals from Supabase.
 * Query params:
 *   - view: 'analyzed' (default) | 'tracker' — controls quality filters
 *   - sector: sector name to filter by
 *   - sentiment: bullish | bearish | neutral
 *   - event_type: bill | vote | hearing | contract_award
 *   - search: text search
 *   - limit: page size (default 50)
 *   - offset: pagination offset
 *   - ids: comma-separated IDs for specific signals
 *   - refresh: trigger inline poll
 *   - force: skip rate limit on poll
 */
export async function GET(request: Request) {
  try {
    // Authenticate user
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request?.url ?? '')
    const refresh = searchParams?.get?.('refresh') === 'true'
    const force = searchParams?.get?.('force') === 'true'
    const sector = searchParams?.get?.('sector')
    const view = searchParams?.get?.('view') ?? 'analyzed'
    const limit = parseInt(searchParams?.get?.('limit') ?? '50') || 50

    // If refresh requested, run the poll SYNCHRONOUSLY before returning
    if (refresh && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        console.log('[signals] Refresh requested — running poll inline...')
        const adminClient = createAdminClient()

        // Check rate limit (1 min cooldown, skipped if force=true)
        let skipPoll = false
        if (!force) {
          try {
            const { data: pollState } = await adminClient
              .from('poll_state')
              .select('last_poll_time')
              .single()
            if (pollState?.last_poll_time) {
              const lastPoll = new Date(pollState.last_poll_time)?.getTime?.() ?? 0
              if (lastPoll > Date.now() - 1 * 60 * 1000) {
                console.log('[signals] Skipping poll — last poll was < 1 min ago')
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
              // Pre-filter: ask AI which items have real market impact
              console.log(`[signals] Pre-filtering ${newItems.length} items for market relevance...`)
              const relevant = await filterForMarketRelevance(newItems)
              console.log(`[signals] ${relevant.length}/${newItems.length} items deemed market-relevant`)

              const toAnalyze = relevant?.slice?.(0, 20) ?? []
              console.log(`[signals] Analyzing ${toAnalyze?.length} items with AI...`)
              const analyzed = await analyzeBatch(toAnalyze, 5)

              // Quality gate: skip low-impact or vague analyses
              const quality = (analyzed ?? []).filter((s: any) => {
                const score = s?.impact_score ?? 0
                const sectors = s?.affected_sectors ?? []
                if (score <= 3 && sectors.length === 0) {
                  console.log(`[signals] Skipping low-quality signal: "${s?.title?.slice?.(0, 50)}" (score=${score}, sectors=0)`)
                  return false
                }
                return true
              })
              console.log(`[signals] ${quality.length}/${analyzed?.length ?? 0} passed quality gate`)

              let storedCount = 0
              for (const signal of quality ?? []) {
                const { error: insertErr } = await adminClient.from('signals').insert({
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
                if (insertErr) {
                  console.error('[signals] Insert FAILED:', insertErr.message, insertErr.details)
                } else {
                  storedCount++
                }
              }
              console.log(`[signals] Successfully stored ${storedCount}/${analyzed?.length ?? 0} signals`)
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

    // Read params
    const offset = parseInt(searchParams?.get?.('offset') ?? '0') || 0
    const search = searchParams?.get?.('search')?.trim?.() ?? ''
    const ids = searchParams?.get?.('ids')?.split?.(',')?.filter?.(Boolean) ?? []

    // Use admin client to read signals — they're public data, no need for RLS
    const readClient = createAdminClient()

    // If specific IDs requested (e.g. favorited signals beyond 90 days), fetch by ID only
    if (ids.length > 0) {
      const { data: idData, error: idErr } = await readClient
        .from('signals')
        .select('*')
        .in('id', ids)
        .order('event_date', { ascending: false })

      if (idErr) {
        console.error('[signals] ID fetch FAILED:', idErr.message)
        return NextResponse.json({ signals: [], hasMore: false, totalCount: 0 }, { status: 200 })
      }
      return NextResponse.json({ signals: idData ?? [], hasMore: false, totalCount: idData?.length ?? 0 })
    }

    // 90-day window for normal feed
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()

    let query = readClient
      .from('signals')
      .select('*', { count: 'exact' })

    // Quality filters — only for 'analyzed' view (default)
    if (view !== 'tracker') {
      query = query
        .gt('impact_score', 3)                    // Only show signals with real impact
        .not('affected_sectors', 'eq', '{}')      // Must have at least one affected sector
    }

    query = query
      .gte('event_date', ninetyDaysAgo)           // 90-day retention window
      .order('event_date', { ascending: false })
      .range(offset, offset + limit - 1)          // Inclusive range

    if (sector && sector !== 'all') {
      query = query.contains('affected_sectors', [sector])
    }

    // Sentiment filter
    const sentiment = searchParams?.get?.('sentiment')
    if (sentiment && sentiment !== 'all') {
      query = query.eq('sentiment', sentiment)
    }

    // Event type filter
    const eventType = searchParams?.get?.('event_type')
    if (eventType && eventType !== 'all') {
      query = query.eq('event_type', eventType)
    }

    // Server-side text search (title, summary, tickers, and event_type)
    if (search) {
      query = query.or(`title.ilike.%${search}%,summary.ilike.%${search}%,tickers::text.ilike.%${search}%,event_type.ilike.%${search}%`)
    }

    const { data, count, error } = await query

    if (error) {
      console.error('[signals] Read FAILED:', error.message, error.details)
      return NextResponse.json({ signals: [], hasMore: false, totalCount: 0, error: error?.message ?? 'Database error' }, { status: 200 })
    }

    const totalCount = count ?? 0
    const signals = data ?? []
    const hasMore = (offset + signals.length) < totalCount

    console.log(`[signals] Returning ${signals.length} signals (view=${view}, offset=${offset}, total=${totalCount}, hasMore=${hasMore})`)
    return NextResponse.json({ signals, hasMore, totalCount })
  } catch (error: any) {
    console.error('Signals API error:', error)
    return NextResponse.json({ signals: [], hasMore: false, totalCount: 0, error: error?.message ?? 'Failed to fetch signals' }, { status: 500 })
  }
}
