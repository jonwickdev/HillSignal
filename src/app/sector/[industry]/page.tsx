export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import { generateSignalSlug } from '@/lib/slug'
import Header from '@/components/landing/Header'
import Footer from '@/components/landing/Footer'

const VALID_SECTORS = [
  'defense', 'healthcare', 'technology', 'energy', 'finance',
  'agriculture', 'manufacturing', 'infrastructure', 'telecommunications',
  'transportation', 'consumer', 'real-estate',
]

const SECTOR_LABELS: Record<string, string> = {
  'defense': 'Defense', 'healthcare': 'Healthcare', 'technology': 'Technology',
  'energy': 'Energy', 'finance': 'Finance', 'agriculture': 'Agriculture',
  'manufacturing': 'Manufacturing', 'infrastructure': 'Infrastructure',
  'telecommunications': 'Telecommunications', 'transportation': 'Transportation',
  'consumer': 'Consumer', 'real-estate': 'Real Estate',
}

const SECTOR_DESCRIPTIONS: Record<string, string> = {
  defense: 'military spending, defense contracts, and national security legislation',
  healthcare: 'healthcare policy, pharmaceutical regulation, and Medicare/Medicaid changes',
  technology: 'tech regulation, AI policy, data privacy laws, and semiconductor legislation',
  energy: 'energy policy, oil and gas regulation, renewable energy subsidies, and climate legislation',
  finance: 'banking regulation, SEC policy, cryptocurrency legislation, and financial reform',
  agriculture: 'farm bills, agricultural subsidies, food safety regulation, and trade policy',
  manufacturing: 'industrial policy, trade tariffs, supply chain legislation, and labor law',
  infrastructure: 'infrastructure spending, transportation funding, and public works projects',
  telecommunications: 'FCC regulation, broadband policy, 5G legislation, and media regulation',
  transportation: 'airline regulation, shipping policy, EV mandates, and transportation funding',
  consumer: 'consumer protection, retail regulation, product safety, and trade policy',
  'real-estate': 'housing policy, mortgage regulation, zoning laws, and real estate tax policy',
}

interface Props {
  params: Promise<{ industry: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { industry } = await params
  const slug = industry.toLowerCase()
  const label = SECTOR_LABELS[slug] ?? industry
  return {
    title: `${label} Sector — Congressional Signals & Federal Contracts`,
    description: `Track Congressional bills, federal contracts, and legislative activity affecting the ${label} sector. AI-analyzed impact scores and stock implications for ${label} investors.`,
    alternates: { canonical: `https://hillsignal.com/sector/${slug}` },
    openGraph: {
      title: `${label} Sector Congressional Intelligence — HillSignal`,
      description: `${label} sector signals: bills, contracts, and legislative activity with AI market analysis.`,
    },
  }
}

export default async function SectorPage({ params }: Props) {
  const { industry } = await params
  const slug = industry.toLowerCase()
  const label = SECTOR_LABELS[slug]
  // Match DB values — 'Real Estate' in DB, 'real-estate' in URL
  const dbSector = label ?? industry.charAt(0).toUpperCase() + industry.slice(1)

  if (!label && !VALID_SECTORS.includes(slug)) {
    notFound()
  }

  const admin = createAdminClient()
  const { data: signals } = await admin
    .from('signals')
    .select('id, title, summary, impact_score, sentiment, affected_sectors, tickers, event_type, event_date, bill_number, created_at')
    .not('full_analysis', 'is', null)
    .contains('affected_sectors', [dbSector])
    .order('created_at', { ascending: false })
    .limit(50)

  if (!signals || signals.length === 0) {
    notFound()
  }

  const sentimentColor: Record<string, string> = {
    bullish: 'text-green-400', bearish: 'text-red-400', neutral: 'text-yellow-400',
  }

  // Aggregate stats
  const allTickers: string[] = [...new Set<string>(signals.flatMap((s: any) => (s.tickers ?? []).map((t: string) => t.replace('$', ''))))]
  const avgImpact = (signals.reduce((sum: number, s: any) => sum + (s.impact_score ?? 0), 0) / signals.length).toFixed(1)
  const billCount = signals.filter((s: any) => s.event_type === 'bill').length
  const contractCount = signals.filter((s: any) => s.event_type === 'contract_award').length

  const desc = SECTOR_DESCRIPTIONS[slug] ?? `${label} sector activity`

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `${label} Sector Congressional Intelligence`,
    description: `${signals.length} Congressional signals tracked for the ${label} sector. Average impact: ${avgImpact}/10.`,
    url: `https://hillsignal.com/sector/${slug}`,
    isPartOf: { '@type': 'WebSite', name: 'HillSignal', url: 'https://hillsignal.com' },
  }

  return (
    <main className="min-h-screen bg-hill-black">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Header />
      <div className="pt-20 pb-16 max-w-5xl mx-auto px-4">
        <p className="text-hill-orange font-mono text-sm mb-2">SECTOR INTELLIGENCE</p>
        <h1 className="text-4xl md:text-5xl font-bold text-hill-white mb-3">{label}</h1>
        <p className="text-hill-muted text-lg mb-8 max-w-2xl">Congressional activity related to {desc}. AI-analyzed for market impact.</p>

        {/* Stats */}
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
            <p className="text-2xl font-bold text-hill-white">{billCount}</p>
            <p className="text-hill-muted text-sm">Bills</p>
          </div>
          <div className="bg-hill-dark border border-hill-border rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-hill-white">{contractCount}</p>
            <p className="text-hill-muted text-sm">Contracts</p>
          </div>
        </div>

        {/* Top tickers table — clean semantic HTML for AEO */}
        {allTickers.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-hill-white mb-3">Top Tickers in {label}</h2>
            <div className="flex flex-wrap gap-2">
              {allTickers.slice(0, 20).map((t: string) => (
                <Link key={t} href={`/ticker/${t.toLowerCase()}`}
                  className="bg-hill-dark border border-hill-border text-hill-orange hover:border-hill-orange font-mono px-3 py-1 rounded text-sm transition-colors">
                  ${t}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Other sectors */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-hill-white mb-3">Explore Other Sectors</h2>
          <div className="flex flex-wrap gap-2">
            {VALID_SECTORS.filter(s => s !== slug).map(s => (
              <Link key={s} href={`/sector/${s}`}
                className="bg-hill-dark border border-hill-border text-hill-muted hover:text-hill-white hover:border-hill-orange px-3 py-1 rounded-full text-sm transition-colors">
                {SECTOR_LABELS[s]}
              </Link>
            ))}
          </div>
        </section>

        {/* Signal list */}
        <h2 className="text-2xl font-semibold text-hill-white mb-4">Recent {label} Signals</h2>
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
                {(signal.tickers ?? []).slice(0, 4).map((t: string) => (
                  <Link key={t} href={`/ticker/${t.replace('$','').toLowerCase()}`} className="text-hill-orange hover:underline font-mono">{t}</Link>
                ))}
                <time dateTime={signal.event_date}>{new Date(signal.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</time>
              </div>
            </article>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 text-center bg-hill-dark border border-hill-border rounded-lg p-8">
          <h2 className="text-2xl font-bold text-hill-white mb-2">Track {label} Signals Daily</h2>
          <p className="text-hill-muted mb-4">Get AI-analyzed alerts for {desc}.</p>
          <Link href="/signup" className="inline-block bg-hill-orange text-black font-semibold px-6 py-3 rounded-lg hover:bg-hill-orange/90 transition-colors">
            Become a Member →
          </Link>
        </div>
      </div>
      <Footer />
    </main>
  )
}
