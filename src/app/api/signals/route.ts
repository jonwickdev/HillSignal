export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * GET /api/signals
 * Fetches signals from Supabase. If ?refresh=true, triggers a Congress.gov poll first.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request?.url ?? '')
    const refresh = searchParams?.get?.('refresh') === 'true'
    const sector = searchParams?.get?.('sector')
    const limit = parseInt(searchParams?.get?.('limit') ?? '50') || 50

    // If refresh requested, trigger poll
    if (refresh) {
      try {
        const proto = request?.headers?.get?.('x-forwarded-proto') ?? 'http'
        const host = request?.headers?.get?.('host') ?? 'localhost:3000'
        const origin = request?.headers?.get?.('origin') || `${proto}://${host}`
        // Fire and forget - don't block the response
        fetch(`${origin}/api/cron/poll-congress`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }).catch((err: any) => console.error('Poll trigger failed:', err?.message))
      } catch (err: any) {
        console.error('Failed to trigger poll:', err?.message)
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
