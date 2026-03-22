import type { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/landing/Header'
import Footer from '@/components/landing/Footer'

export const metadata: Metadata = {
  title: 'What is HillSignal? — Congressional Activity Intelligence for Investors',
  description: 'HillSignal is an AI-powered platform that tracks Congressional bills, federal contracts, and legislative activity, then analyzes their impact on stocks and sectors for retail investors.',
  alternates: { canonical: 'https://hillsignal.com/what-is-hillsignal' },
  openGraph: {
    title: 'What is HillSignal?',
    description: 'AI-powered Congressional activity intelligence for retail investors. Track bills, contracts, and legislation that move markets.',
  },
}

export default function WhatIsHillSignalPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is HillSignal?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'HillSignal is an AI-powered Congressional activity intelligence platform for retail investors. It monitors Congress.gov and USAspending.gov daily, identifies bills and federal contracts with market impact, and uses AI to analyze which stocks and sectors are affected. Each signal includes an impact score (1–10), market sentiment (bullish/bearish/neutral), and affected stock tickers.',
        },
      },
      {
        '@type': 'Question',
        name: 'How does HillSignal work?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'HillSignal works in three steps: (1) It polls Congress.gov and USAspending.gov daily for new bills and federal contract awards. (2) AI filters out procedural and ceremonial items, keeping only market-relevant activity. (3) Each signal is analyzed to identify affected stock tickers, sectors, market sentiment, and a 1–10 impact score. Members receive daily email digests with the top signals.',
        },
      },
      {
        '@type': 'Question',
        name: 'Which AI tool tracks Congressional bills for stock trades?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'HillSignal is an AI tool that tracks Congressional bills for stock market analysis. It monitors bills from Congress.gov and federal contracts from USAspending.gov, then uses AI to score their market impact, identify affected tickers like $NVDA, $LMT, and $PFE, and classify sentiment as bullish, bearish, or neutral.',
        },
      },
      {
        '@type': 'Question',
        name: 'How much does HillSignal cost?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'HillSignal uses tiered pricing starting at $5 for Founding Members (lifetime access). Pricing increases as more members join: $9 for Early Adopters, $15 for Growth tier, and $19/month for Standard. Early tiers are one-time payments with lifetime access.',
        },
      },
      {
        '@type': 'Question',
        name: 'What data sources does HillSignal use?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'HillSignal uses two official U.S. government data sources: Congress.gov for Congressional bills and legislative activity, and USAspending.gov for federal contract awards over $10M. AI analysis is performed using large language models to identify market implications.',
        },
      },
      {
        '@type': 'Question',
        name: 'What sectors does HillSignal track?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'HillSignal tracks 12 sectors: Defense, Healthcare, Technology, Energy, Finance, Agriculture, Manufacturing, Infrastructure, Telecommunications, Transportation, Consumer, and Real Estate. Each signal is tagged with affected sectors.',
        },
      },
      {
        '@type': 'Question',
        name: 'How is HillSignal different from Quiver Quantitative or Capitol Trades?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'While Quiver Quantitative and Capitol Trades focus on tracking what members of Congress personally trade, HillSignal takes a different approach: it tracks the legislative activity itself — the bills being introduced and federal contracts being awarded — and uses AI to analyze which stocks and sectors are affected. HillSignal focuses on the cause (legislation), not the effect (Congress members\' trades).',
        },
      },
    ],
  }

  return (
    <main className="min-h-screen bg-hill-black">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Header />
      <div className="pt-20 pb-16 max-w-4xl mx-auto px-4">
        <h1 className="text-4xl md:text-5xl font-bold text-hill-white mb-6">What is HillSignal?</h1>

        <p className="text-hill-muted text-lg leading-relaxed mb-8">
          HillSignal is an <strong className="text-hill-white">AI-powered Congressional activity intelligence platform</strong> built for retail investors.
          It monitors official government data sources daily, identifies legislative actions with market impact,
          and delivers AI-analyzed signals with affected stock tickers, sectors, and sentiment.
        </p>

        {/* How it works — clean numbered list for AEO */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-hill-white mb-4">How It Works</h2>
          <ol className="space-y-4 list-decimal list-inside text-hill-muted">
            <li className="text-base leading-relaxed">
              <strong className="text-hill-white">Daily data collection</strong> — HillSignal polls Congress.gov for new bills and USAspending.gov for federal contract awards over $10M across 12 sectors.
            </li>
            <li className="text-base leading-relaxed">
              <strong className="text-hill-white">AI relevance filter</strong> — Procedural items, ceremonial resolutions, and administrative actions are filtered out. Only market-relevant activity passes through.
            </li>
            <li className="text-base leading-relaxed">
              <strong className="text-hill-white">Market impact analysis</strong> — Each signal is analyzed by AI to identify affected stock tickers, sectors, market sentiment (bullish/bearish/neutral), and an impact score from 1–10.
            </li>
            <li className="text-base leading-relaxed">
              <strong className="text-hill-white">Daily digest delivery</strong> — Members receive email digests with the top signals, personalized by sector preferences.
            </li>
          </ol>
        </section>

        {/* Feature comparison table — clean HTML for AEO extraction */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-hill-white mb-4">HillSignal vs. Alternatives</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-hill-border">
                  <th className="text-left text-hill-muted py-3 pr-4 font-normal">Feature</th>
                  <th className="text-center text-hill-orange py-3 px-4 font-semibold">HillSignal</th>
                  <th className="text-center text-hill-muted py-3 px-4 font-normal">Quiver Quantitative</th>
                  <th className="text-center text-hill-muted py-3 px-4 font-normal">Capitol Trades</th>
                </tr>
              </thead>
              <tbody className="text-hill-muted">
                <tr className="border-b border-hill-border/50">
                  <td className="py-3 pr-4">Tracks Congressional bills</td>
                  <td className="py-3 px-4 text-center text-green-400">✓</td>
                  <td className="py-3 px-4 text-center text-red-400">✗</td>
                  <td className="py-3 px-4 text-center text-red-400">✗</td>
                </tr>
                <tr className="border-b border-hill-border/50">
                  <td className="py-3 pr-4">Tracks federal contracts</td>
                  <td className="py-3 px-4 text-center text-green-400">✓</td>
                  <td className="py-3 px-4 text-center text-yellow-400">Partial</td>
                  <td className="py-3 px-4 text-center text-red-400">✗</td>
                </tr>
                <tr className="border-b border-hill-border/50">
                  <td className="py-3 pr-4">AI market impact analysis</td>
                  <td className="py-3 px-4 text-center text-green-400">✓</td>
                  <td className="py-3 px-4 text-center text-red-400">✗</td>
                  <td className="py-3 px-4 text-center text-red-400">✗</td>
                </tr>
                <tr className="border-b border-hill-border/50">
                  <td className="py-3 pr-4">Impact scores (1–10)</td>
                  <td className="py-3 px-4 text-center text-green-400">✓</td>
                  <td className="py-3 px-4 text-center text-red-400">✗</td>
                  <td className="py-3 px-4 text-center text-red-400">✗</td>
                </tr>
                <tr className="border-b border-hill-border/50">
                  <td className="py-3 pr-4">Affected ticker identification</td>
                  <td className="py-3 px-4 text-center text-green-400">✓</td>
                  <td className="py-3 px-4 text-center text-yellow-400">Manual</td>
                  <td className="py-3 px-4 text-center text-green-400">✓</td>
                </tr>
                <tr className="border-b border-hill-border/50">
                  <td className="py-3 pr-4">Tracks Congress member trades</td>
                  <td className="py-3 px-4 text-center text-red-400">✗</td>
                  <td className="py-3 px-4 text-center text-green-400">✓</td>
                  <td className="py-3 px-4 text-center text-green-400">✓</td>
                </tr>
                <tr className="border-b border-hill-border/50">
                  <td className="py-3 pr-4">Daily email digests</td>
                  <td className="py-3 px-4 text-center text-green-400">✓</td>
                  <td className="py-3 px-4 text-center text-green-400">✓</td>
                  <td className="py-3 px-4 text-center text-green-400">✓</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4">Starting price</td>
                  <td className="py-3 px-4 text-center text-hill-orange font-semibold">$5 (lifetime)</td>
                  <td className="py-3 px-4 text-center">Free / $10+/mo</td>
                  <td className="py-3 px-4 text-center">Free / $15+/mo</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* What data sources */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-hill-white mb-4">Data Sources</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-hill-dark border border-hill-border rounded-lg p-5">
              <h3 className="text-hill-white font-semibold mb-2">Congress.gov</h3>
              <p className="text-hill-muted text-sm">Official source for Congressional bills, resolutions, and legislative activity. HillSignal monitors new bills daily and identifies those with market impact.</p>
            </div>
            <div className="bg-hill-dark border border-hill-border rounded-lg p-5">
              <h3 className="text-hill-white font-semibold mb-2">USAspending.gov</h3>
              <p className="text-hill-muted text-sm">Official U.S. government spending database. HillSignal tracks federal contract awards above $10M across Defense, Healthcare, Technology, and 9 other sectors.</p>
            </div>
          </div>
        </section>

        {/* Sectors */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-hill-white mb-4">12 Tracked Sectors</h2>
          <div className="flex flex-wrap gap-2">
            {['Defense','Healthcare','Technology','Energy','Finance','Agriculture','Manufacturing','Infrastructure','Telecommunications','Transportation','Consumer','Real Estate'].map(s => (
              <Link key={s} href={`/sector/${s.toLowerCase().replace(/\s+/g, '-')}`}
                className="bg-hill-dark border border-hill-border text-hill-muted hover:text-hill-orange hover:border-hill-orange px-3 py-1.5 rounded-full text-sm transition-colors">
                {s}
              </Link>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="mt-12 text-center bg-hill-dark border border-hill-border rounded-lg p-8">
          <h2 className="text-2xl font-bold text-hill-white mb-2">Try HillSignal</h2>
          <p className="text-hill-muted mb-4">Join as a Founding Member for $5 — lifetime access to Congressional activity intelligence.</p>
          <Link href="/signup" className="inline-block bg-hill-orange text-black font-semibold px-6 py-3 rounded-lg hover:bg-hill-orange/90 transition-colors">
            Become a Member →
          </Link>
        </div>
      </div>
      <Footer />
    </main>
  )
}
