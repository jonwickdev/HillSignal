import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About HillSignal',
  description: 'HillSignal was built to give retail investors the same Congressional intelligence that institutions pay thousands for. Learn about our mission, data sources, and the founder behind the platform.',
  alternates: {
    canonical: 'https://hillsignal.com/about',
  },
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-hill-black">
      {/* Header */}
      <header className="border-b border-hill-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-hill-white">Hill<span className="text-hill-orange">Signal</span></Link>
          <Link href="/" className="text-hill-muted hover:text-hill-white text-sm transition-colors">← Back to Home</Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-3xl md:text-4xl font-bold text-hill-white mb-8">About HillSignal</h1>

        {/* Founder Story */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-hill-orange mb-4">Why I Built This</h2>
          <div className="text-hill-muted leading-relaxed space-y-4">
            <p>
              I started HillSignal because I was frustrated. Every time a major bill passed or a billion-dollar 
              federal contract was awarded, I&apos;d read about the market impact days later — after institutional 
              investors had already moved. The information was public. It was just buried across dozens of 
              government websites, impossible to track manually.
            </p>
            <p>
              So I built what I wanted: a system that monitors Congress.gov and USAspending.gov daily, runs 
              every new bill and contract through AI analysis, and tells me exactly which stocks and sectors 
              are affected — with sentiment, impact scores, and the specific tickers I should be watching.
            </p>
            <p>
              HillSignal isn&apos;t insider information. It&apos;s <em>public</em> information, organized and analyzed 
              faster than any human could do manually. The edge isn&apos;t access — it&apos;s speed and analysis.
            </p>
          </div>
        </section>

        {/* What We Track */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-hill-orange mb-4">What We Track</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-hill-dark border border-hill-border rounded-lg p-5">
              <h3 className="text-hill-white font-semibold mb-2">Congressional Bills</h3>
              <p className="text-hill-muted text-sm">New legislation from Congress.gov — analyzed for market 
              impact across 12 sectors with affected ticker identification.</p>
              <p className="text-hill-muted/60 text-xs mt-2 font-mono">Source: Congress.gov API</p>
            </div>
            <div className="bg-hill-dark border border-hill-border rounded-lg p-5">
              <h3 className="text-hill-white font-semibold mb-2">Federal Contracts</h3>
              <p className="text-hill-muted text-sm">Government contract awards over $10M from USAspending.gov — 
              matched to publicly traded companies and analyzed for sector impact.</p>
              <p className="text-hill-muted/60 text-xs mt-2 font-mono">Source: USAspending.gov / SAM.gov</p>
            </div>
          </div>
        </section>

        {/* Data & Transparency */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-hill-orange mb-4">Our Data Sources</h2>
          <div className="text-hill-muted leading-relaxed space-y-4">
            <p>
              Every signal on HillSignal comes from official U.S. government data sources. We don&apos;t scrape 
              social media, aggregate rumors, or use non-public information. Our two primary sources are:
            </p>
            <ul className="space-y-2 ml-4">
              <li className="flex items-start gap-2">
                <span className="text-hill-green mt-1">•</span>
                <span><strong className="text-hill-white">Congress.gov</strong> — The official source for U.S. federal legislation, maintained by the Library of Congress</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-hill-green mt-1">•</span>
                <span><strong className="text-hill-white">USAspending.gov</strong> — The official source for U.S. government spending data, maintained by the U.S. Treasury</span>
              </li>
            </ul>
            <p>
              AI analysis is performed using large language models to identify affected companies, sectors, and 
              market sentiment. The analysis is informational only and should not be treated as financial advice.
            </p>
          </div>
        </section>

        {/* Contact */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-hill-orange mb-4">Get in Touch</h2>
          <p className="text-hill-muted mb-4">
            HillSignal is an independent, bootstrapped product. If you have questions, feedback, or just want to 
            say hi, I read every email.
          </p>
          <a href="mailto:support@hillsignal.com" className="inline-flex items-center gap-2 text-hill-orange hover:text-hill-orange-dark transition-colors font-semibold">
            support@hillsignal.com →
          </a>
        </section>

        {/* Disclaimer */}
        <section className="bg-hill-dark border border-hill-border rounded-lg p-5">
          <p className="text-hill-muted text-sm leading-relaxed">
            <strong className="text-hill-white">Important Disclaimer:</strong> HillSignal is not a registered 
            investment advisor, broker-dealer, or financial planner. The information provided is for 
            informational and educational purposes only and should not be construed as investment advice. 
            Always conduct your own research and consult a qualified financial advisor before making 
            investment decisions.
          </p>
        </section>
      </main>
    </div>
  )
}
