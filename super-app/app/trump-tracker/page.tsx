"use client"

import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { InvestmentCard } from '@/components/trump-tracker/investment-card'
import { FilterBar } from '@/components/trump-tracker/filter-bar'
import { PortfolioChart } from '@/components/trump-tracker/portfolio-chart'
import { SourceStatus } from '@/components/trump-tracker/source-status'
import { HotStocks } from '@/components/trump-tracker/hot-stocks'
import { PortfolioPanel } from '@/components/trump-tracker/portfolio-panel'
import type { TrumpInvestment, TrackerSource, InvestmentAssetType } from '@/lib/trump-tracker/types'
import {
  TrendingUp,
  RefreshCw,
  Bell,
  Activity,
  BarChart3,
  Landmark,
  Crown,
  Flame,
  List,
  Wallet,
} from 'lucide-react'

type TrackMode = 'all' | 'trump' | 'congress'
type ViewMode = 'feed' | 'hot-stocks' | 'portfolio'

export default function TrumpTrackerPage() {
  const [investments, setInvestments] = useState<TrumpInvestment[]>([])
  const [sources, setSources] = useState<TrackerSource[]>([])
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [alerting, setAlerting] = useState(false)

  // Filters
  const [search, setSearch] = useState('')
  const [assetType, setAssetType] = useState<InvestmentAssetType | 'all'>('all')
  const [familyMember, setFamilyMember] = useState('All Members')
  const [trackMode, setTrackMode] = useState<TrackMode>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('portfolio')

  const fetchData = useCallback(async () => {
    setLoading(true)

    // Build query — fetch last 90 days, up to 500 trades for Hot Stocks analysis
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
    let query = supabase
      .from('trump_investments')
      .select('*')
      .gte('detected_at', ninetyDaysAgo)
      .order('detected_at', { ascending: false })
      .limit(500)

    if (assetType !== 'all') {
      query = query.eq('asset_type', assetType)
    }
    if (familyMember !== 'All Members') {
      query = query.eq('family_member', familyMember)
    }
    if (search) {
      query = query.or(
        `asset_name.ilike.%${search}%,description.ilike.%${search}%,source_title.ilike.%${search}%,family_member.ilike.%${search}%`
      )
    }

    // Track mode filter
    if (trackMode === 'trump') {
      // Trump family members don't start with "Rep." or "Sen."
      query = query.not('family_member', 'like', 'Rep.%').not('family_member', 'like', 'Sen.%')
    } else if (trackMode === 'congress') {
      query = query.or('family_member.like.Rep.%,family_member.like.Sen.%')
    }

    const [invResult, srcResult] = await Promise.all([
      query,
      supabase.from('trump_tracker_sources').select('*').order('source_key'),
    ])

    if (invResult.data) {
      setInvestments(invResult.data as unknown as TrumpInvestment[])
    }
    if (srcResult.data) {
      setSources(srcResult.data as unknown as TrackerSource[])
    }
    setLoading(false)
  }, [assetType, familyMember, search, trackMode])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Dynamic family member / congress member list from data
  const memberOptions = useMemo(() => {
    const members = new Set<string>()
    for (const inv of investments) {
      members.add(inv.family_member)
    }
    return ['All Members', ...Array.from(members).sort()]
  }, [investments])

  const handleScan = async () => {
    setScanning(true)
    try {
      const res = await fetch('/api/trump-tracker/collect', { method: 'POST' })
      await res.json()
      await fetchData()
    } catch {
      // Handle error silently
    }
    setScanning(false)
  }

  const handleSendAlerts = async () => {
    setAlerting(true)
    try {
      const unalerted = investments.filter(i => !i.alert_sent)
      if (unalerted.length === 0) return

      const res = await fetch('/api/trump-tracker/alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ investmentIds: unalerted.map(i => i.id) }),
      })
      const data = await res.json()
      if (data.sent > 0) {
        await fetchData()
      }
    } catch {
      // Handle error silently
    }
    setAlerting(false)
  }

  // Stats
  const totalCount = investments.length
  const unalertedCount = investments.filter(i => !i.alert_sent).length
  const thisWeekCount = investments.filter(i => {
    const d = new Date(i.detected_at)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    return d >= weekAgo
  }).length
  const congressCount = investments.filter(i =>
    i.family_member.startsWith('Rep.') || i.family_member.startsWith('Sen.')
  ).length
  const trumpCount = investments.filter(i =>
    !i.family_member.startsWith('Rep.') && !i.family_member.startsWith('Sen.')
  ).length

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-5 h-5 text-red-500" />
            <span className="text-xs font-semibold uppercase tracking-wider text-red-500">
              Political Investment Tracker
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Stock & Crypto Tracker</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Trump family investments + Congressional stock trades from STOCK Act filings
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unalertedCount > 0 && (
            <button
              onClick={handleSendAlerts}
              disabled={alerting}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 transition-colors disabled:opacity-50"
            >
              <Bell className="w-3.5 h-3.5" />
              {alerting ? 'Sending...' : `Alert (${unalertedCount})`}
            </button>
          )}
          <button
            onClick={handleScan}
            disabled={scanning}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} />
            {scanning ? 'Scanning...' : 'Scan Now'}
          </button>
        </div>
      </div>

      {/* Track mode toggle */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/50 w-fit mb-6">
        {([
          { mode: 'all' as TrackMode, label: 'All', icon: Activity },
          { mode: 'trump' as TrackMode, label: 'Trump Family', icon: Crown },
          { mode: 'congress' as TrackMode, label: 'Congress', icon: Landmark },
        ]).map(({ mode, label, icon: Icon }) => (
          <button
            key={mode}
            onClick={() => { setTrackMode(mode); setFamilyMember('All Members') }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              trackMode === mode
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard icon={Activity} label="Total Tracked" value={totalCount} color="#ef4444" />
        <StatCard icon={BarChart3} label="This Week" value={thisWeekCount} color="#f59e0b" />
        <StatCard icon={Crown} label="Trump Family" value={trumpCount} color="#dc2626" />
        <StatCard icon={Landmark} label="Congress" value={congressCount} color="#3b82f6" />
      </div>

      {/* Filters */}
      <div className="mb-6">
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          assetType={assetType}
          onAssetTypeChange={setAssetType}
          familyMember={familyMember}
          onFamilyMemberChange={setFamilyMember}
          memberOptions={memberOptions}
        />
      </div>

      {/* Main content: Feed/HotStocks + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left panel (2/3) */}
        <div className="lg:col-span-2">
          {/* View toggle */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/50 w-fit">
              {([
                { mode: 'portfolio' as ViewMode, label: 'My Portfolio', icon: Wallet },
                { mode: 'hot-stocks' as ViewMode, label: 'Hot Stocks', icon: Flame },
                { mode: 'feed' as ViewMode, label: 'All Trades', icon: List },
              ]).map(({ mode, label, icon: Icon }) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    viewMode === mode
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>
            {viewMode === 'hot-stocks' && investments.length > 0 && (
              <span className="text-[10px] text-muted-foreground">
                Based on {investments.length} trades — last 90 days
              </span>
            )}
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground">
              <RefreshCw className="w-5 h-5 animate-spin mr-2" />
              Loading investments...
            </div>
          ) : investments.length === 0 ? (
            <div className="text-center py-20">
              <TrendingUp className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm font-medium text-muted-foreground">
                No investments found
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Click &quot;Scan Now&quot; to fetch the latest data from all sources
              </p>
            </div>
          ) : viewMode === 'portfolio' ? (
            <PortfolioPanel />
          ) : viewMode === 'hot-stocks' ? (
            <HotStocks investments={investments} />
          ) : (
            <div className="space-y-3">
              {investments.map(inv => (
                <InvestmentCard key={inv.id} investment={inv} />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar (1/3) */}
        <div className="space-y-6">
          {/* Chart */}
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-semibold text-card-foreground mb-3">
              Portfolio Breakdown
            </h3>
            <PortfolioChart investments={investments} />
          </div>

          {/* Top traders */}
          {investments.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="text-sm font-semibold text-card-foreground mb-3">
                Top Traders
              </h3>
              <TopTraders investments={investments} />
            </div>
          )}

          {/* Sources */}
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-semibold text-card-foreground mb-3">
              Data Sources ({sources.filter(s => s.enabled).length})
            </h3>
            <SourceStatus sources={sources} />
          </div>
        </div>
      </div>
    </div>
  )
}

function TopTraders({ investments }: { investments: TrumpInvestment[] }) {
  const traders = useMemo(() => {
    const counts: Record<string, { count: number; totalUsd: number }> = {}
    for (const inv of investments) {
      if (!counts[inv.family_member]) {
        counts[inv.family_member] = { count: 0, totalUsd: 0 }
      }
      counts[inv.family_member].count++
      counts[inv.family_member].totalUsd += inv.estimated_amount_usd || 0
    }
    return Object.entries(counts)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 8)
  }, [investments])

  return (
    <div className="space-y-2">
      {traders.map(([name, { count, totalUsd }]) => {
        const isCongressMember = name.startsWith('Rep.') || name.startsWith('Sen.')
        return (
          <div key={name} className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-2 min-w-0">
              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isCongressMember ? 'bg-blue-500' : 'bg-red-500'}`} />
              <span className="text-xs font-medium text-card-foreground truncate">{name}</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {totalUsd > 0 && (
                <span className="text-[10px] text-muted-foreground">
                  ${(totalUsd / 1000).toFixed(0)}k
                </span>
              )}
              <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                {count}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Activity
  label: string
  value: number
  color: string
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card">
      <div
        className="flex items-center justify-center w-9 h-9 rounded-lg flex-shrink-0"
        style={{ backgroundColor: color + '15' }}
      >
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div>
        <p className="text-lg font-bold text-card-foreground">{value}</p>
        <p className="text-[10px] text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}
