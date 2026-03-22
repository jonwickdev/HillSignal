export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import { generateSignalSlug } from '@/lib/slug'
import Header from '@/components/landing/Header'
import Footer from '@/components/landing/Footer'

interface Props {
  params: Promise<{ billId: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { billId } = await params
  const admin = createAdminClient()
  const { data: signals } = await admin
    .from('signals')
    .select('title, summary, bill_number')
    .eq('bill_number', billId.toUpperCase())
    .limit(1)

  const signal = signals?.[0]
  const title = signal?.title ?? `Bill ${billId.toUpperCase()}`
  return {
    title: `${billId.toUpperCase()} — ${title}`,
    description: signal?.summary ?? `AI analysis of ${billId.toUpperCase()}: market impact, affected stocks, and sentiment for investors.`,
    alternates: { canonical: `https://hillsignal.com/bill/${billId.toUpperCase()}` },
    openGraph: {
      title: `${billId.toUpperCase()} Market Analysis — HillSignal`,
      description: signal?.summary ?? `Congressional bill ${billId.toUpperCase()} analysis for investors.`,
    },
  }
}

export default async function BillPage({ params }: Props) {
  const { billId } = await params
  const bill = billId.toUpperCase()
  const admin = createAdminClient()

  const { data: signals } = await admin
    .from('signals')
    .select('id, title, summary, full_analysis, impact_score, sentiment, affected_sectors, tickers, event_type, event_date, bill_number, source_url, key_takeaways, market_implications, legislators, committee, created_at')
    .eq('bill_number', bill)
    .order('created_at', { ascending: false })
    .limit(5)

  if (!signals || signals.length === 0) {
    notFound()
  }

  const signal = signals[0]
  const sentimentColor: Record<string, string> = {
    bullish: 'text-green-400 bg-green-400/10 border-green-400/30',
    bearish: 'text-red-400 bg-red-400/10 border-red-400/30',
    neutral: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${bill}: ${signal.title}`,
    description: signal.summary,
    url: `https://hillsignal.com/bill/${bill}`,
    datePublished: signal.created_at,
    publisher: { '@type': 'Organization', name: 'HillSignal', url: 'https://hillsignal.com' },
    about: {
      '@type': 'LegislativeAction',
      name: signal.title,
      result: signal.sentiment,
    },
  }

  return (
    <main className="min-h-screen bg-hill-black">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Header />
      <div className="pt-20 pb-16 max-w-4xl mx-auto px-4">
        {/* Header */}
        <p className="text-hill-orange font-mono text-sm mb-2">BILL ANALYSIS</p>
        <div className="flex items-start gap-3 mb-2">
          <h1 className="text-3xl md:text-4xl font-bold text-hill-white">{bill}</h1>
          <span className={`mt-1 text-xs font-mono px-2 py-1 rounded border ${sentimentColor[signal.sentiment] ?? 'text-hill-muted'}`}>
            {(signal.sentiment ?? 'neutral').toUpperCase()}
          </span>
        </div>
        <h2 className="text-xl text-hill-muted mb-6">{signal.title}</h2>

        {/* Impact score + metadata table — semantic HTML for AEO */}
        <table className="w-full mb-8 text-sm border-collapse">
          <thead>
            <tr className="border-b border-hill-border">
              <th className="text-left text-hill-muted py-2 font-normal">Metric</th>
              <th className="text-left text-hill-muted py-2 font-normal">Value</th>
            </tr>
          </thead>
          <tbody className="text-hill-white">
            <tr className="border-b border-hill-border/50">
              <td className="py-2 text-hill-muted">Impact Score</td>
              <td className="py-2 font-mono text-hill-orange font-bold">{signal.impact_score}/10</td>
            </tr>
            <tr className="border-b border-hill-border/50">
              <td className="py-2 text-hill-muted">Sentiment</td>
              <td className="py-2 font-mono capitalize">{signal.sentiment}</td>
            </tr>
            <tr className="border-b border-hill-border/50">
              <td className="py-2 text-hill-muted">Event Date</td>
              <td className="py-2"><time dateTime={signal.event_date}>{new Date(signal.event_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</time></td>
            </tr>
            <tr className="border-b border-hill-border/50">
              <td className="py-2 text-hill-muted">Sectors</td>
              <td className="py-2">{(signal.affected_sectors ?? []).join(', ') || 'N/A'}</td>
            </tr>
            <tr className="border-b border-hill-border/50">
              <td className="py-2 text-hill-muted">Affected Tickers</td>
              <td className="py-2 font-mono">{(signal.tickers ?? []).join(', ') || 'N/A'}</td>
            </tr>
            {signal.committee && (
              <tr className="border-b border-hill-border/50">
                <td className="py-2 text-hill-muted">Committee</td>
                <td className="py-2">{signal.committee}</td>
              </tr>
            )}
            {signal.source_url && (
              <tr className="border-b border-hill-border/50">
                <td className="py-2 text-hill-muted">Source</td>
                <td className="py-2"><a href={signal.source_url} target="_blank" rel="noopener noreferrer" className="text-hill-orange hover:underline">Congress.gov →</a></td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Summary */}
        <section className="mb-8">
          <h3 className="text-lg font-semibold text-hill-white mb-3">Summary</h3>
          <p className="text-hill-muted leading-relaxed">{signal.summary}</p>
        </section>

        {/* Full AI Analysis */}
        {signal.full_analysis && (
          <section className="mb-8">
            <h3 className="text-lg font-semibold text-hill-white mb-3">AI Market Analysis</h3>
            <div className="bg-hill-dark border border-hill-border rounded-lg p-5 text-hill-muted leading-relaxed whitespace-pre-wrap text-sm">
              {signal.full_analysis}
            </div>
          </section>
        )}

        {/* Key Takeaways */}
        {signal.key_takeaways && signal.key_takeaways.length > 0 && (
          <section className="mb-8">
            <h3 className="text-lg font-semibold text-hill-white mb-3">Key Takeaways</h3>
            <ul className="space-y-2">
              {signal.key_takeaways.map((takeaway: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-hill-muted">
                  <span className="text-hill-orange mt-1">•</span>
                  <span>{takeaway}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Market Implications */}
        {signal.market_implications && (
          <section className="mb-8">
            <h3 className="text-lg font-semibold text-hill-white mb-3">Market Implications</h3>
            <p className="text-hill-muted leading-relaxed">{signal.market_implications}</p>
          </section>
        )}

        {/* Affected Tickers */}
        {(signal.tickers ?? []).length > 0 && (
          <section className="mb-8">
            <h3 className="text-lg font-semibold text-hill-white mb-3">Affected Stocks</h3>
            <div className="flex flex-wrap gap-2">
              {signal.tickers.map((t: string) => (
                <Link key={t} href={`/ticker/${t.replace('$','').toLowerCase()}`}
                  className="bg-hill-dark border border-hill-orange/30 text-hill-orange font-mono px-3 py-1.5 rounded hover:border-hill-orange transition-colors text-sm">
                  {t}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Sector links */}
        {(signal.affected_sectors ?? []).length > 0 && (
          <section className="mb-8">
            <h3 className="text-lg font-semibold text-hill-white mb-3">Related Sectors</h3>
            <div className="flex flex-wrap gap-2">
              {signal.affected_sectors.map((s: string) => (
                <Link key={s} href={`/sector/${s.toLowerCase().replace(/\s+/g, '-')}`}
                  className="bg-hill-dark border border-hill-border text-hill-muted hover:text-hill-orange hover:border-hill-orange px-3 py-1 rounded-full text-sm transition-colors">
                  {s}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <div className="mt-12 text-center bg-hill-dark border border-hill-border rounded-lg p-8">
          <h2 className="text-2xl font-bold text-hill-white mb-2">Track Bills Like {bill} Daily</h2>
          <p className="text-hill-muted mb-4">Get AI-analyzed alerts when Congress moves markets.</p>
          <Link href="/signup" className="inline-block bg-hill-orange text-black font-semibold px-6 py-3 rounded-lg hover:bg-hill-orange/90 transition-colors">
            Become a Member →
          </Link>
        </div>
      </div>
      <Footer />
    </main>
  )
}
