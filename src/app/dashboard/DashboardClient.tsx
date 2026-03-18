'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import LiveIndicator from '@/components/ui/LiveIndicator'
import { createClient } from '@/lib/supabase/client'
import type { Signal } from '@/lib/types'
import { ChevronDown, ChevronUp, ExternalLink, TrendingUp, TrendingDown, Minus, RefreshCw, Settings, Info, Star, X, Search, User, List, BarChart3, Calendar, SlidersHorizontal, DollarSign, Zap, FileText, Landmark } from 'lucide-react'

const sentimentConfig: Record<string, { color: string; bg: string; border: string; label: string; Icon: any }> = {
  bullish: { color: 'text-hill-green', bg: 'bg-hill-green/10', border: 'border-hill-green/30', label: 'Bullish', Icon: TrendingUp },
  bearish: { color: 'text-hill-red', bg: 'bg-hill-red/10', border: 'border-hill-red/30', label: 'Bearish', Icon: TrendingDown },
  neutral: { color: 'text-hill-blue', bg: 'bg-hill-blue/10', border: 'border-hill-blue/30', label: 'Neutral', Icon: Minus },
}

const ANALYZED_PAGE_SIZE = 20
const TRACKER_PAGE_SIZE = 50

const ALL_SECTORS = [
  'Healthcare', 'Technology', 'Energy', 'Finance', 'Defense',
  'Agriculture', 'Manufacturing', 'Infrastructure',
  'Telecommunications', 'Transportation', 'Real Estate', 'Consumer'
]

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

/**
 * Fix malformed dollar amounts in titles (e.g., "$10410.5M" → "$10.4B").
 * Catches bad formatting from earlier AI runs without needing a DB migration.
 */
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

interface DashboardStats {
  totalSignals: number
  analyzedSignals: number
  thisWeekSignals: number
}

interface DashboardClientProps {
  userEmail: string
  preferences: any
  stats: DashboardStats
}

export default function DashboardClient({ userEmail, preferences, stats }: DashboardClientProps) {
  const router = useRouter()
  const [signals, setSignals] = useState<Signal[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [polling, setPolling] = useState(false)
  const [pollResult, setPollResult] = useState<{ time: string; newSignals: number; message: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedSector, setSelectedSector] = useState<string>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [impactTooltip, setImpactTooltip] = useState<string | null>(null)

  // View mode: analyzed signals (cards) vs legislative tracker (compact rows)
  const [viewMode, setViewMode] = useState<'analyzed' | 'tracker'>('analyzed')
  const [totalCount, setTotalCount] = useState(0)

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

  // Date range filter (event_date, not created_at)
  const [dateRange, setDateRange] = useState<string>('7d') // preset key or 'custom'
  const [customDateFrom, setCustomDateFrom] = useState<string>('')
  const [customDateTo, setCustomDateTo] = useState<string>('')

  const DATE_PRESETS: { key: string; label: string; days: number | null }[] = [
    { key: '7d', label: 'This Week', days: 7 },
    { key: '30d', label: '30 Days', days: 30 },
    { key: '90d', label: '90 Days', days: 90 },
    { key: 'all', label: 'All Time', days: null },
    { key: 'custom', label: 'Custom', days: null },
  ]

  // Filters panel toggle
  const [showFilters, setShowFilters] = useState(false)

  // Compute actual dateFrom/dateTo/dateCol for API calls
  // Presets use created_at (when signal was added) so backfilled contracts appear.
  // Custom ranges use event_date for precise research.
  const getDateParams = useCallback(() => {
    if (dateRange === 'custom') {
      return { dateFrom: customDateFrom || undefined, dateTo: customDateTo || undefined, dateCol: 'event_date' as const }
    }
    if (dateRange === 'all') {
      return { dateFrom: '1900-01-01', dateTo: undefined, dateCol: 'created_at' as const }
    }
    const preset = DATE_PRESETS.find(p => p.key === dateRange)
    if (preset?.days) {
      const from = new Date(Date.now() - preset.days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      return { dateFrom: from, dateTo: undefined, dateCol: 'created_at' as const }
    }
    return { dateFrom: undefined, dateTo: undefined, dateCol: 'created_at' as const }
  }, [dateRange, customDateFrom, customDateTo])

  const pageSize = viewMode === 'tracker' ? TRACKER_PAGE_SIZE : ANALYZED_PAGE_SIZE

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 400)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Auto-dismiss poll result after 10 seconds
  useEffect(() => {
    if (!pollResult) return
    const t = setTimeout(() => setPollResult(null), 10000)
    return () => clearTimeout(t)
  }, [pollResult])

  // Re-fetch when search, filters, sector, view mode, or date range change
  useEffect(() => {
    if (!loading) {
      fetchSignals(false, true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, selectedSentiment, selectedType, selectedSector, viewMode, dateRange, customDateFrom, customDateTo])

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

      const currentPageSize = viewMode === 'tracker' ? TRACKER_PAGE_SIZE : ANALYZED_PAGE_SIZE

      // Helper: append dateFrom/dateTo/dateCol to any URLSearchParams
      const applyDate = (p: URLSearchParams) => {
        const { dateFrom, dateTo, dateCol } = getDateParams()
        if (dateFrom) p.set('dateFrom', dateFrom)
        if (dateTo) p.set('dateTo', dateTo)
        if (dateCol) p.set('dateCol', dateCol)
      }

      if (refresh) {
        // Fire BOTH bill poll and contract poll in parallel
        const billParams = new URLSearchParams()
        billParams.set('refresh', 'true')
        billParams.set('force', 'true')
        billParams.set('view', viewMode)
        if (selectedSector !== 'all') billParams.set('sector', selectedSector)
        if (debouncedSearch) billParams.set('search', debouncedSearch)
        if (selectedSentiment !== 'all') billParams.set('sentiment', selectedSentiment)
        if (selectedType !== 'all') billParams.set('event_type', selectedType)
        billParams.set('limit', String(currentPageSize))
        applyDate(billParams)

        const contractUrl = selectedSector !== 'all'
          ? `/api/cron/poll-contracts?sector=${encodeURIComponent(selectedSector)}`
          : '/api/cron/poll-contracts'

        const [billRes, contractRes] = await Promise.allSettled([
          fetch(`/api/signals?${billParams.toString()}`),
          fetch(contractUrl),
        ])

        let contractStored = 0
        if (contractRes.status === 'fulfilled') {
          const cData = await contractRes.value?.json?.().catch(() => null)
          contractStored = cData?.items_stored ?? 0
        }

        let billStored = 0
        if (billRes.status === 'fulfilled') {
          const data = await billRes.value?.json?.()
          if (!billRes.value?.ok) throw new Error(data?.error ?? 'Failed to fetch signals')
          const prevCount = signals.length
          setSignals(data?.signals ?? [])
          setHasMore(data?.hasMore ?? false)
          setTotalCount(data?.totalCount ?? 0)
          billStored = Math.max(0, (data?.signals?.length ?? 0) - prevCount)

          if (contractStored > 0) {
            const refreshParams = new URLSearchParams()
            refreshParams.set('view', viewMode)
            if (selectedSector !== 'all') refreshParams.set('sector', selectedSector)
            if (debouncedSearch) refreshParams.set('search', debouncedSearch)
            if (selectedSentiment !== 'all') refreshParams.set('sentiment', selectedSentiment)
            if (selectedType !== 'all') refreshParams.set('event_type', selectedType)
            refreshParams.set('limit', String(currentPageSize))
            applyDate(refreshParams)
            const finalRes = await fetch(`/api/signals?${refreshParams.toString()}`)
            const finalData = await finalRes?.json?.()
            if (finalRes?.ok) {
              setSignals(finalData?.signals ?? [])
              setHasMore(finalData?.hasMore ?? false)
              setTotalCount(finalData?.totalCount ?? 0)
            }
          }
        } else {
          throw new Error('Failed to poll Congress.gov')
        }

        const totalNew = contractStored + billStored
        const now = new Date()
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        setPollResult({
          time: timeStr,
          newSignals: totalNew,
          message: totalNew > 0
            ? `${totalNew} new signal${totalNew > 1 ? 's' : ''} found`
            : 'No new Congressional activity since last poll',
        })
      } else {
        // Normal fetch (no polling)
        const params = new URLSearchParams()
        params.set('view', viewMode)
        if (selectedSector !== 'all') params.set('sector', selectedSector)
        if (debouncedSearch) params.set('search', debouncedSearch)
        if (selectedSentiment !== 'all') params.set('sentiment', selectedSentiment)
        if (selectedType !== 'all') params.set('event_type', selectedType)
        params.set('limit', String(currentPageSize))
        applyDate(params)

        const res = await fetch(`/api/signals?${params.toString()}`)
        const data = await res?.json?.()

        if (!res?.ok) throw new Error(data?.error ?? 'Failed to fetch signals')
        setSignals(data?.signals ?? [])
        setHasMore(data?.hasMore ?? false)
        setTotalCount(data?.totalCount ?? 0)
      }
    } catch (err: any) {
      console.error('Failed to fetch signals:', err)
      setError(err?.message ?? 'Failed to load signals')
    } finally {
      setLoading(false)
      setRefreshing(false)
      setPolling(false)
    }
  }, [debouncedSearch, selectedSentiment, selectedType, selectedSector, viewMode, signals.length, getDateParams])

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    try {
      const currentPageSize = viewMode === 'tracker' ? TRACKER_PAGE_SIZE : ANALYZED_PAGE_SIZE
      const params = new URLSearchParams()
      params.set('offset', String(signals.length))
      params.set('limit', String(currentPageSize))
      params.set('view', viewMode)
      if (selectedSector !== 'all') params.set('sector', selectedSector)
      if (debouncedSearch) params.set('search', debouncedSearch)
      if (selectedSentiment !== 'all') params.set('sentiment', selectedSentiment)
      if (selectedType !== 'all') params.set('event_type', selectedType)
      const { dateFrom, dateTo, dateCol } = getDateParams()
      if (dateFrom) params.set('dateFrom', dateFrom)
      if (dateTo) params.set('dateTo', dateTo)
      if (dateCol) params.set('dateCol', dateCol)

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
  }, [loadingMore, hasMore, signals.length, debouncedSearch, selectedSector, selectedSentiment, selectedType, viewMode, getDateParams])

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
      const actionsPromise = fetchUserActions()
      try {
        const params = new URLSearchParams()
        params.set('view', viewMode)
        params.set('limit', String(viewMode === 'tracker' ? TRACKER_PAGE_SIZE : ANALYZED_PAGE_SIZE))
        // Apply default date range (7d on created_at) so initial load matches filter state
        const initDate = getDateParams()
        if (initDate.dateFrom) params.set('dateFrom', initDate.dateFrom)
        if (initDate.dateTo) params.set('dateTo', initDate.dateTo)
        if (initDate.dateCol) params.set('dateCol', initDate.dateCol)
        const res = await fetch(`/api/signals?${params.toString()}`)
        const data = await res?.json?.()
        if (cancelled) return
        const fetched = data?.signals ?? []
        setSignals(fetched)
        setHasMore(data?.hasMore ?? false)
        setTotalCount(data?.totalCount ?? 0)
        setLoading(false)

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
            const pollParams = new URLSearchParams()
            pollParams.set('refresh', 'true')
            pollParams.set('force', 'true')
            pollParams.set('view', viewMode)
            pollParams.set('limit', String(viewMode === 'tracker' ? TRACKER_PAGE_SIZE : ANALYZED_PAGE_SIZE))
            const pollRes = await fetch(`/api/signals?${pollParams.toString()}`)
            const pollData = await pollRes?.json?.()
            if (!cancelled) {
              setSignals(pollData?.signals ?? [])
              setHasMore(pollData?.hasMore ?? false)
              setTotalCount(pollData?.totalCount ?? 0)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchUserActions, fetchMissingFavorites, getDateParams])

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

  // Filter: hide dismissed, optionally show favorites only
  // Sector filtering is now handled server-side
  const visibleSignals = allSignals.filter((s: Signal) => {
    if (dismissed.has(s.id)) return false
    if (showFavoritesOnly && !favorites.has(s.id)) return false
    return true
  })

  const sectors = ['all', ...ALL_SECTORS]

  // All known event types
  const eventTypes = ['bill', 'contract_award']

  // Helper: is a signal fully analyzed or just tracked?
  const isAnalyzed = (s: Signal) => !!(s.full_analysis && s.full_analysis.length > 0)

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

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Header row — clean and minimal */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5 gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-hill-white">Signal Feed</h1>
          </div>
          <div className="flex items-center gap-2">
            {/* Date range — inline, always visible */}
            <div className="flex bg-hill-dark rounded-lg border border-hill-border p-0.5">
              {DATE_PRESETS.filter(p => p.key !== 'custom').map((p) => (
                <button key={p.key} onClick={() => setDateRange(p.key)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                    dateRange === p.key
                      ? 'bg-hill-orange text-white'
                      : 'text-hill-muted hover:text-hill-white'
                  }`}>
                  {p.label}
                </button>
              ))}
            </div>
            <Button variant="secondary" size="sm" onClick={() => fetchSignals(true, true)} loading={refreshing} disabled={refreshing}>
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            </Button>
          </div>
        </div>

        {/* Poll result feedback */}
        {pollResult && (
          <div className={`mb-4 flex items-center justify-between rounded-lg border px-4 py-3 text-sm ${
            pollResult.newSignals > 0
              ? 'border-hill-green/30 bg-hill-green/10 text-hill-green'
              : 'border-hill-border bg-hill-dark text-hill-muted'
          }`}>
            <span>
              {pollResult.message} <span className="opacity-60">— {pollResult.time}</span>
            </span>
            <button onClick={() => setPollResult(null)} className="ml-3 opacity-60 hover:opacity-100 transition-opacity">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Stats strip — compact, always visible */}
        {!loading && (
          <div className="grid grid-cols-4 gap-3 mb-5">
            <button onClick={() => { setViewMode('analyzed'); setSelectedSentiment('all'); setShowFavoritesOnly(false) }}
              className="bg-hill-dark rounded-lg p-3 border border-hill-border hover:border-hill-orange/40 transition-all text-left">
              <p className="text-hill-muted text-[10px] uppercase tracking-wider mb-0.5">This Week</p>
              <p className="text-xl font-bold text-hill-white font-mono">{stats.thisWeekSignals.toLocaleString()}</p>
            </button>
            <button onClick={() => { setViewMode('analyzed'); setSelectedSentiment('bullish'); setShowFavoritesOnly(false) }}
              className="bg-hill-dark rounded-lg p-3 border border-hill-border hover:border-hill-green/40 transition-all text-left">
              <p className="text-hill-muted text-[10px] uppercase tracking-wider mb-0.5">Bullish</p>
              <p className="text-xl font-bold text-hill-green font-mono">{visibleSignals.filter(s => s.sentiment === 'bullish').length}</p>
            </button>
            <button onClick={() => { setViewMode('analyzed'); setSelectedSentiment('bearish'); setShowFavoritesOnly(false) }}
              className="bg-hill-dark rounded-lg p-3 border border-hill-border hover:border-hill-red/40 transition-all text-left">
              <p className="text-hill-muted text-[10px] uppercase tracking-wider mb-0.5">Bearish</p>
              <p className="text-xl font-bold text-hill-red font-mono">{visibleSignals.filter(s => s.sentiment === 'bearish').length}</p>
            </button>
            <button onClick={() => { setSelectedType(selectedType === 'contract_award' ? 'all' : 'contract_award') }}
              className={`bg-hill-dark rounded-lg p-3 border transition-all text-left ${selectedType === 'contract_award' ? 'border-hill-blue ring-1 ring-hill-blue/30' : 'border-hill-border hover:border-hill-blue/40'}`}>
              <p className="text-hill-muted text-[10px] uppercase tracking-wider mb-0.5">Contracts</p>
              <p className="text-xl font-bold text-hill-blue font-mono">{visibleSignals.filter(s => s.event_type === 'contract_award').length}</p>
            </button>
          </div>
        )}

        {/* Top Signals This Week — hero strip, only in analyzed view */}
        {!loading && !error && viewMode === 'analyzed' && dateRange === '7d' && (() => {
          const topSignals = [...visibleSignals]
            .filter(s => (s.impact_score ?? 0) >= 6)
            .sort((a, b) => (b.impact_score ?? 0) - (a.impact_score ?? 0))
            .slice(0, 3)
          if (topSignals.length === 0) return null
          return (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Zap size={14} className="text-hill-orange" />
                <span className="text-xs font-semibold text-hill-orange uppercase tracking-wider">Top Signals This Week</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {topSignals.map((signal: Signal) => {
                  const sent = sentimentConfig?.[signal?.sentiment ?? 'neutral'] ?? sentimentConfig?.neutral
                  const isContract = signal.event_type === 'contract_award'
                  const rawAmount = isContract && signal.raw_data?.total_obligation ? Number(signal.raw_data.total_obligation) : null
                  return (
                    <Link key={signal.id} href={`/signals/${signal.id}`}
                      className={`bg-hill-dark rounded-lg p-4 border transition-all hover:border-hill-orange/50 group ${
                        isContract ? 'border-l-2 border-l-hill-blue border-hill-border' : 'border-hill-border'
                      }`}>
                      <div className="flex items-center gap-2 mb-2">
                        {isContract ? (
                          <span className="px-1.5 py-0.5 bg-hill-blue/15 text-hill-blue text-[10px] font-bold rounded uppercase">Contract</span>
                        ) : (
                          <span className="px-1.5 py-0.5 bg-hill-gray text-hill-muted text-[10px] font-bold rounded uppercase">Bill</span>
                        )}
                        <span className={`text-[10px] font-bold uppercase ${sent?.color ?? ''}`}>{sent?.label ?? 'Neutral'}</span>
                        {rawAmount && rawAmount > 0 && (
                          <span className="ml-auto text-xs font-mono font-bold text-hill-green">{fixTitleDollars(`$${(rawAmount / 1e6).toFixed(1)}M`)}</span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-hill-white leading-snug line-clamp-2 group-hover:text-hill-orange transition-colors">
                        {fixTitleDollars(signal.title ?? '')}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        {(signal.tickers ?? []).slice(0, 3).map((t: string) => (
                          <span key={t} className="text-[11px] font-mono text-hill-orange">{t}</span>
                        ))}
                        <span className="ml-auto text-[11px] font-mono text-hill-muted">{signal.impact_score}/10</span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })()}

        {/* Search + filter toggle row */}
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-hill-muted" />
            <input
              type="text"
              placeholder="Search by ticker, company, sector..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-hill-dark border border-hill-border rounded-lg pl-9 pr-8 py-2.5 text-sm text-hill-white placeholder:text-hill-muted focus:outline-none focus:border-hill-orange/50 transition-colors"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-hill-muted hover:text-hill-white">
                <X size={12} />
              </button>
            )}
          </div>
          {/* View toggle */}
          <div className="flex bg-hill-dark rounded-lg border border-hill-border p-0.5">
            <button onClick={() => setViewMode('analyzed')}
              className={`px-2.5 py-2 rounded-md transition-all ${viewMode === 'analyzed' ? 'bg-hill-orange text-white' : 'text-hill-muted hover:text-hill-white'}`}
              title="Analyzed signals">
              <BarChart3 size={14} />
            </button>
            <button onClick={() => setViewMode('tracker')}
              className={`px-2.5 py-2 rounded-md transition-all ${viewMode === 'tracker' ? 'bg-hill-orange text-white' : 'text-hill-muted hover:text-hill-white'}`}
              title="All tracked bills">
              <List size={14} />
            </button>
          </div>
          {/* Filter toggle */}
          <button onClick={() => setShowFilters(f => !f)}
            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all border ${
              showFilters || selectedSentiment !== 'all' || selectedType !== 'all' || selectedSector !== 'all' || showFavoritesOnly
                ? 'bg-hill-orange/10 text-hill-orange border-hill-orange/30'
                : 'bg-hill-dark text-hill-muted border-hill-border hover:text-hill-white'
            }`}>
            <SlidersHorizontal size={14} />
            <span className="hidden sm:inline">Filters</span>
          </button>
        </div>

        {/* Collapsible filter panel */}
        {showFilters && (
          <div className="mb-5 bg-hill-dark/50 rounded-lg border border-hill-border p-4 space-y-3">
            {/* Sentiment + Type */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] text-hill-muted uppercase tracking-wider w-16 shrink-0">Sentiment</span>
              {(['all', 'bullish', 'bearish', 'neutral'] as const).map((s) => {
                const conf = s !== 'all' ? sentimentConfig[s] : null
                const isActive = selectedSentiment === s
                return (
                  <button key={s} onClick={() => setSelectedSentiment(s)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1 ${
                      isActive
                        ? s === 'all' ? 'bg-hill-orange text-white' : `${conf?.bg ?? ''} ${conf?.color ?? ''} border ${conf?.border ?? ''}`
                        : 'bg-hill-gray/50 text-hill-muted hover:text-hill-white'
                    }`}>
                    {conf && <conf.Icon size={11} />}
                    {s === 'all' ? 'All' : conf?.label ?? s}
                  </button>
                )
              })}
              <span className="w-px h-5 bg-hill-border" />
              <span className="text-[10px] text-hill-muted uppercase tracking-wider">Type</span>
              {(['all', ...eventTypes] as const).map((t) => (
                <button key={t} onClick={() => setSelectedType(t)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                    selectedType === t ? 'bg-hill-orange text-white' : 'bg-hill-gray/50 text-hill-muted hover:text-hill-white'
                  }`}>
                  {t === 'all' ? 'All' : formatEventType(t)}
                </button>
              ))}
              <span className="w-px h-5 bg-hill-border" />
              <button onClick={() => setShowFavoritesOnly(prev => !prev)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  showFavoritesOnly ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40' : 'bg-hill-gray/50 text-hill-muted hover:text-hill-white'
                }`}>
                <Star size={11} className={showFavoritesOnly ? 'fill-yellow-400' : ''} />
                Favorites
              </button>
            </div>

            {/* Sectors */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] text-hill-muted uppercase tracking-wider w-16 shrink-0">Sector</span>
              <div className="flex flex-wrap gap-1.5">
                {sectors.map((sector: string) => (
                  <button key={sector} onClick={() => setSelectedSector(sector)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-all ${
                      selectedSector === sector ? 'bg-hill-orange text-white' : 'bg-hill-gray/50 text-hill-muted hover:text-hill-white'
                    }`}>
                    {sector === 'all' ? 'All' : sector}
                  </button>
                ))}
              </div>
            </div>

            {/* Active filter summary */}
            {(selectedSentiment !== 'all' || selectedType !== 'all' || selectedSector !== 'all' || showFavoritesOnly || debouncedSearch) && (
              <div className="flex items-center gap-2 pt-2 border-t border-hill-border">
                <span className="text-[10px] text-hill-muted">Active:</span>
                {selectedSentiment !== 'all' && (
                  <span className="bg-hill-gray px-2 py-0.5 rounded text-xs text-hill-white flex items-center gap-1">
                    {sentimentConfig[selectedSentiment]?.label ?? selectedSentiment}
                    <button onClick={() => setSelectedSentiment('all')}><X size={10} className="text-hill-muted hover:text-hill-white" /></button>
                  </span>
                )}
                {selectedType !== 'all' && (
                  <span className="bg-hill-gray px-2 py-0.5 rounded text-xs text-hill-white flex items-center gap-1">
                    {formatEventType(selectedType)}
                    <button onClick={() => setSelectedType('all')}><X size={10} className="text-hill-muted hover:text-hill-white" /></button>
                  </span>
                )}
                {selectedSector !== 'all' && (
                  <span className="bg-hill-gray px-2 py-0.5 rounded text-xs text-hill-white flex items-center gap-1">
                    {selectedSector}
                    <button onClick={() => setSelectedSector('all')}><X size={10} className="text-hill-muted hover:text-hill-white" /></button>
                  </span>
                )}
                <button onClick={() => { setSelectedSentiment('all'); setSelectedType('all'); setSelectedSector('all'); setShowFavoritesOnly(false); setSearchQuery(''); setDateRange('7d'); setCustomDateFrom(''); setCustomDateTo('') }}
                  className="text-hill-orange hover:text-hill-orange/80 text-xs ml-auto">Clear all</button>
              </div>
            )}
          </div>
        )}

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
          <>
            {/* View-level count bar */}
            {totalCount > 0 && (
              <div className="mb-4 flex items-center justify-between text-sm">
                <span className="text-hill-muted">
                  Showing {visibleSignals.length} of {totalCount.toLocaleString()} {viewMode === 'tracker' ? 'tracked bills' : 'analyzed signals'}
                </span>
                {viewMode === 'analyzed' && stats.totalSignals > stats.analyzedSignals && (
                  <button onClick={() => setViewMode('tracker')} className="text-hill-orange hover:text-hill-orange/80 text-xs">
                    {(stats.totalSignals - stats.analyzedSignals).toLocaleString()} more in Tracker →
                  </button>
                )}
              </div>
            )}

            {/* TRACKER VIEW — compact rows */}
            {viewMode === 'tracker' && (
              <div className="space-y-1">
                {(visibleSignals ?? []).map((signal: Signal) => {
                  const isFavorited = favorites.has(signal.id)
                  return (
                    <div key={signal.id} className={`flex items-center gap-3 px-4 py-3 bg-hill-dark rounded-lg border transition-all hover:border-hill-orange/30 ${
                      isFavorited ? 'border-yellow-500/40' : 'border-hill-border'
                    }`}>
                      {/* Date */}
                      <span className="text-xs text-hill-muted font-mono w-16 shrink-0">
                        {signal?.event_date ? new Date(signal.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                      </span>
                      {/* Type badge */}
                      <span className="px-2 py-0.5 bg-hill-gray rounded text-xs text-hill-muted shrink-0 w-24 text-center">
                        {formatEventType(signal?.event_type ?? 'bill')}
                      </span>
                      {/* Title — clickable */}
                      <Link href={`/signals/${signal.id}`} className="text-sm text-hill-white truncate flex-1 hover:text-hill-orange transition-colors">
                        {fixTitleDollars(signal.title ?? '')}
                      </Link>
                      {/* Bill number */}
                      {signal.bill_number && (
                        <span className="text-xs text-hill-orange font-mono shrink-0 hidden md:inline">{signal.bill_number}</span>
                      )}
                      {/* Sector (first one) */}
                      <span className="text-xs text-hill-muted shrink-0 hidden lg:inline w-28 truncate text-right">
                        {(signal.affected_sectors ?? [])[0] ?? ''}
                      </span>
                      {/* Status badge */}
                      {isAnalyzed(signal) ? (
                        <span className="px-2 py-0.5 bg-hill-green/10 text-hill-green border border-hill-green/30 rounded text-xs shrink-0 font-medium">
                          Analyzed
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-hill-gray text-hill-muted border border-hill-border rounded text-xs shrink-0">
                          Tracked
                        </span>
                      )}
                      {/* Favorite star */}
                      <button
                        onClick={(e) => { e.preventDefault(); toggleAction(signal.id, 'favorite') }}
                        disabled={actionLoading === `${signal.id}-favorite`}
                        className={`p-1 rounded transition-all shrink-0 ${
                          isFavorited ? 'text-yellow-400' : 'text-hill-muted hover:text-yellow-400'
                        }`}
                        title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        <Star size={14} className={isFavorited ? 'fill-yellow-400' : ''} />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}

            {/* ANALYZED VIEW — full cards */}
            {viewMode === 'analyzed' && (
              <div className="space-y-3">
                {(visibleSignals ?? []).map((signal: Signal) => {
                  const sentiment = sentimentConfig?.[signal?.sentiment ?? 'neutral'] ?? sentimentConfig?.neutral
                  const SentimentIcon = sentiment?.Icon ?? Minus
                  const isExpanded = expandedId === signal?.id
                  const isFavorited = favorites.has(signal.id)
                  const isContract = signal?.event_type === 'contract_award'
                  const rawAmount = isContract && signal.raw_data?.total_obligation ? Number(signal.raw_data.total_obligation) : null
                  const recipient = isContract ? (signal.raw_data?.recipient_name ?? null) : null

                  return (
                    <div key={signal?.id} className={`bg-hill-dark rounded-xl border transition-all duration-200 overflow-hidden ${
                      isFavorited ? 'border-yellow-500/40 ring-1 ring-yellow-500/20'
                        : isContract ? 'border-l-2 border-l-hill-blue border-hill-border'
                        : 'border-hill-border hover:border-hill-border/80'
                    }`}>
                      <div className="p-5">
                        {/* Row 1: Type badge + meta + actions */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              {isContract ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-hill-blue/15 text-hill-blue text-[10px] font-bold rounded uppercase">
                                  <Landmark size={10} /> Contract
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-hill-gray text-hill-muted text-[10px] font-bold rounded uppercase">
                                  <FileText size={10} /> Bill
                                </span>
                              )}
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${sentiment?.bg ?? ''} ${sentiment?.color ?? ''}`}>
                                <SentimentIcon size={10} />
                                {sentiment?.label ?? 'Neutral'}
                              </span>
                              {rawAmount && rawAmount > 0 && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-hill-green/10 text-hill-green text-[11px] font-bold font-mono rounded">
                                  <DollarSign size={10} />
                                  {fixTitleDollars(`$${(rawAmount / 1e6).toFixed(1)}M`).replace('$', '')}
                                </span>
                              )}
                              {signal?.bill_number && (
                                <span className="text-[11px] text-hill-orange font-mono">{signal.bill_number}</span>
                              )}
                              <span className="text-[11px] text-hill-muted font-mono">
                                {signal?.event_date ? new Date(signal.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                              </span>
                            </div>
                            <Link href={`/signals/${signal?.id ?? ''}`} className="hover:text-hill-orange transition-colors">
                              <h2 className="text-[15px] font-semibold text-hill-white leading-snug">{fixTitleDollars(signal?.title ?? 'Untitled')}</h2>
                            </Link>
                            {recipient && (
                              <p className="text-xs text-hill-muted mt-1">{recipient}</p>
                            )}
                          </div>
                          {/* Actions — compact */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button onClick={() => toggleAction(signal.id, 'favorite')} disabled={actionLoading === `${signal.id}-favorite`}
                              className={`p-1.5 rounded transition-all ${isFavorited ? 'text-yellow-400' : 'text-hill-muted hover:text-yellow-400'}`}
                              title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}>
                              <Star size={14} className={isFavorited ? 'fill-yellow-400' : ''} />
                            </button>
                            <button onClick={() => toggleAction(signal.id, 'dismissed')} disabled={actionLoading === `${signal.id}-dismissed`}
                              className="p-1.5 rounded text-hill-muted hover:text-hill-red transition-all" title="Dismiss signal">
                              <X size={14} />
                            </button>
                          </div>
                        </div>

                        {/* Tickers & sectors — compact */}
                        {((signal?.tickers?.length ?? 0) > 0 || (signal?.affected_sectors?.length ?? 0) > 0) && (
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {(signal?.tickers ?? [])?.map?.((ticker: string) => (
                              <span key={ticker} className="bg-hill-gray px-2 py-0.5 rounded text-xs font-mono text-hill-orange font-medium">{ticker}</span>
                            ))}
                            {(signal?.affected_sectors ?? [])?.map?.((sector: string) => (
                              <span key={sector} className="bg-hill-border/50 px-2 py-0.5 rounded text-[11px] text-hill-muted">{sector}</span>
                            ))}
                          </div>
                        )}

                        {/* Summary */}
                        <p className="text-hill-text text-sm leading-relaxed mb-3">{signal?.summary ?? ''}</p>

                        {/* Footer: impact bar + expand */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="flex gap-px">
                              {[...(Array(10) ?? [])]?.map?.((_: any, i: number) => (
                                <div key={i} className={`w-1.5 h-4 rounded-sm ${
                                  i < (signal?.impact_score ?? 0)
                                    ? (signal?.impact_score ?? 0) >= 7 ? 'bg-hill-orange' : (signal?.impact_score ?? 0) >= 4 ? 'bg-hill-green' : 'bg-hill-blue'
                                    : 'bg-hill-gray/50'
                                }`} />
                              ))}
                            </div>
                            <span className="text-xs font-mono text-hill-muted">{signal?.impact_score ?? 0}/10</span>
                          </div>
                          {(signal?.full_analysis || (signal?.key_takeaways?.length ?? 0) > 0) && (
                            <button onClick={() => setExpandedId(isExpanded ? null : signal?.id ?? null)}
                              className="flex items-center gap-1 text-xs text-hill-orange hover:text-hill-orange/80 transition-colors">
                              {isExpanded ? <><ChevronUp size={12} /> Hide</> : <><ChevronDown size={12} /> Analysis</>}
                            </button>
                          )}
                        </div>
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
          </>
        )}

        {/* Load More button */}
        {!loading && !error && hasMore && (
          <div className="mt-6 text-center">
            <Button variant="secondary" onClick={loadMore} loading={loadingMore} disabled={loadingMore}>
              {loadingMore ? 'Loading...' : `Load More ${viewMode === 'tracker' ? 'Bills' : 'Signals'}`}
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
              {(selectedSentiment !== 'all' || selectedType !== 'all' || selectedSector !== 'all' || showFavoritesOnly || debouncedSearch || dateRange !== '7d') && (
                <Button variant="ghost" onClick={() => { setSelectedSentiment('all'); setSelectedType('all'); setSelectedSector('all'); setShowFavoritesOnly(false); setSearchQuery(''); setDateRange('7d'); setCustomDateFrom(''); setCustomDateTo('') }}>Clear All Filters</Button>
              )}
            </div>
          </Card>
        )}

        {/* Bottom DB count — subtle */}
        {!loading && stats.totalSignals > 0 && (
          <div className="mt-6 text-center">
            <p className="text-[11px] text-hill-muted/60">
              {stats.totalSignals.toLocaleString()} signals tracked · {stats.analyzedSignals.toLocaleString()} AI analyzed
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
