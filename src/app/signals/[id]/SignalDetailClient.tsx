'use client'

import Link from 'next/link'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import type { Signal } from '@/lib/types'
import { ArrowLeft, ExternalLink, TrendingUp, TrendingDown, Minus, Clock, Building, Users, FileText, Link2, DollarSign, FileBarChart } from 'lucide-react'

/** Fix malformed dollar amounts in titles (e.g., "$10410.5M" → "$10.4B") */
function fixTitleDollars(title: string): string {
  return title.replace(/\$[\d,]+(?:\.\d+)?[MBK]/g, (match) => {
    const suffix = match.slice(-1)
    const num = parseFloat(match.slice(1, -1).replace(/,/g, ''))
    if (isNaN(num)) return match
    const multipliers: Record<string, number> = { K: 1_000, M: 1_000_000, B: 1_000_000_000 }
    const raw = num * (multipliers[suffix] ?? 1)
    if (raw >= 1_000_000_000) {
      const b = raw / 1_000_000_000
      return `$${b >= 100 ? b.toFixed(0) : b.toFixed(1)}B`
    }
    if (raw >= 1_000_000) {
      const m = raw / 1_000_000
      return `$${m >= 100 ? m.toFixed(0) : m.toFixed(1)}M`
    }
    return match
  })
}

const sentimentConfig: Record<string, { color: string; bg: string; border: string; label: string; Icon: any }> = {
  bullish: { color: 'text-hill-green', bg: 'bg-hill-green/10', border: 'border-hill-green/30', label: 'Bullish', Icon: TrendingUp },
  bearish: { color: 'text-hill-red', bg: 'bg-hill-red/10', border: 'border-hill-red/30', label: 'Bearish', Icon: TrendingDown },
  neutral: { color: 'text-hill-blue', bg: 'bg-hill-blue/10', border: 'border-hill-blue/30', label: 'Neutral', Icon: Minus },
}

interface ConnectedSignal extends Signal {
  _connectionReasons?: string[]
  _connectionScore?: number
}

export default function SignalDetailClient({ signal, connectedSignals = [] }: { signal: Signal; connectedSignals?: ConnectedSignal[] }) {
  const sentiment = sentimentConfig?.[signal?.sentiment ?? 'neutral'] ?? sentimentConfig?.neutral
  const SentimentIcon = sentiment?.Icon ?? Minus
  const hasAnalysis = !!(signal?.full_analysis && signal.full_analysis.length > 0)
  const hasSummary = !!(signal?.summary && signal.summary.length > 0)
  const hasTickers = (signal?.tickers?.length ?? 0) > 0
  const hasTakeaways = (signal?.key_takeaways?.length ?? 0) > 0
  const hasImplications = !!(signal?.market_implications && signal.market_implications.length > 0)
  const hasLegislators = (signal?.legislators?.length ?? 0) > 0

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
        {/* Tracked-only banner — no AI analysis yet */}
        {!hasAnalysis && (
          <div className="mb-6 bg-hill-blue/10 border border-hill-blue/30 rounded-xl p-5 flex items-start gap-4">
            <FileText size={20} className="text-hill-blue shrink-0 mt-0.5" />
            <div>
              <p className="text-hill-white font-semibold text-sm mb-1">This bill is being tracked</p>
              <p className="text-hill-muted text-sm leading-relaxed">
                HillSignal has recorded this legislation from Congress.gov. Full AI market analysis — including affected tickers, key takeaways, and market implications — has not been generated yet. Check back as analysis is added to tracked bills over time.
              </p>
            </div>
          </div>
        )}

        {/* Title area */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs text-hill-muted font-mono mb-3">
            <span className="uppercase px-2 py-0.5 bg-hill-gray rounded">{signal?.event_type ?? 'signal'}</span>
            {signal?.bill_number && <span className="text-hill-orange">{signal.bill_number}</span>}
            <span>\u2022</span>
            <Clock size={12} />
            <span>{signal?.event_date ? new Date(signal.event_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Unknown date'}</span>
            {/* Status badge */}
            {hasAnalysis ? (
              <span className="ml-2 px-2 py-0.5 bg-hill-green/10 text-hill-green border border-hill-green/30 rounded text-xs font-medium">Analyzed</span>
            ) : (
              <span className="ml-2 px-2 py-0.5 bg-hill-gray text-hill-muted border border-hill-border rounded text-xs">Tracked</span>
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-hill-white leading-tight mb-4">{fixTitleDollars(signal?.title ?? 'Untitled Signal')}</h1>
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
        {(hasTickers || (signal?.affected_sectors?.length ?? 0) > 0) && (
          <div className="flex flex-wrap gap-2 mb-8">
            {(signal?.tickers ?? [])?.map?.((t: string) => (
              <span key={t} className="bg-hill-orange/10 border border-hill-orange/30 text-hill-orange px-4 py-2 rounded-lg text-sm font-mono font-semibold">{t}</span>
            ))}
            {(signal?.affected_sectors ?? [])?.map?.((s: string) => (
              <span key={s} className="bg-hill-gray px-4 py-2 rounded-lg text-sm text-hill-text border border-hill-border">{s}</span>
            ))}
          </div>
        )}

        {/* Summary — only if non-empty */}
        {hasSummary && (
          <Card className="mb-6">
            <h2 className="text-lg font-semibold text-hill-white mb-3">Summary</h2>
            <p className="text-hill-text leading-relaxed">{signal.summary}</p>
          </Card>
        )}

        {/* Key Takeaways */}
        {hasTakeaways && (
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
        {hasImplications && (
          <Card className="mb-6">
            <h2 className="text-lg font-semibold text-hill-white mb-3">Market Implications</h2>
            <p className="text-hill-text leading-relaxed">{signal.market_implications}</p>
          </Card>
        )}

        {/* Full Analysis */}
        {hasAnalysis && (
          <Card className="mb-6">
            <h2 className="text-lg font-semibold text-hill-white mb-3">Full Analysis</h2>
            <div className="text-hill-text leading-relaxed whitespace-pre-line">{signal.full_analysis}</div>
          </Card>
        )}

        {/* Legislators */}
        {hasLegislators && (
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

        {/* Connected Signals — Follow the Money */}
        {connectedSignals.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-hill-orange/10 rounded-lg border border-hill-orange/30">
                <Link2 size={18} className="text-hill-orange" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-hill-white">Connected Signals</h2>
                <p className="text-xs text-hill-muted">Follow the money — bills, contracts, and tickers that connect</p>
              </div>
            </div>
            <div className="space-y-3">
              {connectedSignals.map((cs) => {
                const csSentiment = sentimentConfig?.[cs?.sentiment ?? 'neutral'] ?? sentimentConfig?.neutral
                const CsIcon = cs.event_type === 'contract_award' ? DollarSign : FileBarChart
                const reasons = cs._connectionReasons ?? []
                const topReason = reasons[0] ?? 'Related signal'
                const isStrongLink = (cs._connectionScore ?? 0) >= 10

                return (
                  <Link key={cs.id} href={`/signals/${cs.id}`}>
                    <Card hover className="p-4 group cursor-pointer transition-all">
                      <div className="flex items-start gap-3">
                        {/* Type icon */}
                        <div className={`shrink-0 mt-1 p-1.5 rounded-lg ${
                          cs.event_type === 'contract_award'
                            ? 'bg-hill-green/10 border border-hill-green/30'
                            : 'bg-hill-blue/10 border border-hill-blue/30'
                        }`}>
                          <CsIcon size={14} className={cs.event_type === 'contract_award' ? 'text-hill-green' : 'text-hill-blue'} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 bg-hill-gray rounded text-hill-muted">
                              {cs.event_type === 'contract_award' ? 'Contract' : 'Bill'}
                            </span>
                            {isStrongLink && (
                              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-hill-orange/10 border border-hill-orange/30 rounded text-hill-orange">
                                Direct Link
                              </span>
                            )}
                            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${csSentiment?.bg ?? ''} ${csSentiment?.border ?? ''} ${csSentiment?.color ?? ''}`}>
                              {csSentiment?.label ?? 'Neutral'}
                            </span>
                          </div>
                          <p className="text-sm text-hill-white font-medium leading-snug truncate group-hover:text-hill-orange transition-colors">
                            {cs.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[11px] text-hill-muted">{topReason}</span>
                            {(cs.tickers?.length ?? 0) > 0 && (
                              <span className="text-[11px] font-mono text-hill-orange">
                                {cs.tickers.slice(0, 3).join(' · ')}{cs.tickers.length > 3 ? ` +${cs.tickers.length - 3}` : ''}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Score */}
                        <div className="shrink-0 text-right">
                          <span className="font-mono text-sm text-hill-white font-bold">{cs.impact_score}</span>
                          <span className="text-hill-muted text-xs">/10</span>
                        </div>
                      </div>
                    </Card>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Contract Details — raw_data for contract awards */}
        {signal.event_type === 'contract_award' && signal.raw_data && (
          <Card className="mb-8">
            <h2 className="text-lg font-semibold text-hill-white mb-4 flex items-center gap-2">
              <DollarSign size={18} className="text-hill-green" /> Contract Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {signal.raw_data.recipient_name && (
                <div>
                  <p className="text-xs text-hill-muted mb-0.5">Recipient</p>
                  <p className="text-sm text-hill-white font-medium">{signal.raw_data.recipient_name}</p>
                </div>
              )}
              {signal.raw_data.award_amount && (
                <div>
                  <p className="text-xs text-hill-muted mb-0.5">Award Amount</p>
                  <p className="text-sm text-hill-orange font-mono font-bold">
                    ${Number(signal.raw_data.award_amount).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </p>
                </div>
              )}
              {signal.raw_data.awarding_agency && (
                <div>
                  <p className="text-xs text-hill-muted mb-0.5">Awarding Agency</p>
                  <p className="text-sm text-hill-white">{signal.raw_data.awarding_agency}</p>
                </div>
              )}
              {signal.raw_data.awarding_sub_agency && (
                <div>
                  <p className="text-xs text-hill-muted mb-0.5">Sub-Agency</p>
                  <p className="text-sm text-hill-white">{signal.raw_data.awarding_sub_agency}</p>
                </div>
              )}
              {signal.raw_data.naics_code && (
                <div>
                  <p className="text-xs text-hill-muted mb-0.5">NAICS Code</p>
                  <p className="text-sm text-hill-white font-mono">{signal.raw_data.naics_code}</p>
                </div>
              )}
              {signal.raw_data.contract_type && (
                <div>
                  <p className="text-xs text-hill-muted mb-0.5">Contract Type</p>
                  <p className="text-sm text-hill-white">{signal.raw_data.contract_type}</p>
                </div>
              )}
              {signal.raw_data.related_bill_numbers?.length > 0 && (
                <div className="sm:col-span-2">
                  <p className="text-xs text-hill-muted mb-1">Related Bills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {signal.raw_data.related_bill_numbers.map((bn: string) => (
                      <span key={bn} className="text-xs font-mono bg-hill-orange/10 text-hill-orange border border-hill-orange/30 px-2 py-0.5 rounded">
                        {bn}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

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
