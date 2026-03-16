'use client'

import { useEffect, useState } from 'react'
import Card from '@/components/ui/Card'
import LiveIndicator from '@/components/ui/LiveIndicator'
import type { Signal } from '@/lib/types'

const FALLBACK_SIGNALS = [
  {
    id: 'demo-1', title: 'Senate Finance Committee Hearing on PBM Practices', event_date: '2026-03-12T14:00:00Z',
    committee: 'Senate Finance', sentiment: 'bearish' as const, impact_score: 8, tickers: ['$CVS', '$UNH', '$CI'],
    affected_sectors: ['Healthcare'], summary: 'Committee examining pharmacy benefit manager practices and drug pricing.',
  },
  {
    id: 'demo-2', title: 'House Armed Services: FY2027 Defense Budget Markup', event_date: '2026-03-11T10:00:00Z',
    committee: 'House Armed Services', sentiment: 'bullish' as const, impact_score: 9, tickers: ['$LMT', '$RTX', '$GD'],
    affected_sectors: ['Defense'], summary: 'Committee approved $886B defense authorization with bipartisan support.',
  },
  {
    id: 'demo-3', title: 'Senate Energy Committee: AI Infrastructure Permitting', event_date: '2026-03-10T15:30:00Z',
    committee: 'Senate Energy', sentiment: 'bullish' as const, impact_score: 7, tickers: ['$NVDA', '$AMD', '$MSFT'],
    affected_sectors: ['Technology', 'Energy'], summary: 'Bipartisan support for AI datacenter expansion legislation.',
  },
  {
    id: 'demo-4', title: 'House Financial Services: Bank Capital Requirements', event_date: '2026-03-09T09:00:00Z',
    committee: 'House Financial Services', sentiment: 'neutral' as const, impact_score: 6, tickers: ['$JPM', '$BAC'],
    affected_sectors: ['Finance'], summary: 'Ongoing debate over Basel III endgame rules.',
  },
]

const sentimentColors: Record<string, string> = {
  bullish: 'text-hill-green bg-hill-green/10 border-hill-green/30',
  bearish: 'text-hill-red bg-hill-red/10 border-hill-red/30',
  neutral: 'text-hill-blue bg-hill-blue/10 border-hill-blue/30',
}

export default function SignalFeed() {
  const [activeSignal, setActiveSignal] = useState(0)
  const [signals, setSignals] = useState<any[]>(FALLBACK_SIGNALS)

  useEffect(() => {
    // Fetch real signals for the landing page preview
    const fetchSignals = async () => {
      try {
        const res = await fetch('/api/signals?limit=4')
        if (res?.ok) {
          const data = await res?.json?.()
          if (data?.signals?.length > 0) {
            setSignals(data.signals)
          }
        }
      } catch { /* fallback to demo signals */ }
    }
    fetchSignals()
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSignal((prev) => (prev + 1) % (signals?.length ?? 1))
    }, 5000)
    return () => clearInterval(interval)
  }, [signals?.length])

  return (
    <section id="signals" className="py-20 px-4 bg-hill-dark">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <LiveIndicator label="LIVE SIGNAL FEED" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-hill-white mb-4">See What Congress Sees</h2>
          <p className="text-hill-muted max-w-2xl mx-auto">Real-time intelligence from committee hearings, floor votes, and legislative actions.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {(signals ?? [])?.map?.((signal: any, index: number) => (
            <Card key={signal?.id ?? index} hover className={`cursor-pointer transition-all duration-300 ${index === activeSignal ? 'border-hill-orange ring-1 ring-hill-orange/30' : ''}`} onClick={() => setActiveSignal(index)}>
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1">
                  <p className="text-xs text-hill-muted font-mono mb-1">
                    {signal?.committee ?? 'Congress'} • {signal?.event_date ? new Date(signal.event_date).toLocaleDateString() : ''}
                  </p>
                  <h3 className="text-hill-white font-semibold leading-tight">{signal?.title ?? 'Signal'}</h3>
                </div>
                <div className={`px-2 py-1 rounded border text-xs font-mono uppercase ${sentimentColors?.[signal?.sentiment] ?? sentimentColors.neutral}`}>
                  {signal?.sentiment ?? 'neutral'}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {(signal?.tickers ?? [])?.map?.((ticker: string) => (
                  <span key={ticker} className="bg-hill-gray px-2 py-1 rounded text-sm font-mono text-hill-orange">{ticker}</span>
                ))}
              </div>
              <p className="text-hill-muted text-sm leading-relaxed mb-4">{signal?.summary ?? ''}</p>
              <div className="flex items-center justify-between pt-3 border-t border-hill-border">
                <span className="text-xs text-hill-muted">Impact Score</span>
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {[...Array(10)]?.map?.((_, i: number) => (
                      <div key={i} className={`w-2 h-4 rounded-sm ${i < (signal?.impact_score ?? 0) ? ((signal?.impact_score ?? 0) >= 7 ? 'bg-hill-orange' : 'bg-hill-green') : 'bg-hill-gray'}`} />
                    ))}
                  </div>
                  <span className="font-mono text-hill-white">{signal?.impact_score ?? 0}/10</span>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-hill-muted mb-4">This is just a preview. Get full access to all signals.</p>
          <a href="/signup" className="inline-flex items-center gap-2 bg-hill-orange hover:bg-hill-orange-dark text-white font-semibold py-3 px-8 rounded-lg transition-all duration-200">Get Full Access →</a>
        </div>
      </div>
    </section>
  )
}
