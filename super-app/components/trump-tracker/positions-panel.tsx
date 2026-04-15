"use client"

import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabaseAny as supabase } from '@/lib/supabase'
import {
  Briefcase,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Camera,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Shield,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

interface Position {
  id: string
  tip_id: string | null
  ticker: string
  asset: string
  asset_type: string | null
  direction: string
  conviction: string | null
  rank: number | null
  week_of: string | null
  entry_date: string
  entry_price: number
  entry_zone: string | null
  current_price: number | null
  last_snapshot_at: string | null
  target_price: number | null
  stop_loss_price: number | null
  target_return_pct: number | null
  pnl: number
  pnl_pct: number
  status: string
  closed_date: string | null
  close_price: number | null
  close_reason: string | null
  rationale: string | null
}

type FilterMode = 'all' | 'open' | 'closed'

export function PositionsPanel() {
  const [positions, setPositions] = useState<Position[]>([])
  const [loading, setLoading] = useState(true)
  const [snapshotting, setSnapshotting] = useState(false)
  const [filter, setFilter] = useState<FilterMode>('all')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [lastSnapshot, setLastSnapshot] = useState<string | null>(null)

  const fetchPositions = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('tracker_positions')
      .select('*')
      .order('entry_date', { ascending: false })
      .limit(200)
    if (data) {
      setPositions(data as unknown as Position[])
      // Find most recent snapshot
      const latest = (data as Position[])
        .map(p => p.last_snapshot_at)
        .filter(Boolean)
        .sort()
        .reverse()[0]
      setLastSnapshot(latest || null)
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchPositions() }, [fetchPositions])

  const handleSnapshot = async () => {
    setSnapshotting(true)
    try {
      const res = await fetch('/api/trump-tracker/positions/snapshot', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        await fetchPositions()
      }
    } catch {
      // Error handled by UI not updating
    }
    setSnapshotting(false)
  }

  // Filtered positions
  const filtered = useMemo(() => {
    if (filter === 'open') return positions.filter(p => p.status === 'open')
    if (filter === 'closed') return positions.filter(p => p.status !== 'open')
    return positions
  }, [positions, filter])

  // Aggregate stats
  const stats = useMemo(() => {
    const open = positions.filter(p => p.status === 'open')
    const closed = positions.filter(p => p.status !== 'open')
    const totalOpenPnl = open.reduce((s, p) => s + (p.pnl || 0), 0)
    const totalClosedPnl = closed.reduce((s, p) => s + (p.pnl || 0), 0)
    const winners = closed.filter(p => (p.pnl || 0) > 0).length
    const losers = closed.filter(p => (p.pnl || 0) < 0).length
    const winRate = closed.length > 0 ? (winners / closed.length) * 100 : 0
    return {
      openCount: open.length,
      closedCount: closed.length,
      totalOpenPnl,
      totalClosedPnl,
      winRate,
      winners,
      losers,
      totalTrades: positions.length,
    }
  }, [positions])

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-bold text-card-foreground flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-blue-500" />
            Tracked Positions
          </h2>
          <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1.5">
            <Clock className="w-2.5 h-2.5" />
            {lastSnapshot ? (
              <>Last snapshot: {new Date(lastSnapshot).toLocaleString()}</>
            ) : (
              <>No snapshots yet</>
            )}
          </p>
        </div>
        <button
          onClick={handleSnapshot}
          disabled={snapshotting}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {snapshotting ? (
            <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Snapshotting...</>
          ) : (
            <><Camera className="w-3.5 h-3.5" /> Snapshot Now</>
          )}
        </button>
      </div>

      {/* Info banner */}
      <div className="p-3 rounded-lg border border-blue-500/20 bg-blue-500/5">
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          <span className="font-semibold text-blue-500">How it works:</span> Each tip of the week
          becomes a tracked position at market close. Positions stay open until they hit their
          target (profit), stop-loss (loss), or are manually closed. Prices are fetched live
          from Yahoo Finance daily, with P&amp;L recalculated automatically.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          icon={Briefcase}
          label="Open Positions"
          value={stats.openCount.toString()}
          sub={`${stats.closedCount} closed`}
          color="#3b82f6"
        />
        <StatCard
          icon={stats.totalOpenPnl >= 0 ? TrendingUp : TrendingDown}
          label="Open P&L"
          value={`${stats.totalOpenPnl >= 0 ? '+' : ''}$${formatNum(stats.totalOpenPnl)}`}
          color={stats.totalOpenPnl >= 0 ? '#10b981' : '#ef4444'}
        />
        <StatCard
          icon={CheckCircle2}
          label="Win Rate"
          value={`${stats.winRate.toFixed(0)}%`}
          sub={`${stats.winners}W / ${stats.losers}L`}
          color="#f59e0b"
        />
        <StatCard
          icon={stats.totalClosedPnl >= 0 ? TrendingUp : TrendingDown}
          label="Realized P&L"
          value={`${stats.totalClosedPnl >= 0 ? '+' : ''}$${formatNum(stats.totalClosedPnl)}`}
          color={stats.totalClosedPnl >= 0 ? '#10b981' : '#ef4444'}
        />
      </div>

      {/* Filter toggle */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/50 w-fit">
        {([
          { mode: 'all' as FilterMode, label: 'All', count: stats.totalTrades },
          { mode: 'open' as FilterMode, label: 'Open', count: stats.openCount },
          { mode: 'closed' as FilterMode, label: 'Closed', count: stats.closedCount },
        ]).map(({ mode, label, count }) => (
          <button
            key={mode}
            onClick={() => setFilter(mode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              filter === mode
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {label}
            <span className="text-[10px] px-1 py-0.5 rounded bg-muted/80 text-muted-foreground">
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Position list */}
      {loading ? (
        <div className="flex items-center justify-center py-10 text-muted-foreground">
          <RefreshCw className="w-4 h-4 animate-spin mr-2" />
          <span className="text-sm">Loading positions...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 rounded-xl border border-dashed border-border">
          <Briefcase className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm font-medium text-card-foreground">No positions yet</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
            {positions.length === 0
              ? 'Generate tips first, then click "Snapshot Now" to open positions at current market prices'
              : `No ${filter} positions`}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(pos => (
            <PositionCard
              key={pos.id}
              position={pos}
              expanded={expanded === pos.id}
              onToggle={() => setExpanded(expanded === pos.id ? null : pos.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function PositionCard({ position, expanded, onToggle }: {
  position: Position
  expanded: boolean
  onToggle: () => void
}) {
  const isLong = position.direction.toLowerCase() === 'long'
  const isOpen = position.status === 'open'
  const pnlPositive = (position.pnl || 0) >= 0
  const pnlColor = pnlPositive ? '#10b981' : '#ef4444'

  const statusBadge = {
    open: { label: 'OPEN', color: '#3b82f6', icon: Clock },
    target_hit: { label: 'TARGET HIT', color: '#10b981', icon: CheckCircle2 },
    stopped_out: { label: 'STOPPED OUT', color: '#ef4444', icon: XCircle },
    closed_manual: { label: 'CLOSED', color: '#6b7280', icon: XCircle },
    expired: { label: 'EXPIRED', color: '#6b7280', icon: Clock },
  }[position.status] || { label: position.status.toUpperCase(), color: '#6b7280', icon: Clock }

  const StatusIcon = statusBadge.icon
  const currentPrice = position.current_price ?? position.entry_price

  return (
    <div className={`rounded-xl border overflow-hidden ${isOpen ? 'border-border bg-card' : 'border-border/50 bg-muted/10'}`}>
      <button onClick={onToggle} className="w-full p-4 flex items-center gap-3 hover:bg-muted/20 transition-colors text-left">
        {/* Ticker + direction */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base font-bold text-card-foreground">{position.ticker}</span>
            {position.rank && (
              <span className="text-[10px] text-muted-foreground">#{position.rank}</span>
            )}
            <span className={`flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              isLong ? 'bg-green-500/15 text-green-500' : 'bg-red-500/15 text-red-500'
            }`}>
              {isLong ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
              {position.direction.toUpperCase()}
            </span>
            <span
              className="flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: statusBadge.color + '20', color: statusBadge.color }}
            >
              <StatusIcon className="w-2.5 h-2.5" />
              {statusBadge.label}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1 truncate">
            {position.asset}
          </p>
        </div>

        {/* Prices */}
        <div className="text-right flex-shrink-0 hidden sm:block">
          <div className="text-[10px] text-muted-foreground">Entry → Current</div>
          <div className="text-xs font-medium text-card-foreground">
            ${position.entry_price.toFixed(2)} → ${currentPrice.toFixed(2)}
          </div>
        </div>

        {/* P&L */}
        <div className="text-right flex-shrink-0 min-w-[70px]">
          <div
            className="text-sm font-bold flex items-center gap-0.5 justify-end"
            style={{ color: pnlColor }}
          >
            {pnlPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {position.pnl_pct >= 0 ? '+' : ''}{position.pnl_pct.toFixed(2)}%
          </div>
          <div className="text-[10px]" style={{ color: pnlColor }}>
            {position.pnl >= 0 ? '+' : ''}${formatNum(position.pnl)}
          </div>
        </div>

        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-0 space-y-3 border-t border-border/50">
          {/* Entry/Target/Stop boxes */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <InfoBox
              icon={Calendar}
              label="Entry Date"
              value={new Date(position.entry_date).toLocaleDateString()}
              sub={`@ $${position.entry_price.toFixed(2)}`}
              color="#6b7280"
            />
            <InfoBox
              icon={TrendingUp}
              label="Current"
              value={`$${currentPrice.toFixed(2)}`}
              sub={isOpen ? 'Live' : 'At close'}
              color="#3b82f6"
            />
            {position.target_price && (
              <InfoBox
                icon={Target}
                label="Target"
                value={`$${position.target_price.toFixed(2)}`}
                sub={position.target_return_pct ? `+${position.target_return_pct}%` : undefined}
                color="#10b981"
              />
            )}
            {position.stop_loss_price && (
              <InfoBox
                icon={Shield}
                label="Stop-loss"
                value={`$${position.stop_loss_price.toFixed(2)}`}
                color="#ef4444"
              />
            )}
          </div>

          {/* Close reason */}
          {position.close_reason && (
            <div className="p-2 rounded-lg bg-muted/30 border border-border/50">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-0.5">
                Closed on {position.closed_date}
              </p>
              <p className="text-[11px] text-card-foreground">{position.close_reason}</p>
            </div>
          )}

          {/* Rationale */}
          {position.rationale && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">
                Original thesis
              </p>
              <p className="text-[11px] text-card-foreground leading-relaxed">{position.rationale}</p>
            </div>
          )}

          {/* Week tag */}
          {position.week_of && (
            <p className="text-[10px] text-muted-foreground">
              From tips of the week of {new Date(position.week_of).toLocaleDateString()}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: typeof Briefcase
  label: string
  value: string
  sub?: string
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
      <div className="min-w-0">
        <p className="text-sm font-bold text-card-foreground truncate">{value}</p>
        <p className="text-[10px] text-muted-foreground">{label}{sub && ` · ${sub}`}</p>
      </div>
    </div>
  )
}

function InfoBox({ icon: Icon, label, value, sub, color }: {
  icon: typeof Briefcase
  label: string
  value: string
  sub?: string
  color: string
}) {
  return (
    <div className="p-2 rounded-lg border border-border/50 bg-muted/20">
      <div className="flex items-center gap-1 mb-0.5">
        <Icon className="w-2.5 h-2.5" style={{ color }} />
        <span className="text-[9px] font-semibold uppercase text-muted-foreground">{label}</span>
      </div>
      <p className="text-[11px] font-medium text-card-foreground">{value}</p>
      {sub && <p className="text-[9px] text-muted-foreground">{sub}</p>}
    </div>
  )
}

function formatNum(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return n.toFixed(2)
}
