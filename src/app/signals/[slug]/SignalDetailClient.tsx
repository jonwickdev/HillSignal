'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import type { Signal } from '@/lib/types'
import { ArrowLeft, ExternalLink, TrendingUp, TrendingDown, Minus, Clock, Building, Users, FileText, Link2, DollarSign, FileBarChart, Share2, Check } from 'lucide-react'
import { generateSignalSlug } from '@/lib/slug'

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

export default function SignalDetailClient({ signal, connectedSignals = [], isAuthenticated = false }: { signal: Signal; connectedSignals?: ConnectedSignal[]; isAuthenticated?: boolean }) {
  const sentiment = sentimentConfig?.[signal?.sentiment ?? 'neutral'] ?? sentimentConfig?.neutral
  const SentimentIcon = sentiment?.Icon ?? Minus
  const hasAnalysis = !!(signal?.full_analysis && signal.full_analysis.length > 0)
  const hasSummary = !!(signal?.summary && signal.summary.length > 0)
  const hasTickers = (signal?.tickers?.length ?? 0) > 0
  const hasTakeaways = (signal?.key_takeaways?.length ?? 0) > 0
  const hasImplications = !!(signal?.market_implications && signal.market_implications.length > 0)
  const hasLegislators = (signal?.legislators?.length ?? 0) > 0

  const [copied, setCopied] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const shareRef = useRef<HTMLDivElement>(null)

  // Close share menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) {
        setShareOpen(false)
      }
    }
    if (shareOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [shareOpen])

  const shareUrl = `https://hillsignal.com/signals/${generateSignalSlug(signal.title ?? '', signal.id)}`
  const shareTitle = signal?.title ?? 'Congressional Signal'
  const shareText = `${shareTitle} — HillSignal`

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => { setCopied(false); setShareOpen(false) }, 1500)
    } catch {
      // fallback
    }
  }

  const shareToX = () => {
    window.open(`https://x.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`, '_blank', 'noopener')
    setShareOpen(false)
  }

  const shareToReddit = () => {
    window.open(`https://reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareText)}`, '_blank', 'noopener')
    setShareOpen(false)
  }

  const shareViaEmail = () => {
    window.open(`mailto:?subject=${encodeURIComponent(shareText)}&body=${encodeURIComponent(`Check out this Congressional signal:\n\n${shareUrl}`)}`, '_self')
    setShareOpen(false)
  }

  return (
    <div className="min-h-screen bg-hill-black">
      <header className="sticky top-0 z-50 bg-hill-black/80 backdrop-blur-md border-b border-hill-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href={isAuthenticated ? '/dashboard' : '/'} className="text-xl font-bold text-hill-white">Hill<span className="text-hill-orange">Signal</span></Link>
          <div className="flex items-center gap-2">
            {/* Share dropdown */}
            <div className="relative" ref={shareRef}>
              <button onClick={() => setShareOpen(!shareOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-hill-orange bg-hill-orange/10 border border-hill-orange/30 hover:bg-hill-orange/20 hover:border-hill-orange/50 transition-all">
                <Share2 size={12} /> Share
              </button>
              {shareOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-hill-dark border border-hill-border rounded-lg shadow-xl z-50 overflow-hidden">
                  <button onClick={shareToX} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-hill-text hover:bg-hill-gray transition-colors">
                    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    <span>Share on X</span>
                  </button>
                  <button onClick={shareToReddit} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-hill-text hover:bg-hill-gray transition-colors">
                    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/></svg>
                    <span>Share on Reddit</span>
                  </button>
                  <button onClick={shareViaEmail} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-hill-text hover:bg-hill-gray transition-colors border-t border-hill-border/50">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    <span>Email</span>
                  </button>
                  <button onClick={handleCopyLink} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-hill-text hover:bg-hill-gray transition-colors border-t border-hill-border/50">
                    {copied ? (
                      <><Check size={16} className="text-hill-green flex-shrink-0" /><span className="text-hill-green">Link copied!</span></>
                    ) : (
                      <><Link2 size={16} className="flex-shrink-0" /><span>Copy link</span></>
                    )}
                  </button>
                </div>
              )}
            </div>
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button variant="ghost" size="sm"><ArrowLeft size={14} className="mr-2" /> Back to Feed</Button>
              </Link>
            ) : (
              <Link href="/signup">
                <Button variant="primary" size="sm">Get Full Access</Button>
              </Link>
            )}
          </div>
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
            <span>•</span>
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
                  <Link key={cs.id} href={`/signals/${generateSignalSlug(cs.title ?? '', cs.id)}`}>
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
          {isAuthenticated ? (
            <Link href="/dashboard"><Button variant="ghost"><ArrowLeft size={14} className="mr-2" /> Back to Feed</Button></Link>
          ) : (
            <Link href="/signup"><Button variant="primary">Get Full Access — Daily AI Analysis</Button></Link>
          )}
        </div>
      </main>
    </div>
  )
}
