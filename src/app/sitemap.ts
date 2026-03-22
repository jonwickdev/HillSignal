export const dynamic = 'force-dynamic'

import type { MetadataRoute } from 'next'
import { generateSignalSlug } from '@/lib/slug'

const VALID_SECTORS = [
  'defense', 'healthcare', 'technology', 'energy', 'finance',
  'agriculture', 'manufacturing', 'infrastructure', 'telecommunications',
  'transportation', 'consumer', 'real-estate',
]

/**
 * Dynamic sitemap that auto-expands as new signals, tickers, bills are added.
 * Crawlers re-fetch this periodically so new pages get indexed automatically.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://hillsignal.com'
  const now = new Date()

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/what-is-hillsignal`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${baseUrl}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/faq`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/glossary`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/blog`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/blog/how-congressional-bills-move-markets`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/blog/federal-contracts-hidden-trading-signal`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/blog/retail-investor-guide-political-intelligence`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/login`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${baseUrl}/signup`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${baseUrl}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.1 },
    { url: `${baseUrl}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.1 },
  ]

  // Sector pages (static set)
  const sectorPages: MetadataRoute.Sitemap = VALID_SECTORS.map(s => ({
    url: `${baseUrl}/sector/${s}`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }))

  let signalPages: MetadataRoute.Sitemap = []
  let tickerPages: MetadataRoute.Sitemap = []
  let billPages: MetadataRoute.Sitemap = []

  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { createAdminClient } = await import('@/lib/supabase/server')
      const admin = createAdminClient()

      const twelveMonthsAgo = new Date()
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

      const { data: signals } = await admin
        .from('signals')
        .select('id, title, updated_at, created_at, impact_score, event_date, tickers, bill_number')
        .gt('impact_score', 3)
        .not('affected_sectors', 'eq', '{}')
        .gte('event_date', twelveMonthsAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(5000)

      // Signal detail pages
      signalPages = (signals ?? []).map((s: any) => ({
        url: `${baseUrl}/signals/${generateSignalSlug(s.title ?? '', s.id)}`,
        lastModified: new Date(s.updated_at || s.created_at),
        changeFrequency: 'weekly' as const,
        priority: s.impact_score >= 7 ? 0.8 : s.impact_score >= 5 ? 0.6 : 0.4,
      }))

      // Ticker pages — deduplicate all tickers across signals
      const tickerSet = new Set<string>()
      for (const s of signals ?? []) {
        for (const t of s.tickers ?? []) {
          const clean = t.replace('$', '').toLowerCase()
          if (clean && clean.length <= 5) tickerSet.add(clean)
        }
      }
      tickerPages = [...tickerSet].map(t => ({
        url: `${baseUrl}/ticker/${t}`,
        lastModified: now,
        changeFrequency: 'daily' as const,
        priority: 0.7,
      }))

      // Bill pages — deduplicate all bill numbers
      const billSet = new Set<string>()
      for (const s of signals ?? []) {
        if (s.bill_number) billSet.add(s.bill_number)
      }
      billPages = [...billSet].map(b => ({
        url: `${baseUrl}/bill/${b}`,
        lastModified: now,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }))
    }
  } catch (err) {
    console.error('[sitemap] Error fetching signals:', err)
  }

  return [...staticPages, ...sectorPages, ...tickerPages, ...billPages, ...signalPages]
}
