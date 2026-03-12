'use client'

import { useEffect, useState } from 'react'
import Card from '@/components/ui/Card'
import LiveIndicator from '@/components/ui/LiveIndicator'

// Mock signal data for demonstration
const MOCK_SIGNALS = [
  {
    id: '1',
    title: 'Senate Finance Committee Hearing on PBM Practices',
    date: '2026-03-12T14:00:00Z',
    committee: 'Senate Finance',
    sentiment: 'negative' as const,
    impact_score: 8,
    tickers: ['$CVS', '$UNH', '$CI'],
    sectors: ['Healthcare'],
    summary: 'Committee examining pharmacy benefit manager practices and drug pricing. Senators expressed concerns about middlemen profits and lack of transparency.',
  },
  {
    id: '2',
    title: 'House Armed Services: Defense Budget Markup',
    date: '2026-03-11T10:00:00Z',
    committee: 'House Armed Services',
    sentiment: 'positive' as const,
    impact_score: 9,
    tickers: ['$LMT', '$RTX', '$GD', '$NOC'],
    sectors: ['Defense'],
    summary: 'Committee approved $886B defense authorization. Increased funding for hypersonic weapons development and shipbuilding programs.',
  },
  {
    id: '3',
    title: 'Senate Energy Committee: AI Infrastructure',
    date: '2026-03-10T15:30:00Z',
    committee: 'Senate Energy',
    sentiment: 'positive' as const,
    impact_score: 7,
    tickers: ['$NVDA', '$AMD', '$MSFT'],
    sectors: ['Technology', 'Energy'],
    summary: 'Bipartisan support for AI datacenter expansion. Discussion of permitting reform for power infrastructure to support AI compute demands.',
  },
  {
    id: '4',
    title: 'House Financial Services: Bank Capital Requirements',
    date: '2026-03-09T09:00:00Z',
    committee: 'House Financial Services',
    sentiment: 'neutral' as const,
    impact_score: 6,
    tickers: ['$JPM', '$BAC', '$WFC'],
    sectors: ['Finance'],
    summary: 'Ongoing debate over Basel III endgame rules. Regulators facing pressure to revise capital requirements for large banks.',
  },
]

const sentimentColors = {
  positive: 'text-hill-green bg-hill-green/10 border-hill-green/30',
  negative: 'text-hill-red bg-hill-red/10 border-hill-red/30',
  neutral: 'text-hill-blue bg-hill-blue/10 border-hill-blue/30',
}

export default function SignalFeed() {
  const [activeSignal, setActiveSignal] = useState(0)

  // Auto-rotate through signals
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSignal((prev) => (prev + 1) % MOCK_SIGNALS.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section id="signals" className="py-20 px-4 bg-hill-dark">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <LiveIndicator label="LIVE SIGNAL FEED" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-hill-white mb-4">
            See What Congress Sees
          </h2>
          <p className="text-hill-muted max-w-2xl mx-auto">
            Real-time intelligence from committee hearings, floor votes, and legislative actions.
            Translated into actionable market signals.
          </p>
        </div>

        {/* Signal cards grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {MOCK_SIGNALS.map((signal, index) => (
            <Card
              key={signal.id}
              hover
              className={`cursor-pointer transition-all duration-300 ${
                index === activeSignal ? 'border-hill-orange ring-1 ring-hill-orange/30' : ''
              }`}
              onClick={() => setActiveSignal(index)}
            >
              {/* Signal header */}
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1">
                  <p className="text-xs text-hill-muted font-mono mb-1">
                    {signal.committee} • {new Date(signal.date).toLocaleDateString()}
                  </p>
                  <h3 className="text-hill-white font-semibold leading-tight">
                    {signal.title}
                  </h3>
                </div>
                <div
                  className={`px-2 py-1 rounded border text-xs font-mono uppercase ${
                    sentimentColors[signal.sentiment]
                  }`}
                >
                  {signal.sentiment}
                </div>
              </div>

              {/* Tickers */}
              <div className="flex flex-wrap gap-2 mb-3">
                {signal.tickers.map((ticker) => (
                  <span
                    key={ticker}
                    className="bg-hill-gray px-2 py-1 rounded text-sm font-mono text-hill-orange"
                  >
                    {ticker}
                  </span>
                ))}
              </div>

              {/* Summary */}
              <p className="text-hill-muted text-sm leading-relaxed mb-4">
                {signal.summary}
              </p>

              {/* Impact score */}
              <div className="flex items-center justify-between pt-3 border-t border-hill-border">
                <span className="text-xs text-hill-muted">Impact Score</span>
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {[...Array(10)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-2 h-4 rounded-sm ${
                          i < signal.impact_score
                            ? signal.impact_score >= 7
                              ? 'bg-hill-orange'
                              : 'bg-hill-green'
                            : 'bg-hill-gray'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="font-mono text-hill-white">{signal.impact_score}/10</span>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <p className="text-hill-muted mb-4">This is just a preview. Get full access to all signals.</p>
          <a
            href="/signup"
            className="inline-flex items-center gap-2 bg-hill-orange hover:bg-hill-orange-dark text-white font-semibold py-3 px-8 rounded-lg transition-all duration-200"
          >
            Get Full Access →
          </a>
        </div>
      </div>
    </section>
  )
}
