export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { analyzeCongressItem } from '@/lib/gemini-analysis'
import type { RawCongressItem } from '@/lib/congress-api'

/**
 * GET /api/admin/upgrade-analysis?secret=CRON_SECRET&limit=10
 *
 * Finds basic/tracked signals (full_analysis IS NULL) and runs
 * full AI analysis on them, then updates the database rows.
 * Protected by CRON_SECRET. Call repeatedly to gradually upgrade all basic records.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')

  const validSecret = process.env.CRON_SECRET
  if (!validSecret || secret !== validSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const limit = Math.min(parseInt(searchParams.get('limit') ?? '10') || 10, 20)
  const supabase = createAdminClient()

  // Fetch basic records that need upgrading
  const { data: basicSignals, error: fetchError } = await supabase
    .from('signals')
    .select('*')
    .is('full_analysis', null)
    .order('event_date', { ascending: false })
    .limit(limit)

  if (fetchError) {
    console.error('[upgrade] Fetch error:', fetchError.message)
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  if (!basicSignals || basicSignals.length === 0) {
    return NextResponse.json({
      status: 'complete',
      message: 'No basic records left to upgrade.',
      upgraded: 0,
      remaining: 0,
    })
  }

  // Count total remaining
  const { count: remainingCount } = await supabase
    .from('signals')
    .select('id', { count: 'exact', head: true })
    .is('full_analysis', null)

  console.log(`[upgrade] Found ${basicSignals.length} basic signals to upgrade (${remainingCount ?? '?'} total remaining)`)

  let upgraded = 0
  let failed = 0
  const concurrency = 5

  // Process in concurrent batches
  for (let i = 0; i < basicSignals.length; i += concurrency) {
    const batch = basicSignals.slice(i, i + concurrency)

    const results = await Promise.allSettled(
      batch.map(async (signal: any) => {
        // Construct a RawCongressItem from stored data for the analysis engine
        const item: RawCongressItem = {
          type: signal.event_type === 'hearing' ? 'meeting' : (signal.event_type === 'contract_award' ? 'bill' : signal.event_type ?? 'bill'),
          raw: {},
          congress_gov_id: signal.congress_gov_id ?? '',
          title: signal.title ?? 'Unknown',
          description: signal.summary || signal.title || 'No description available',
          date: signal.event_date ?? new Date().toISOString(),
          source_url: signal.source_url ?? '',
          committee: signal.committee ?? null,
          legislators: signal.legislators ?? [],
          bill_number: signal.bill_number ?? null,
          enrichment: null,
        }

        const analysis = await analyzeCongressItem(item)
        if (!analysis) {
          throw new Error(`Analysis returned null for signal ${signal.id}`)
        }

        // Update the signal with the full analysis
        const { error: updateErr } = await supabase
          .from('signals')
          .update({
            summary: analysis.summary ?? signal.summary,
            full_analysis: analysis.full_analysis,
            impact_score: analysis.impact_score ?? signal.impact_score,
            sentiment: analysis.sentiment ?? signal.sentiment,
            affected_sectors: (analysis.affected_sectors?.length ?? 0) > 0 ? analysis.affected_sectors : signal.affected_sectors,
            tickers: analysis.tickers ?? [],
            key_takeaways: analysis.key_takeaways ?? [],
            market_implications: analysis.market_implications ?? null,
          })
          .eq('id', signal.id)

        if (updateErr) {
          throw new Error(`Update failed for ${signal.id}: ${updateErr.message}`)
        }

        return signal.id
      })
    )

    for (const result of results) {
      if (result.status === 'fulfilled') {
        upgraded++
        console.log(`[upgrade] Upgraded signal: ${result.value}`)
      } else {
        failed++
        console.error(`[upgrade] Failed:`, result.reason)
      }
    }

    // Small delay between batches to avoid rate limits
    if (i + concurrency < basicSignals.length) {
      await new Promise(r => setTimeout(r, 1000))
    }
  }

  const newRemaining = (remainingCount ?? 0) - upgraded

  return NextResponse.json({
    status: newRemaining > 0 ? 'in_progress' : 'complete',
    upgraded,
    failed,
    remaining: Math.max(0, newRemaining),
    message: `Upgraded ${upgraded}/${basicSignals.length} signals. ${Math.max(0, newRemaining)} remaining.`,
  })
}
