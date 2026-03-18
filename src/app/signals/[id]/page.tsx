export const dynamic = 'force-dynamic'

import { redirect, notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server'
import SignalDetailClient from './SignalDetailClient'

/**
 * Generate dynamic OG tags for signal detail pages.
 * Uses admin client so metadata works even for crawlers (no auth cookie).
 */
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const admin = createAdminClient()
  const { data: signal } = await admin
    .from('signals')
    .select('title, summary, sentiment, impact_score, affected_sectors, event_type')
    .eq('id', id ?? '')
    .single()

  if (!signal) {
    return { title: 'Signal Not Found' }
  }

  const sentimentEmoji = signal.sentiment === 'bullish' ? '🟢' : signal.sentiment === 'bearish' ? '🔴' : '⚪'
  const title = `${sentimentEmoji} ${signal.title}`
  const description = signal.summary?.slice(0, 200) || 'Congressional activity signal analysis on HillSignal.'

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      siteName: 'HillSignal',
      images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og-image.png'],
    },
  }
}

export default async function SignalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) redirect('/login')

  const { data: signal, error } = await supabase
    .from('signals')
    .select('*')
    .eq('id', id ?? '')
    .single()

  if (error || !signal) notFound()

  // Fetch connected signals (bill↔contract cross-links)
  const connectedSignals = await findConnectedSignals(signal)

  return <SignalDetailClient signal={signal} connectedSignals={connectedSignals} />
}

/**
 * Find signals connected to the current one via:
 * 1. Bill number match (contract raw_data.related_bill_numbers ↔ bill.bill_number)
 * 2. Shared tickers
 * 3. Shared sectors (weaker signal, only used if other matches are sparse)
 * Returns the opposite type: bills show related contracts, contracts show related bills.
 */
async function findConnectedSignals(signal: any): Promise<any[]> {
  try {
    const admin = createAdminClient()
    const isBill = signal.event_type === 'bill'
    const isContract = signal.event_type === 'contract_award'
    const results: Map<string, { signal: any; score: number; reasons: string[] }> = new Map()

    // Strategy 1: Bill number match (strongest connection)
    if (isBill && signal.bill_number) {
      // Find contracts whose raw_data mentions this bill number
      const { data: contractsByBill } = await admin
        .from('signals')
        .select('*')
        .eq('event_type', 'contract_award')
        .not('raw_data', 'is', null)
        .limit(50)

      for (const c of contractsByBill ?? []) {
        const relatedBills = c.raw_data?.related_bill_numbers ?? []
        if (Array.isArray(relatedBills) && relatedBills.some((b: string) =>
          b?.toLowerCase?.()?.replace(/\s+/g, '') === signal.bill_number?.toLowerCase?.()?.replace(/\s+/g, '')
        )) {
          const existing = results.get(c.id)
          if (existing) {
            existing.score += 10
            existing.reasons.push('References this bill')
          } else {
            results.set(c.id, { signal: c, score: 10, reasons: ['References this bill'] })
          }
        }
      }
    }

    if (isContract && signal.raw_data?.related_bill_numbers?.length) {
      // Find bills that match the contract's related_bill_numbers
      const billNumbers = (signal.raw_data.related_bill_numbers as string[]).filter(Boolean)
      if (billNumbers.length > 0) {
        const { data: matchedBills } = await admin
          .from('signals')
          .select('*')
          .eq('event_type', 'bill')
          .in('bill_number', billNumbers)
          .limit(20)

        for (const b of matchedBills ?? []) {
          const existing = results.get(b.id)
          if (existing) {
            existing.score += 10
            existing.reasons.push('Authorized this contract')
          } else {
            results.set(b.id, { signal: b, score: 10, reasons: ['Authorized this contract'] })
          }
        }
      }
    }

    // Strategy 2: Shared tickers (strong connection)
    const tickers = signal.tickers ?? []
    if (tickers.length > 0) {
      const { data: byTickers } = await admin
        .from('signals')
        .select('*')
        .neq('id', signal.id)
        .overlaps('tickers', tickers)
        .order('impact_score', { ascending: false })
        .limit(20)

      for (const s of byTickers ?? []) {
        const sharedTickers = (s.tickers ?? []).filter((t: string) => tickers.includes(t))
        const existing = results.get(s.id)
        if (existing) {
          existing.score += sharedTickers.length * 3
          existing.reasons.push(`Shared tickers: ${sharedTickers.join(', ')}`)
        } else {
          results.set(s.id, {
            signal: s,
            score: sharedTickers.length * 3,
            reasons: [`Shared tickers: ${sharedTickers.join(', ')}`],
          })
        }
      }
    }

    // Strategy 3: Shared sectors (weaker, fill if needed)
    const sectors = signal.affected_sectors ?? []
    if (sectors.length > 0 && results.size < 8) {
      const { data: bySectors } = await admin
        .from('signals')
        .select('*')
        .neq('id', signal.id)
        .overlaps('affected_sectors', sectors)
        .order('impact_score', { ascending: false })
        .limit(15)

      for (const s of bySectors ?? []) {
        const sharedSectors = (s.affected_sectors ?? []).filter((sec: string) => sectors.includes(sec))
        const existing = results.get(s.id)
        if (existing) {
          existing.score += sharedSectors.length
          if (!existing.reasons.some((r: string) => r.startsWith('Same sector'))) {
            existing.reasons.push(`Same sector: ${sharedSectors.join(', ')}`)
          }
        } else {
          results.set(s.id, {
            signal: s,
            score: sharedSectors.length,
            reasons: [`Same sector: ${sharedSectors.join(', ')}`],
          })
        }
      }
    }

    // Sort by relevance score, return top 8
    const sorted = [...results.values()]
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map(r => ({ ...r.signal, _connectionReasons: r.reasons, _connectionScore: r.score }))

    return sorted
  } catch (err) {
    console.error('[connected-signals] Error:', err)
    return []
  }
}
