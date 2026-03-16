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

  return <SignalDetailClient signal={signal} />
}
