export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import { generateSignalSlug } from '@/lib/slug'
import Header from '@/components/landing/Header'
import Footer from '@/components/landing/Footer'

interface Props {
  params: Promise<{ symbol: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { symbol } = await params
  const ticker = symbol.toUpperCase()
  return {
    title: `$${ticker} — Congressional Activity & Federal Contracts`,
    description: `Track how Congressional bills, federal contracts, and legislative activity affect $${ticker}. AI-analyzed market impact scores, sentiment analysis, and sector intelligence.`,
    alternates: { canonical: `https://hillsignal.com/ticker/${symbol.toLowerCase()}` },
    openGraph: {
      title: `$${ticker} Congressional Activity — HillSignal`,
      description: `See all recent Congressional signals impacting $${ticker}. Impact scores, sentiment, and AI analysis.`,
    },
  }
}

export default async function TickerPage({ params }: Props) {
  const { symbol } = await params
  const ticker = symbol.toUpperCase()
  const admin = createAdminClient()

  // Fetch signals mentioning this ticker
  const { data: signals, error } = await admin
    .from('signals')
    .select('id, title, summary, impact_score, sentiment, affected_sectors, tickers, event_type, event_date, bill_number, created_at')
    .not('full_analysis', 'is', null)
    .contains('tickers', [`$${ticker}`])
    .order('created_at', { ascending: false })
    .limit(50)

  if (error || !signals || signals.length === 0) {
    notFound()
  }

  const sentimentColor: Record<string, string> = {
    bullish: 'text-green-400',
    bearish: 'text-red-400',
    neutral: 'text-yellow-400',
  }

  const sectors: string[] = [...new Set<string>(signals.flatMap((s: any) => s.affected_sectors ?? []))]
  const avgImpact = (signals.reduce((sum: number, s: any) => sum + (s.impact_score ?? 0), 0) / signals.length).toFixed(1)
  const bullishCount = signals.filter((s: any) => s.sentiment === 'bullish').length
  const bearishCount = signals.filter((s: any) => s.sentiment === 'bearish').length

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `$${ticker} Congressional Activity`,
    description: `Congressional bills and federal contracts affecting $${ticker}`,
    url: `https://hillsignal.com/ticker/${symbol.toLowerCase()}`,
    isPartOf: { '@type': 'WebSite', name: 'HillSignal', url: 'https://hillsignal.com' },
    about: {
      '@type': 'FinancialProduct',
      name: `$${ticker} Congressional Intelligence`,
      description: `${signals.length} signals tracked. Average impact: ${avgImpact}/10. Sectors: ${sectors.join(', ')}.`,
    },
  }

  return (
    <main className="min-h-screen bg-hill-black">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Header />
      <div className="pt-20 pb-16 max-w-5xl mx-auto px-4">
        {/* Hero */}
        <div className="mb-8">
          <p className="text-hill-orange font-mono text-sm mb-2">TICKER INTELLIGENCE</p>
          <h1 className="text-4xl md:text-5xl font-bold text-hill-white mb-3">${ticker}</h1>
          <p className="text-hill-muted text-lg">Congressional activity and federal contracts affecting this stock</p>
        </div>

        {/* Stats summary — clean HTML table for AEO */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="bg-hill-dark border border-hill-border rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-hill-white">{signals.length}</p>
            <p className="text-hill-muted text-sm">Total Signals</p>
          </div>
          <div className="bg-hill-dark border border-hill-border rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-hill-orange">{avgImpact}/10</p>
            <p className="text-hill-muted text-sm">Avg Impact</p>
          </div>
          <div className="bg-hill-dark border border-hill-border rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-green-400">{bullishCount}</p>
            <p className="text-hill-muted text-sm">Bullish Signals</p>
          </div>
          <div className="bg-hill-dark border border-hill-border rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-red-400">{bearishCount}</p>
            <p className="text-hill-muted text-sm">Bearish Signals</p>
          </div>
        </div>

        {/* Sectors */}
        {sectors.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-hill-white mb-3">Related Sectors</h2>
            <div className="flex flex-wrap gap-2">
              {sectors.map((sector: string) => (
                <Link key={sector} href={`/sector/${sector.toLowerCase()}`}
                  className="bg-hill-dark border border-hill-border text-hill-muted hover:text-hill-orange hover:border-hill-orange px-3 py-1 rounded-full text-sm transition-colors">
                  {sector}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Signal list */}
        <h2 className="text-2xl font-semibold text-hill-white mb-4">Recent Congressional Signals for ${ticker}</h2>
        <div className="space-y-4">
          {signals.map((signal: any) => (
            <article key={signal.id} className="bg-hill-dark border border-hill-border rounded-lg p-5 hover:border-hill-orange/50 transition-colors">
              <div className="flex items-start justify-between gap-4 mb-2">
                <Link href={`/signals/${generateSignalSlug(signal.title ?? '', signal.id)}`}
                  className="text-hill-white font-semibold hover:text-hill-orange transition-colors">
                  <h3>{signal.title}</h3>
                </Link>
                <span className={`text-sm font-mono whitespace-nowrap ${sentimentColor[signal.sentiment] ?? 'text-hill-muted'}`}>
                  {(signal.sentiment ?? 'neutral').toUpperCase()}
                </span>
              </div>
              <p className="text-hill-muted text-sm mb-3 line-clamp-2">{signal.summary}</p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-hill-muted">
                <span className="font-mono">Impact: <strong className="text-hill-orange">{signal.impact_score}/10</strong></span>
                {signal.bill_number && <span className="font-mono">{signal.bill_number}</span>}
                <span>{signal.event_type === 'contract_award' ? 'Federal Contract' : 'Congressional Bill'}</span>
                <time dateTime={signal.event_date}>{new Date(signal.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</time>
              </div>
            </article>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 text-center bg-hill-dark border border-hill-border rounded-lg p-8">
          <h2 className="text-2xl font-bold text-hill-white mb-2">Get Full Access to ${ticker} Signals</h2>
          <p className="text-hill-muted mb-4">Daily AI-analyzed alerts for Congressional activity affecting your portfolio.</p>
          <Link href="/signup" className="inline-block bg-hill-orange text-black font-semibold px-6 py-3 rounded-lg hover:bg-hill-orange/90 transition-colors">
            Become a Member →
          </Link>
        </div>
      </div>
      <Footer />
    </main>
  )
}
