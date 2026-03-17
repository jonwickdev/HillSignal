'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import LiveIndicator from '@/components/ui/LiveIndicator'
import { createClient } from '@/lib/supabase/client'
import type { Signal } from '@/lib/types'
import { ChevronDown, ChevronUp, ExternalLink, TrendingUp, TrendingDown, Minus, RefreshCw, Settings, Info, Star, X, Search, User } from 'lucide-react'

const sentimentConfig: Record<string, { color: string; bg: string; border: string; label: string; Icon: any }> = {
  bullish: { color: 'text-hill-green', bg: 'bg-hill-green/10', border: 'border-hill-green/30', label: 'Bullish', Icon: TrendingUp },
  bearish: { color: 'text-hill-red', bg: 'bg-hill-red/10', border: 'border-hill-red/30', label: 'Bearish', Icon: TrendingDown },
  neutral: { color: 'text-hill-blue', bg: 'bg-hill-blue/10', border: 'border-hill-blue/30', label: 'Neutral', Icon: Minus },
}

const PAGE_SIZE = 20

const EVENT_TYPE_LABELS: Record<string, string> = {
  bill: 'Bill',
  vote: 'Vote',
  hearing: 'Hearing',
  floor_action: 'Floor Action',
  contract_award: 'Contract Award',
  committee_action: 'Committee Action',
}

function formatEventType(type: string): string {
  return EVENT_TYPE_LABELS[type] ?? type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

interface DashboardClientProps {
  userEmail: string
  preferences: any
}

export default function DashboardClient({ userEmail, preferences }: DashboardClientProps) {
  const router = useRouter()
  const [signals, setSignals] = useState<Signal[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [polling, setPolling] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedSector, setSelectedSector] = useState<string>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [impactTooltip, setImpactTooltip] = useState<string | null>(null)

  // Search
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Pagination
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)

  // User actions (favorites / dismissed)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)

  // Sentiment & type filters
  const [selectedSentiment, setSelectedSentiment] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 400)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Re-fetch when search or filters change
  useEffect(() => {
    if (!loading) {
      fetchSignals(false, true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, selectedSentiment, selectedType])

  // Extra signals fetched by ID (favorites beyond 90-day window)
  const [extraSignals, setExtraSignals] = useState<Signal[]>([])

  // Fetch user actions (favorites + dismissed)
  const fetchUserActions = useCallback(async () => {
    try {
      const res = await fetch('/api/signals/actions')
      if (!res.ok) return
      const data = await res.json()
      setFavorites(new Set(data?.favorites ?? []))
      setDismissed(new Set(data?.dismissed ?? []))
      return { favorites: data?.favorites ?? [], dismissed: data?.dismissed ?? [] }
    } catch {
      // Non-critical — user just won't see stars/dismissals
      return null
    }
  }, [])

  const fetchSignals = useCallback(async (refresh?: boolean, resetList?: boolean) => {
    try {
      if (refresh) {
        setRefreshing(true)
        setPolling(true)
      } else if (resetList) {
        setLoading(true)
      }
      setError(null)

      if (refresh) {
        // Fire BOTH bill poll and contract poll in parallel — each gets its own 60s budget
        const billParams = new URLSearchParams()
        billParams.set('refresh', 'true')
        billParams.set('force', 'true')
        if (debouncedSearch) billParams.set('search', debouncedSearch)
        if (selectedSentiment !== 'all') billParams.set('sentiment', selectedSentiment)
        if (selectedType !== 'all') billParams.set('event_type', selectedType)
        billParams.set('limit', String(PAGE_SIZE))

        const [billRes, contractRes] = await Promise.allSettled([
          fetch(`/api/signals?${billParams.toString()}`),
          fetch('/api/cron/poll-contracts'),
        ])

        // Parse contract poll result once (non-blocking — don't fail if contracts error)
        let contractStored = 0
        if (contractRes.status === 'fulfilled') {
          const cData = await contractRes.value?.json?.().catch(() => null)
          contractStored = cData?.items_stored ?? 0
          console.log('[poll-now] Contract poll:', cData?.status, contractStored ? `${contractStored} new` : '')
        } else {
          console.warn('[poll-now] Contract poll failed:', (contractRes as PromiseRejectedResult).reason)
        }

        // Use bill poll result for the signal list
        if (billRes.status === 'fulfilled') {
          const data = await billRes.value?.json?.()
          if (!billRes.value?.ok) throw new Error(data?.error ?? 'Failed to fetch signals')
          setSignals(data?.signals ?? [])
          setHasMore(data?.hasMore ?? false)

          // If contract poll stored new signals, re-fetch to include them in the list
          if (contractStored > 0) {
            const refreshParams = new URLSearchParams()
            if (debouncedSearch) refreshParams.set('search', debouncedSearch)
            if (selectedSentiment !== 'all') refreshParams.set('sentiment', selectedSentiment)
            if (selectedType !== 'all') refreshParams.set('event_type', selectedType)
            refreshParams.set('limit', String(PAGE_SIZE))
            const finalRes = await fetch(`/api/signals?${refreshParams.toString()}`)
            const finalData = await finalRes?.json?.()
            if (finalRes?.ok) {
              setSignals(finalData?.signals ?? [])
              setHasMore(finalData?.hasMore ?? false)
            }
          }
        } else {
          throw new Error('Failed to poll Congress.gov')
        }
      } else {
        // Normal fetch (no polling)
        const params = new URLSearchParams()
        if (debouncedSearch) params.set('search', debouncedSearch)
        if (selectedSentiment !== 'all') params.set('sentiment', selectedSentiment)
        if (selectedType !== 'all') params.set('event_type', selectedType)
        params.set('limit', String(PAGE_SIZE))

        const res = await fetch(`/api/signals?${params.toString()}`)
        const data = await res?.json?.()

        if (!res?.ok) throw new Error(data?.error ?? 'Failed to fetch signals')
        setSignals(data?.signals ?? [])
        setHasMore(data?.hasMore ?? false)
      }
    } catch (err: any) {
      console.error('Failed to fetch signals:', err)
      setError(err?.message ?? 'Failed to load signals')
    } finally {
      setLoading(false)
      setRefreshing(false)
      setPolling(false)
    }
  }, [debouncedSearch, selectedSentiment, selectedType])

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    try {
      const params = new URLSearchParams()
      params.set('offset', String(signals.length))
      params.set('limit', String(PAGE_SIZE))
      if (debouncedSearch) params.set('search', debouncedSearch)
      if (selectedSector !== 'all') params.set('sector', selectedSector)
      if (selectedSentiment !== 'all') params.set('sentiment', selectedSentiment)
      if (selectedType !== 'all') params.set('event_type', selectedType)

      const res = await fetch(`/api/signals?${params.toString()}`)
      const data = await res?.json?.()
      if (!res?.ok) throw new Error(data?.error ?? 'Failed to load more')

      setSignals(prev => [...prev, ...(data?.signals ?? [])])
      setHasMore(data?.hasMore ?? false)
    } catch (err: any) {
      console.error('Failed to load more:', err)
    } finally {
      setLoadingMore(false)
    }
  }, [loadingMore, hasMore, signals.length, debouncedSearch, selectedSector, selectedSentiment, selectedType])

  // Toggle favorite/dismiss
  const toggleAction = useCallback(async (signalId: string, action: 'favorite' | 'dismissed') => {
    setActionLoading(`${signalId}-${action}`)
    try {
      const res = await fetch('/api/signals/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signal_id: signalId, action }),
      })
      if (!res.ok) return

      const data = await res.json()
      if (action === 'favorite') {
        setFavorites(prev => {
          const next = new Set(prev)
          if (data?.status === 'added') next.add(signalId)
          else next.delete(signalId)
          return next
        })
      } else {
        setDismissed(prev => {
          const next = new Set(prev)
          if (data?.status === 'added') next.add(signalId)
          else next.delete(signalId)
          return next
        })
      }
    } catch {
      // silent
    } finally {
      setActionLoading(null)
    }
  }, [])

  // Fetch favorited signals that may be outside the 90-day window
  const fetchMissingFavorites = useCallback(async (favoriteIds: string[], loadedSignalIds: Set<string>) => {
    const missingIds = favoriteIds.filter(id => !loadedSignalIds.has(id))
    if (missingIds.length === 0) { setExtraSignals([]); return }
    try {
      const res = await fetch(`/api/signals?ids=${missingIds.join(',')}`)
      const data = await res?.json?.()
      setExtraSignals(data?.signals ?? [])
    } catch {
      // Non-critical
    }
  }, [])

  // On first load
  useEffect(() => {
    let cancelled = false
    async function init() {
      setLoading(true)
      // Fetch user actions in parallel with signals
      const actionsPromise = fetchUserActions()
      try {
        const res = await fetch(`/api/signals?limit=${PAGE_SIZE}`)
        const data = await res?.json?.()
        if (cancelled) return
        const fetched = data?.signals ?? []
        setSignals(fetched)
        setHasMore(data?.hasMore ?? false)
        setLoading(false)

        // Fetch any favorited signals that aren't in the main feed
        const actions = await actionsPromise
        if (!cancelled && actions?.favorites?.length) {
          const loadedIds = new Set<string>(fetched.map((s: Signal) => s.id))
          fetchMissingFavorites(actions.favorites, loadedIds)
        }

        // If no signals exist yet, auto-poll Congress.gov
        if (fetched.length === 0) {
          setPolling(true)
          setRefreshing(true)
          try {
            const pollRes = await fetch(`/api/signals?refresh=true&force=true&limit=${PAGE_SIZE}`)
            const pollData = await pollRes?.json?.()
            if (!cancelled) {
              setSignals(pollData?.signals ?? [])
              setHasMore(pollData?.hasMore ?? false)
            }
          } catch (err: any) {
            if (!cancelled) setError(err?.message ?? 'Failed to poll')
          } finally {
            if (!cancelled) { setPolling(false); setRefreshing(false) }
          }
        }
      } catch (err: any) {
        if (!cancelled) { setError(err?.message ?? 'Failed to load'); setLoading(false) }
      }
    }
    init()
    return () => { cancelled = true }
  }, [fetchUserActions, fetchMissingFavorites])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  // Merge main feed + extra favorited signals (older than 90 days)
  const allSignals = (() => {
    const mainIds = new Set((signals ?? []).map((s: Signal) => s.id))
    const extras = (extraSignals ?? []).filter((s: Signal) => !mainIds.has(s.id))
    return [...(signals ?? []), ...extras]
  })()

  // Filter: hide dismissed, optionally show favorites only, apply sector filter
  const visibleSignals = allSignals.filter((s: Signal) => {
    if (dismissed.has(s.id)) return false
    if (showFavoritesOnly && !favorites.has(s.id)) return false
    if (selectedSector !== 'all') {
      return (s?.affected_sectors ?? []).some((sector: string) =>
        sector?.toLowerCase?.()?.includes?.(selectedSector?.toLowerCase?.())
      )
    }
    return true
  })

  const allSectors = Array.from(
    new Set((signals ?? [])?.flatMap?.((s: Signal) => s?.affected_sectors ?? [])?.filter?.(Boolean))
  )?.sort?.()
  const sectors = ['all', ...(allSectors ?? [])]

  // All known event types — always show these pills regardless of loaded signals
  const eventTypes = ['bill', 'vote', 'hearing', 'contract_award']

  return (
    <div className="min-h-screen bg-hill-black">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-hill-black/80 backdrop-blur-md border-b border-hill-border">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="text-xl font-bold text-hill-white">
            Hill<span className="text-hill-orange">Signal</span>
          </Link>
          <div className="flex items-center gap-4">
            <LiveIndicator />
            <span className="text-hill-muted text-sm hidden sm:inline">{userEmail}</span>
            <Link href="/profile">
              <button className="text-hill-muted hover:text-hill-white transition-colors p-2" aria-label="Profile">
                <User size={18} />
              </button>
            </Link>
            <Link href="/settings">
              <button className="text-hill-muted hover:text-hill-white transition-colors p-2" aria-label="Settings">
                <Settings size={18} />
              </button>
            </Link>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>Sign Out</Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-hill-white mb-2">Congressional Signal Feed</h1>
            <p className="text-hill-muted">Real-time intelligence from Congress.gov, analyzed by AI.</p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => fetchSignals(true, true)} loading={refreshing} disabled={refreshing}>
            <RefreshCw size={14} className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Polling...' : 'Poll Now'}
          </Button>
        </div>

        {/* Search bar */}
        <div className="relative mb-6">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-hill-muted" />
          <input
            type="text"
            placeholder="Search signals by title, ticker, sector, keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-hill-dark border border-hill-border rounded-lg pl-11 pr-4 py-3 text-sm text-hill-white placeholder:text-hill-muted focus:outline-none focus:border-hill-orange/50 transition-colors"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-hill-muted hover:text-hill-white">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="mb-6 space-y-3">
          {/* Row 1: Sentiment + Type + Favorites */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Sentiment pills */}
            {(['all', 'bullish', 'bearish', 'neutral'] as const).map((s) => {
              const conf = s !== 'all' ? sentimentConfig[s] : null
              const isActive = selectedSentiment === s
              return (
                <button key={s} onClick={() => setSelectedSentiment(s)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 ${
                    isActive
                      ? s === 'all' ? 'bg-hill-orange text-white' : `${conf?.bg ?? ''} ${conf?.color ?? ''} border ${conf?.border ?? ''}`
                      : 'bg-hill-gray text-hill-muted hover:text-hill-white border border-hill-border'
                  }`}>
                  {conf && <conf.Icon size={13} />}
                  {s === 'all' ? 'All Sentiment' : conf?.label ?? s}
                </button>
              )
            })}

            <span className="w-px h-6 bg-hill-border hidden sm:block" />

            {/* Type pills */}
            {(['all', ...eventTypes] as const).map((t) => (
              <button key={t} onClick={() => setSelectedType(t)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                  selectedType === t
                    ? 'bg-hill-orange text-white'
                    : 'bg-hill-gray text-hill-muted hover:text-hill-white border border-hill-border'
                }`}>
                {t === 'all' ? 'All Types' : formatEventType(t)}
              </button>
            ))}

            <span className="w-px h-6 bg-hill-border hidden sm:block" />

            {/* Favorites toggle */}
            <button
              onClick={() => setShowFavoritesOnly(prev => !prev)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                showFavoritesOnly
                  ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40'
                  : 'bg-hill-gray text-hill-muted hover:text-hill-white border border-hill-border'
              }`}>
              <Star size={14} className={showFavoritesOnly ? 'fill-yellow-400' : ''} />
              {showFavoritesOnly ? 'Showing Favorites' : 'Favorites'}
            </button>
          </div>

          {/* Row 2: Sector pills */}
          {(allSectors?.length ?? 0) > 0 && (
            <div className="overflow-x-auto">
              <div className="flex gap-2 pb-1">
                {(sectors ?? [])?.map?.((sector: string) => (
                  <button key={sector} onClick={() => setSelectedSector(sector)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                      selectedSector === sector
                        ? 'bg-hill-orange text-white'
                        : 'bg-hill-gray text-hill-muted hover:text-hill-white border border-hill-border'
                    }`}>
                    {sector === 'all' ? 'All Sectors' : sector}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Active filter summary */}
          {(selectedSentiment !== 'all' || selectedType !== 'all' || selectedSector !== 'all' || showFavoritesOnly || debouncedSearch) && (
            <div className="flex items-center gap-2 text-xs text-hill-muted">
              <span>Active filters:</span>
              {selectedSentiment !== 'all' && (
                <span className="bg-hill-gray px-2 py-0.5 rounded flex items-center gap-1">
                  {sentimentConfig[selectedSentiment]?.label ?? selectedSentiment}
                  <button onClick={() => setSelectedSentiment('all')} className="text-hill-muted hover:text-hill-white"><X size={10} /></button>
                </span>
              )}
              {selectedType !== 'all' && (
                <span className="bg-hill-gray px-2 py-0.5 rounded flex items-center gap-1">
                  {formatEventType(selectedType)}
                  <button onClick={() => setSelectedType('all')} className="text-hill-muted hover:text-hill-white"><X size={10} /></button>
                </span>
              )}
              {selectedSector !== 'all' && (
                <span className="bg-hill-gray px-2 py-0.5 rounded flex items-center gap-1">
                  {selectedSector}
                  <button onClick={() => setSelectedSector('all')} className="text-hill-muted hover:text-hill-white"><X size={10} /></button>
                </span>
              )}
              {showFavoritesOnly && (
                <span className="bg-hill-gray px-2 py-0.5 rounded flex items-center gap-1">
                  Favorites only
                  <button onClick={() => setShowFavoritesOnly(false)} className="text-hill-muted hover:text-hill-white"><X size={10} /></button>
                </span>
              )}
              {debouncedSearch && (
                <span className="bg-hill-gray px-2 py-0.5 rounded flex items-center gap-1">
                  &ldquo;{debouncedSearch}&rdquo;
                  <button onClick={() => setSearchQuery('')} className="text-hill-muted hover:text-hill-white"><X size={10} /></button>
                </span>
              )}
              <button
                onClick={() => { setSelectedSentiment('all'); setSelectedType('all'); setSelectedSector('all'); setShowFavoritesOnly(false); setSearchQuery('') }}
                className="text-hill-orange hover:text-hill-orange/80 ml-1">
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Polling banner */}
        {polling && !loading && (
          <div className="mb-6 bg-hill-orange/10 border border-hill-orange/30 rounded-xl p-6 text-center">
            <div className="flex items-center justify-center gap-3 mb-3">
              <RefreshCw size={20} className="text-hill-orange animate-spin" />
              <p className="text-hill-orange font-semibold">Fetching latest signals...</p>
            </div>
            <p className="text-hill-muted text-sm">Polling Congress.gov and USAspending.gov in parallel, then running AI analysis. This can take 30-60 seconds.</p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3]?.map?.((i: number) => (
              <div key={i} className="bg-hill-dark rounded-xl p-6 animate-pulse">
                <div className="h-4 bg-hill-gray rounded w-1/3 mb-4" />
                <div className="h-6 bg-hill-gray rounded w-2/3 mb-4" />
                <div className="h-4 bg-hill-gray rounded w-full mb-2" />
                <div className="h-4 bg-hill-gray rounded w-3/4" />
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <Card className="text-center py-12">
            <p className="text-hill-red mb-4">{error}</p>
            <Button variant="secondary" onClick={() => fetchSignals()}>Try Again</Button>
          </Card>
        )}

        {/* Signal feed */}
        {!loading && !error && (
          <div className="space-y-4">
            {(visibleSignals ?? [])?.map?.((signal: Signal) => {
              const sentiment = sentimentConfig?.[signal?.sentiment ?? 'neutral'] ?? sentimentConfig?.neutral
              const SentimentIcon = sentiment?.Icon ?? Minus
              const isExpanded = expandedId === signal?.id
              const isFavorited = favorites.has(signal.id)

              return (
                <div key={signal?.id} className={`bg-hill-dark rounded-xl border transition-all duration-200 overflow-hidden ${
                  isFavorited ? 'border-yellow-500/40 ring-1 ring-yellow-500/20' : 'border-hill-border hover:border-hill-border/80'
                }`}>
                  {/* Main card */}
                  <div className="p-6">
                    {/* Header row */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-xs text-hill-muted font-mono mb-2">
                          <span className="px-2 py-0.5 bg-hill-gray rounded">{formatEventType(signal?.event_type ?? 'signal')}</span>
                          {signal?.committee && <span>{signal.committee}</span>}
                          <span>&bull;</span>
                          <span>{signal?.event_date ? new Date(signal.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}</span>
                          {signal?.bill_number && (
                            <span className="text-hill-orange">{signal.bill_number}</span>
                          )}
                        </div>
                        <Link href={`/signals/${signal?.id ?? ''}`} className="hover:underline">
                          <h2 className="text-lg font-semibold text-hill-white leading-tight">{signal?.title ?? 'Untitled'}</h2>
                        </Link>
                      </div>
                      {/* Action buttons + sentiment */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleAction(signal.id, 'favorite')}
                          disabled={actionLoading === `${signal.id}-favorite`}
                          className={`p-2 rounded-lg transition-all ${
                            isFavorited
                              ? 'text-yellow-400 bg-yellow-500/10 hover:bg-yellow-500/20'
                              : 'text-hill-muted hover:text-yellow-400 hover:bg-hill-gray'
                          }`}
                          title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                        >
                          <Star size={16} className={isFavorited ? 'fill-yellow-400' : ''} />
                        </button>
                        <button
                          onClick={() => toggleAction(signal.id, 'dismissed')}
                          disabled={actionLoading === `${signal.id}-dismissed`}
                          className="p-2 rounded-lg text-hill-muted hover:text-hill-red hover:bg-hill-red/10 transition-all"
                          title="Dismiss signal"
                        >
                          <X size={16} />
                        </button>
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded border text-sm font-mono ${sentiment?.bg ?? ''} ${sentiment?.border ?? ''} ${sentiment?.color ?? ''}`}>
                          <SentimentIcon size={14} />
                          {sentiment?.label ?? 'Neutral'}
                        </div>
                      </div>
                    </div>

                    {/* Tickers & sectors */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {(signal?.tickers ?? [])?.map?.((ticker: string) => (
                        <span key={ticker} className="bg-hill-gray px-3 py-1 rounded text-sm font-mono text-hill-orange">{ticker}</span>
                      ))}
                      {(signal?.affected_sectors ?? [])?.map?.((sector: string) => (
                        <span key={sector} className="bg-hill-border px-3 py-1 rounded text-sm text-hill-muted">{sector}</span>
                      ))}
                    </div>

                    {/* Summary */}
                    <p className="text-hill-text text-sm leading-relaxed mb-4">{signal?.summary ?? ''}</p>

                    {/* Footer - Impact + expand */}
                    <div className="flex items-center justify-between pt-4 border-t border-hill-border">
                      <div className="flex items-center gap-2 relative">
                        <span className="text-xs text-hill-muted">Market Impact</span>
                        <button onClick={() => setImpactTooltip(impactTooltip === signal?.id ? null : signal?.id ?? null)}
                          className="text-hill-muted hover:text-hill-white"><Info size={12} /></button>
                        {impactTooltip === signal?.id && (
                          <div className="absolute bottom-full left-0 mb-2 bg-hill-gray border border-hill-border rounded-lg p-3 text-xs text-hill-text w-64 z-10 shadow-xl">
                            <p className="font-semibold text-hill-white mb-1">Impact Score: {signal?.impact_score ?? 0}/10</p>
                            <p>1-3: Minimal impact | 4-6: Moderate sector | 7-8: Significant | 9-10: Major market event</p>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex gap-0.5">
                          {[...(Array(10) ?? [])]?.map?.((_: any, i: number) => (
                            <div key={i} className={`w-2 h-5 rounded-sm transition-all ${
                              i < (signal?.impact_score ?? 0)
                                ? (signal?.impact_score ?? 0) >= 7 ? 'bg-hill-orange' : (signal?.impact_score ?? 0) >= 4 ? 'bg-hill-green' : 'bg-hill-blue'
                                : 'bg-hill-gray'
                            }`} />
                          ))}
                        </div>
                        <span className="font-mono text-hill-white font-semibold">{signal?.impact_score ?? 0}/10</span>
                      </div>
                    </div>

                    {/* Expand button */}
                    {(signal?.full_analysis || (signal?.key_takeaways?.length ?? 0) > 0) && (
                      <button onClick={() => setExpandedId(isExpanded ? null : signal?.id ?? null)}
                        className="mt-4 flex items-center gap-2 text-sm text-hill-orange hover:text-hill-orange/80 transition-colors w-full justify-center py-2">
                        {isExpanded ? <><ChevronUp size={16} /> Hide Analysis</> : <><ChevronDown size={16} /> Show Full Analysis</>}
                      </button>
                    )}
                  </div>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="px-6 pb-6 border-t border-hill-border/50 pt-4 space-y-4 bg-hill-black/30">
                      {(signal?.key_takeaways?.length ?? 0) > 0 && (
                        <div>
                          <h3 className="text-sm font-semibold text-hill-white mb-2">Key Takeaways</h3>
                          <ul className="space-y-1">
                            {(signal?.key_takeaways ?? [])?.map?.((takeaway: string, i: number) => (
                              <li key={i} className="text-sm text-hill-text flex items-start gap-2">
                                <span className="text-hill-orange mt-1">&bull;</span>
                                {takeaway}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {signal?.market_implications && (
                        <div>
                          <h3 className="text-sm font-semibold text-hill-white mb-2">Market Implications</h3>
                          <p className="text-sm text-hill-text leading-relaxed">{signal.market_implications}</p>
                        </div>
                      )}
                      {signal?.full_analysis && (
                        <div>
                          <h3 className="text-sm font-semibold text-hill-white mb-2">Full Analysis</h3>
                          <p className="text-sm text-hill-text leading-relaxed whitespace-pre-line">{signal.full_analysis}</p>
                        </div>
                      )}
                      {(signal?.legislators?.length ?? 0) > 0 && (
                        <div>
                          <h3 className="text-sm font-semibold text-hill-white mb-2">Key Legislators</h3>
                          <div className="flex flex-wrap gap-2">
                            {(signal?.legislators ?? [])?.map?.((leg: string, i: number) => (
                              <span key={i} className="bg-hill-gray px-3 py-1 rounded text-xs text-hill-text">{leg}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-4 pt-2">
                        <Link href={`/signals/${signal?.id ?? ''}`} className="text-sm text-hill-orange hover:underline flex items-center gap-1">
                          Full Detail Page <ExternalLink size={12} />
                        </Link>
                        {signal?.source_url && (
                          <a href={signal.source_url} target="_blank" rel="noopener noreferrer" className="text-sm text-hill-muted hover:text-hill-white flex items-center gap-1">
                            {signal?.event_type === 'contract_award' ? 'USAspending.gov' : 'Congress.gov'} <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Load More button */}
        {!loading && !error && hasMore && (
          <div className="mt-6 text-center">
            <Button variant="secondary" onClick={loadMore} loading={loadingMore} disabled={loadingMore}>
              {loadingMore ? 'Loading...' : 'Load More Signals'}
            </Button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && (visibleSignals?.length ?? 0) === 0 && (
          <Card className="text-center py-12">
            <p className="text-hill-muted mb-2">
              {showFavoritesOnly ? 'No favorited signals yet. Star signals you want to track.' :
               (signals?.length ?? 0) === 0 && selectedSentiment === 'all' && selectedType === 'all' && !debouncedSearch ? 'No signals yet. Trigger a refresh to poll Congress.gov.' :
               debouncedSearch ? `No signals matching "${debouncedSearch}".` :
               selectedSentiment !== 'all' || selectedType !== 'all' ? `No signals match the current filters.` :
               'No signals found for this sector.'}
            </p>
            <div className="flex justify-center gap-4 mt-4">
              {(signals?.length ?? 0) === 0 && selectedSentiment === 'all' && selectedType === 'all' && !debouncedSearch && (
                <Button onClick={() => fetchSignals(true, true)} loading={refreshing}>Poll Now</Button>
              )}
              {(selectedSentiment !== 'all' || selectedType !== 'all' || selectedSector !== 'all' || showFavoritesOnly || debouncedSearch) && (
                <Button variant="ghost" onClick={() => { setSelectedSentiment('all'); setSelectedType('all'); setSelectedSector('all'); setShowFavoritesOnly(false); setSearchQuery('') }}>Clear All Filters</Button>
              )}
            </div>
          </Card>
        )}

        {/* Stats — clickable to filter */}
        {!loading && (signals?.length ?? 0) > 0 && (
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            <button onClick={() => { setSelectedSentiment('all'); setShowFavoritesOnly(false) }}
              className={`bg-hill-dark rounded-lg p-4 border text-left transition-all ${selectedSentiment === 'all' && !showFavoritesOnly ? 'border-hill-orange ring-1 ring-hill-orange/30' : 'border-hill-border hover:border-hill-border/80'}`}>
              <p className="text-hill-muted text-xs mb-1">Total Signals</p>
              <p className="text-2xl font-bold text-hill-white font-mono">{signals?.length ?? 0}</p>
            </button>
            <button onClick={() => { setSelectedSentiment('bullish'); setShowFavoritesOnly(false) }}
              className={`bg-hill-dark rounded-lg p-4 border text-left transition-all ${selectedSentiment === 'bullish' ? 'border-hill-green ring-1 ring-hill-green/30' : 'border-hill-border hover:border-hill-border/80'}`}>
              <p className="text-hill-muted text-xs mb-1">Bullish</p>
              <p className="text-2xl font-bold text-hill-green font-mono">{(signals ?? [])?.filter?.((s: Signal) => s?.sentiment === 'bullish')?.length ?? 0}</p>
            </button>
            <button onClick={() => { setSelectedSentiment('bearish'); setShowFavoritesOnly(false) }}
              className={`bg-hill-dark rounded-lg p-4 border text-left transition-all ${selectedSentiment === 'bearish' ? 'border-hill-red ring-1 ring-hill-red/30' : 'border-hill-border hover:border-hill-border/80'}`}>
              <p className="text-hill-muted text-xs mb-1">Bearish</p>
              <p className="text-2xl font-bold text-hill-red font-mono">{(signals ?? [])?.filter?.((s: Signal) => s?.sentiment === 'bearish')?.length ?? 0}</p>
            </button>
            <button onClick={() => { setShowFavoritesOnly(true); setSelectedSentiment('all') }}
              className={`bg-hill-dark rounded-lg p-4 border text-left transition-all ${showFavoritesOnly ? 'border-yellow-500 ring-1 ring-yellow-500/30' : 'border-hill-border hover:border-hill-border/80'}`}>
              <p className="text-hill-muted text-xs mb-1">Favorites</p>
              <p className="text-2xl font-bold text-yellow-400 font-mono">{favorites.size}</p>
            </button>
          </div>
        )}
      </main>
    </div>
  )
}