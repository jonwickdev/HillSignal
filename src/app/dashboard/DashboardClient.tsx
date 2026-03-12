'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import LiveIndicator from '@/components/ui/LiveIndicator'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

// Mock signals for demonstration
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
    summary: 'Committee examining pharmacy benefit manager practices and drug pricing. Senators expressed concerns about middlemen profits and lack of transparency. Several senators called for increased oversight and potential legislation.',
    event_type: 'hearing',
  },
  {
    id: '2',
    title: 'House Armed Services: FY2027 Defense Budget Markup',
    date: '2026-03-11T10:00:00Z',
    committee: 'House Armed Services',
    sentiment: 'positive' as const,
    impact_score: 9,
    tickers: ['$LMT', '$RTX', '$GD', '$NOC'],
    sectors: ['Defense'],
    summary: 'Committee approved $886B defense authorization with bipartisan support. Increased funding for hypersonic weapons development, shipbuilding programs, and cybersecurity initiatives.',
    event_type: 'vote',
  },
  {
    id: '3',
    title: 'Senate Energy Committee: AI Infrastructure Permitting',
    date: '2026-03-10T15:30:00Z',
    committee: 'Senate Energy',
    sentiment: 'positive' as const,
    impact_score: 7,
    tickers: ['$NVDA', '$AMD', '$MSFT'],
    sectors: ['Technology', 'Energy'],
    summary: 'Bipartisan support for AI datacenter expansion legislation. Discussion of permitting reform for power infrastructure to support AI compute demands. Multiple senators expressed urgency.',
    event_type: 'hearing',
  },
  {
    id: '4',
    title: 'House Financial Services: Bank Capital Requirements Amendment',
    date: '2026-03-09T09:00:00Z',
    committee: 'House Financial Services',
    sentiment: 'neutral' as const,
    impact_score: 6,
    tickers: ['$JPM', '$BAC', '$WFC'],
    sectors: ['Finance'],
    summary: 'Ongoing debate over Basel III endgame rules. Regulators facing pressure to revise capital requirements for large banks. No clear consensus reached in committee.',
    event_type: 'amendment',
  },
  {
    id: '5',
    title: 'Joint Economic Committee: Supply Chain Reshoring',
    date: '2026-03-08T11:00:00Z',
    committee: 'Joint Economic',
    sentiment: 'positive' as const,
    impact_score: 5,
    tickers: ['$INTC', '$TSM', '$AMAT'],
    sectors: ['Technology', 'Manufacturing'],
    summary: 'Testimony on semiconductor supply chain resilience. Strong support for continued CHIPS Act funding. Discussion of additional incentives for domestic manufacturing.',
    event_type: 'hearing',
  },
]

const sentimentConfig = {
  positive: { color: 'text-hill-green', bg: 'bg-hill-green/10', border: 'border-hill-green/30', label: 'Bullish' },
  negative: { color: 'text-hill-red', bg: 'bg-hill-red/10', border: 'border-hill-red/30', label: 'Bearish' },
  neutral: { color: 'text-hill-blue', bg: 'bg-hill-blue/10', border: 'border-hill-blue/30', label: 'Neutral' },
}

interface DashboardClientProps {
  user: User
  preferences: any
}

export default function DashboardClient({ user, preferences }: DashboardClientProps) {
  const router = useRouter()
  const [selectedSector, setSelectedSector] = useState<string>('all')

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  // Filter signals by sector
  const filteredSignals = selectedSector === 'all'
    ? MOCK_SIGNALS
    : MOCK_SIGNALS.filter(s => s.sectors.some(sector => 
        sector.toLowerCase().includes(selectedSector.toLowerCase())
      ))

  const sectors = ['all', 'Healthcare', 'Defense', 'Technology', 'Finance', 'Energy']

  return (
    <div className="min-h-screen bg-hill-black">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-hill-black/80 backdrop-blur-md border-b border-hill-border">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-hill-white">
            Hill<span className="text-hill-orange">Signal</span>
          </Link>

          <div className="flex items-center gap-4">
            <LiveIndicator />
            <span className="text-hill-muted text-sm hidden sm:inline">{user.email}</span>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Welcome banner */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-hill-white mb-2">
            Congressional Signal Feed
          </h1>
          <p className="text-hill-muted">
            Real-time intelligence from committee hearings, votes, and legislative actions.
          </p>
        </div>

        {/* Sector filter */}
        <div className="mb-6 overflow-x-auto">
          <div className="flex gap-2 pb-2">
            {sectors.map((sector) => (
              <button
                key={sector}
                onClick={() => setSelectedSector(sector)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                  selectedSector === sector
                    ? 'bg-hill-orange text-white'
                    : 'bg-hill-gray text-hill-muted hover:text-hill-white border border-hill-border'
                }`}
              >
                {sector === 'all' ? 'All Sectors' : sector}
              </button>
            ))}
          </div>
        </div>

        {/* Signal feed */}
        <div className="space-y-4">
          {filteredSignals.map((signal) => {
            const sentiment = sentimentConfig[signal.sentiment]
            
            return (
              <Card key={signal.id} hover className="cursor-pointer">
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-xs text-hill-muted font-mono mb-2">
                      <span className="uppercase px-2 py-0.5 bg-hill-gray rounded">
                        {signal.event_type}
                      </span>
                      <span>{signal.committee}</span>
                      <span>•</span>
                      <span>{new Date(signal.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}</span>
                    </div>
                    <h2 className="text-lg font-semibold text-hill-white leading-tight">
                      {signal.title}
                    </h2>
                  </div>
                  
                  <div className={`px-3 py-1.5 rounded border text-sm font-mono ${sentiment.bg} ${sentiment.border} ${sentiment.color}`}>
                    {sentiment.label}
                  </div>
                </div>

                {/* Tickers */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {signal.tickers.map((ticker) => (
                    <span
                      key={ticker}
                      className="bg-hill-gray px-3 py-1 rounded text-sm font-mono text-hill-orange"
                    >
                      {ticker}
                    </span>
                  ))}
                  {signal.sectors.map((sector) => (
                    <span
                      key={sector}
                      className="bg-hill-border px-3 py-1 rounded text-sm text-hill-muted"
                    >
                      {sector}
                    </span>
                  ))}
                </div>

                {/* Summary */}
                <p className="text-hill-text text-sm leading-relaxed mb-4">
                  {signal.summary}
                </p>

                {/* Footer - Impact score */}
                <div className="flex items-center justify-between pt-4 border-t border-hill-border">
                  <span className="text-xs text-hill-muted">Market Impact Score</span>
                  <div className="flex items-center gap-3">
                    <div className="flex gap-0.5">
                      {[...Array(10)].map((_, i) => (
                        <div
                          key={i}
                          className={`w-2 h-5 rounded-sm transition-all ${
                            i < signal.impact_score
                              ? signal.impact_score >= 7
                                ? 'bg-hill-orange'
                                : signal.impact_score >= 4
                                ? 'bg-hill-green'
                                : 'bg-hill-blue'
                              : 'bg-hill-gray'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="font-mono text-hill-white font-semibold">
                      {signal.impact_score}/10
                    </span>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        {/* Empty state */}
        {filteredSignals.length === 0 && (
          <Card className="text-center py-12">
            <p className="text-hill-muted">No signals found for this sector.</p>
            <Button
              variant="ghost"
              className="mt-4"
              onClick={() => setSelectedSector('all')}
            >
              View all sectors
            </Button>
          </Card>
        )}

        {/* Mock data notice */}
        <div className="mt-8 text-center">
          <p className="text-hill-muted text-sm">
            🛠️ This is a preview with sample data. Live signals coming soon!
          </p>
        </div>
      </main>
    </div>
  )
}
