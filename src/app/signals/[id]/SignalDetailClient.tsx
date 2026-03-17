'use client'

import Link from 'next/link'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import type { Signal } from '@/lib/types'
import { ArrowLeft, ExternalLink, TrendingUp, TrendingDown, Minus, Clock, Building, Users } from 'lucide-react'

const sentimentConfig: Record<string, { color: string; bg: string; border: string; label: string; Icon: any }> = {
  bullish: { color: 'text-hill-green', bg: 'bg-hill-green/10', border: 'border-hill-green/30', label: 'Bullish', Icon: TrendingUp },
  bearish: { color: 'text-hill-red', bg: 'bg-hill-red/10', border: 'border-hill-red/30', label: 'Bearish', Icon: TrendingDown },
  neutral: { color: 'text-hill-blue', bg: 'bg-hill-blue/10', border: 'border-hill-blue/30', label: 'Neutral', Icon: Minus },
}

export default function SignalDetailClient({ signal }: { signal: Signal }) {
  const sentiment = sentimentConfig?.[signal?.sentiment ?? 'neutral'] ?? sentimentConfig?.neutral
  const SentimentIcon = sentiment?.Icon ?? Minus

  return (
    <div className="min-h-screen bg-hill-black">
      <header className="sticky top-0 z-50 bg-hill-black/80 backdrop-blur-md border-b border-hill-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="text-xl font-bold text-hill-white">Hill<span className="text-hill-orange">Signal</span></Link>
          <Link href="/dashboard">
            <Button variant="ghost" size="sm"><ArrowLeft size={14} className="mr-2" /> Back to Feed</Button>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Title area */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs text-hill-muted font-mono mb-3">
            <span className="uppercase px-2 py-0.5 bg-hill-gray rounded">{signal?.event_type ?? 'signal'}</span>
            {signal?.bill_number && <span className="text-hill-orange">{signal.bill_number}</span>}
            <span>\u2022</span>
            <Clock size={12} />
            <span>{signal?.event_date ? new Date(signal.event_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Unknown date'}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-hill-white leading-tight mb-4">{signal?.title ?? 'Untitled Signal'}</h1>
          <div className="flex flex-wrap items-center gap-3">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-mono ${sentiment?.bg ?? ''} ${sentiment?.border ?? ''} ${sentiment?.color ?? ''}`}>
              <SentimentIcon size={16} /> {sentiment?.label ?? 'Neutral'}
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-hill-dark border border-hill-border">
              <span className="text-xs text-hill-muted">Impact</span>
              <span className="font-mono text-hill-orange font-bold">{signal?.impact_score ?? 0}/10</span>
            </div>
            {signal?.committee && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-hill-dark border border-hill-border text-sm text-hill-muted">
                <Building size={14} /> {signal.committee}
              </div>
            )}
          </div>
        </div>

        {/* Tickers & Sectors */}
        <div className="flex flex-wrap gap-2 mb-8">
          {(signal?.tickers ?? [])?.map?.((t: string) => (
            <span key={t} className="bg-hill-orange/10 border border-hill-orange/30 text-hill-orange px-4 py-2 rounded-lg text-sm font-mono font-semibold">{t}</span>
          ))}
          {(signal?.affected_sectors ?? [])?.map?.((s: string) => (
            <span key={s} className="bg-hill-gray px-4 py-2 rounded-lg text-sm text-hill-text border border-hill-border">{s}</span>
          ))}
        </div>

        {/* Summary */}
        <Card className="mb-6">
          <h2 className="text-lg font-semibold text-hill-white mb-3">Summary</h2>
          <p className="text-hill-text leading-relaxed">{signal?.summary ?? 'No summary available.'}</p>
        </Card>

        {/* Key Takeaways */}
        {(signal?.key_takeaways?.length ?? 0) > 0 && (
          <Card className="mb-6">
            <h2 className="text-lg font-semibold text-hill-white mb-3">Key Takeaways</h2>
            <ul className="space-y-3">
              {(signal?.key_takeaways ?? [])?.map?.((takeaway: string, i: number) => (
                <li key={i} className="flex items-start gap-3 text-hill-text">
                  <span className="text-hill-orange font-bold mt-0.5">{i + 1}.</span>
                  <span className="leading-relaxed">{takeaway}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* Market Implications */}
        {signal?.market_implications && (
          <Card className="mb-6">
            <h2 className="text-lg font-semibold text-hill-white mb-3">Market Implications</h2>
            <p className="text-hill-text leading-relaxed">{signal.market_implications}</p>
          </Card>
        )}

        {/* Full Analysis */}
        {signal?.full_analysis && (
          <Card className="mb-6">
            <h2 className="text-lg font-semibold text-hill-white mb-3">Full Analysis</h2>
            <div className="text-hill-text leading-relaxed whitespace-pre-line">{signal.full_analysis}</div>
          </Card>
        )}

        {/* Legislators */}
        {(signal?.legislators?.length ?? 0) > 0 && (
          <Card className="mb-6">
            <h2 className="text-lg font-semibold text-hill-white mb-3 flex items-center gap-2"><Users size={18} /> Key Legislators</h2>
            <div className="flex flex-wrap gap-2">
              {(signal?.legislators ?? [])?.map?.((leg: string, i: number) => (
                <span key={i} className="bg-hill-gray px-4 py-2 rounded-lg text-sm text-hill-text border border-hill-border">{leg}</span>
              ))}
            </div>
          </Card>
        )}

        {/* Impact Score Visual */}
        <Card className="mb-8">
          <h2 className="text-lg font-semibold text-hill-white mb-4">Market Impact Score</h2>
          <div className="flex items-center gap-4">
            <div className="flex gap-1 flex-1">
              {[...(Array(10) ?? [])]?.map?.((_: any, i: number) => (
                <div key={i} className={`flex-1 h-8 rounded transition-all ${
                  i < (signal?.impact_score ?? 0)
                    ? (signal?.impact_score ?? 0) >= 7 ? 'bg-hill-orange' : (signal?.impact_score ?? 0) >= 4 ? 'bg-hill-green' : 'bg-hill-blue'
                    : 'bg-hill-gray'
                }`} />
              ))}
            </div>
            <span className="font-mono text-3xl text-hill-white font-bold">{signal?.impact_score ?? 0}<span className="text-hill-muted text-lg">/10</span></span>
          </div>
          <div className="flex justify-between text-xs text-hill-muted mt-2">
            <span>Minimal Impact</span><span>Moderate</span><span>Major Market Event</span>
          </div>
        </Card>

        {/* Links */}
        <div className="flex flex-wrap gap-4">
          {signal?.source_url && (
            <a href={signal.source_url} target="_blank" rel="noopener noreferrer">
              <Button variant="secondary">View on {signal?.event_type === 'contract_award' ? 'USAspending.gov' : 'Congress.gov'} <ExternalLink size={14} className="ml-2" /></Button>
            </a>
          )}
          <Link href="/dashboard"><Button variant="ghost"><ArrowLeft size={14} className="mr-2" /> Back to Feed</Button></Link>
        </div>
      </main>
    </div>
  )
}
