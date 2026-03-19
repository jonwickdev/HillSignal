'use client'

import { useEffect, useState } from 'react'
import Card from '@/components/ui/Card'
import LiveIndicator from '@/components/ui/LiveIndicator'
import Link from 'next/link'

interface FeaturedSignal {
  id: string
  title: string
  summary: string | null
  sentiment: string | null
  impact_score: number | null
  affected_tickers: string[] | null
  affected_sectors: string[] | null
  event_type: string | null
  event_date: string | null
  source: string | null
}

const sentimentColors: Record<string, string> = {
  bullish: 'text-hill-green bg-hill-green/10 border-hill-green/30',
  bearish: 'text-hill-red bg-hill-red/10 border-hill-red/30',
  neutral: 'text-hill-blue bg-hill-blue/10 border-hill-blue/30',
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function SignalFeed({ signals }: { signals: FeaturedSignal[] }) {
  const [activeSignal, setActiveSignal] = useState(0)

  const displaySignals = signals.length > 0 ? signals : []

  // Auto-rotate through signals
  useEffect(() => {
    if (displaySignals.length === 0) return
    const interval = setInterval(() => {
      setActiveSignal((prev) => (prev + 1) % displaySignals.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [displaySignals.length])

  if (displaySignals.length === 0) return null

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
            Real-time intelligence from Congressional bills, federal contracts, and legislative actions.
            Translated into actionable market signals.
          </p>
        </div>

        {/* Signal cards grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {displaySignals.map((signal, index) => {
            const tickers = signal.affected_tickers ?? []
            const sectors = signal.affected_sectors ?? []
            const sentiment = signal.sentiment ?? 'neutral'
            const impactScore = signal.impact_score ?? 0
            const sourceLabel = signal.event_type === 'contract' ? 'Federal Contract' : signal.event_type === 'bill' ? 'Congressional Bill' : (signal.event_type ?? 'Signal')
            
            return (
              <Link href={`/signals/${signal.id}`} key={signal.id}>
                <Card
                  hover
                  className={`cursor-pointer transition-all duration-300 h-full ${
                    index === activeSignal ? 'border-hill-orange ring-1 ring-hill-orange/30' : ''
                  }`}
                  onClick={() => setActiveSignal(index)}
                >
                  {/* Signal header */}
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <p className="text-xs text-hill-muted font-mono mb-1">
                        {sourceLabel} {sectors.length > 0 && `• ${sectors[0]}`} • {formatDate(signal.event_date)}
                      </p>
                      <h3 className="text-hill-white font-semibold leading-tight">
                        {signal.title}
                      </h3>
                    </div>
                    <div
                      className={`px-2 py-1 rounded border text-xs font-mono uppercase flex-shrink-0 ${
                        sentimentColors[sentiment] || sentimentColors.neutral
                      }`}
                    >
                      {sentiment}
                    </div>
                  </div>

                  {/* Tickers */}
                  {tickers.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {tickers.slice(0, 5).map((ticker) => (
                        <span
                          key={ticker}
                          className="bg-hill-gray px-2 py-1 rounded text-sm font-mono text-hill-orange"
                        >
                          {ticker.startsWith('$') ? ticker : `$${ticker}`}
                        </span>
                      ))}
                      {tickers.length > 5 && (
                        <span className="bg-hill-gray px-2 py-1 rounded text-sm font-mono text-hill-muted">
                          +{tickers.length - 5}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Summary */}
                  <p className="text-hill-muted text-sm leading-relaxed mb-4 line-clamp-3">
                    {signal.summary || 'Analysis pending...'}
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
                              i < impactScore
                                ? impactScore >= 7
                                  ? 'bg-hill-orange'
                                  : 'bg-hill-green'
                                : 'bg-hill-gray'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="font-mono text-hill-white">{impactScore}/10</span>
                    </div>
                  </div>
                </Card>
              </Link>
            )
          })}
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
