export const dynamic = 'force-dynamic'

import type { MetadataRoute } from 'next'
import { generateSignalSlug } from '@/lib/slug'

/**
 * Dynamic sitemap that auto-expands as new signals are added.
 * Crawlers re-fetch this periodically so new pages get indexed automatically.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://hillsignal.com'

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/faq`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/blog/how-congressional-bills-move-markets`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/blog/federal-contracts-hidden-trading-signal`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/blog/retail-investor-guide-political-intelligence`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/login`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${baseUrl}/signup`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.1 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.1 },
  ]

  // Dynamic signal pages — fetch all IDs from the database
  let signalPages: MetadataRoute.Sitemap = []
  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { createAdminClient } = await import('@/lib/supabase/server')
      const admin = createAdminClient()

      // Only include analyzed signals from the last 12 months with quality gate
      // Older signals stay in DB (for marketing counts) but aren't exposed to crawlers
      const twelveMonthsAgo = new Date()
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)
      const { data: signals } = await admin
        .from('signals')
        .select('id, title, updated_at, created_at, impact_score, event_date')
        .gt('impact_score', 3)
        .not('affected_sectors', 'eq', '{}')
        .gte('event_date', twelveMonthsAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(5000)

      signalPages = (signals ?? []).map((s: any) => ({
        url: `${baseUrl}/signals/${generateSignalSlug(s.title ?? '', s.id)}`,
        lastModified: new Date(s.updated_at || s.created_at),
        changeFrequency: 'weekly' as const,
        // Higher impact = higher priority for crawlers
        priority: s.impact_score >= 7 ? 0.8 : s.impact_score >= 5 ? 0.6 : 0.4,
      }))
    }
  } catch (err) {
    console.error('[sitemap] Error fetching signals:', err)
  }

  return [...staticPages, ...signalPages]
}
