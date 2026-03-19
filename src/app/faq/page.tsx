import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Frequently Asked Questions',
  description: 'Common questions about HillSignal — how it works, what data we use, pricing, refunds, and how we\'re different from just reading Congress.gov yourself.',
  alternates: {
    canonical: 'https://hillsignal.com/faq',
  },
}

const FAQS = [
  {
    category: 'About the Product',
    questions: [
      {
        q: 'Is this insider trading data?',
        a: 'No. Every piece of data on HillSignal comes from official, publicly available U.S. government sources — specifically Congress.gov (bills and legislation) and USAspending.gov (federal contract awards). This is the same information anyone can access. The difference is that we aggregate it, analyze it with AI, and deliver it to you daily with specific stock tickers and market impact analysis — something that would take hours to do manually.',
      },
      {
        q: 'How is this different from just reading Congress.gov?',
        a: 'Congress.gov publishes thousands of bills. Most have zero market impact. HillSignal filters the noise — we analyze each bill and contract for which publicly traded companies are affected, what sectors are impacted, whether the sentiment is bullish or bearish, and how significant the market impact is likely to be (scored 1-10). You get the 5-10 signals that actually matter to investors, not the 500 that don\'t.',
      },
      {
        q: 'What exactly do I get when I pay?',
        a: 'Full access to the HillSignal dashboard with all Congressional signals, AI-generated market analysis for each signal (affected tickers, sector impact, sentiment, key takeaways), sector-specific filtering, a daily AI market digest email with the top signals, and the ability to customize which sectors you follow.',
      },
      {
        q: 'How often is the data updated?',
        a: 'We poll Congress.gov and USAspending.gov daily for new bills and federal contracts. Each new signal is analyzed by AI within hours of being detected. You also receive a curated daily digest email summarizing the most impactful signals.',
      },
    ],
  },
  {
    category: 'Pricing & Billing',
    questions: [
      {
        q: 'What does "lifetime access" mean?',
        a: 'For the first 5,000 users, HillSignal is a one-time payment. You pay once and get access forever — no monthly fees, no renewal charges. After 5,000 users, we switch to a $19/month subscription model. Early adopters keep their lifetime access regardless.',
      },
      {
        q: 'What\'s the refund policy?',
        a: 'We offer a 7-day refund policy for lifetime access purchases. If you\'re not satisfied within the first 7 days, contact us at support@hillsignal.com for a full refund. For monthly subscriptions (5,000+ tier), you can cancel anytime — no partial refunds for the current billing period.',
      },
      {
        q: 'Why does the price increase?',
        a: 'Our tiered pricing rewards early supporters. The first 1,000 users get lifetime access for $5. Users 1,001-3,000 pay $9. Users 3,001-5,000 pay $15. After 5,000 users, it becomes $19/month. Once a tier fills up, that price is gone permanently. This isn\'t artificial scarcity — it\'s how we fund development while rewarding people who take a chance on us early.',
      },
    ],
  },
  {
    category: 'Data & Trust',
    questions: [
      {
        q: 'Is this financial advice?',
        a: 'No. HillSignal provides informational data only. We are not a registered investment advisor, broker-dealer, or financial planner. The AI analysis, sentiment scores, and ticker identifications are for informational and educational purposes. Always do your own research and consult a qualified financial advisor before making investment decisions.',
      },
      {
        q: 'How accurate is the AI analysis?',
        a: 'The AI identifies affected companies and sectors based on the text of bills and contract descriptions. It\'s generally strong at identifying obvious connections (e.g., a defense contract mentioning Lockheed Martin → $LMT) but may miss nuanced secondary effects. We score each signal\'s market impact 1-10 to help you prioritize. We recommend using HillSignal as a starting point for research, not as a sole decision-making tool.',
      },
      {
        q: 'Who built HillSignal?',
        a: 'HillSignal is an independent, bootstrapped product built by a solo founder who was frustrated by the information gap between institutional and retail investors. No venture capital, no corporate backing — just a tool built to solve a real problem. Read more on our About page.',
      },
    ],
  },
]

export default function FAQPage() {
  // JSON-LD for FAQ page
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.flatMap(cat =>
      cat.questions.map(faq => ({
        '@type': 'Question',
        name: faq.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.a,
        },
      }))
    ),
  }

  return (
    <div className="min-h-screen bg-hill-black">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Header */}
      <header className="border-b border-hill-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-hill-white">Hill<span className="text-hill-orange">Signal</span></Link>
          <Link href="/" className="text-hill-muted hover:text-hill-white text-sm transition-colors">← Back to Home</Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-3xl md:text-4xl font-bold text-hill-white mb-4">Frequently Asked Questions</h1>
        <p className="text-hill-muted mb-12">Everything you need to know about HillSignal before you buy.</p>

        {FAQS.map((category) => (
          <section key={category.category} className="mb-12">
            <h2 className="text-lg font-semibold text-hill-orange mb-6 uppercase tracking-wider">{category.category}</h2>
            <div className="space-y-6">
              {category.questions.map((faq) => (
                <div key={faq.q} className="bg-hill-dark border border-hill-border rounded-lg p-5">
                  <h3 className="text-hill-white font-semibold mb-3">{faq.q}</h3>
                  <p className="text-hill-muted text-sm leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </section>
        ))}

        {/* Still have questions */}
        <section className="text-center mt-16 bg-hill-dark border border-hill-border rounded-lg p-8">
          <h2 className="text-xl font-semibold text-hill-white mb-3">Still have questions?</h2>
          <p className="text-hill-muted mb-4">I read every email and respond personally.</p>
          <a href="mailto:support@hillsignal.com" className="inline-flex items-center gap-2 bg-hill-orange hover:bg-hill-orange-dark text-white font-semibold py-3 px-6 rounded-lg transition-all">
            Email support@hillsignal.com
          </a>
        </section>
      </main>
    </div>
  )
}
