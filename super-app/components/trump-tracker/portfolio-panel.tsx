"use client"

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Zap,
  Target,
  PiggyBank,
  RefreshCw,
  Send,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
} from 'lucide-react'

interface Portfolio {
  id: string
  name: string
  initial_capital: number
  current_cash: number
  target_weekly_return: number
  updated_at: string
}

interface Holding {
  id: string
  ticker: string
  asset_name: string
  shares: number
  avg_buy_price: number
  current_price: number
  current_value: number
  pnl: number
  pnl_pct: number
}

interface Trade {
  id: string
  ticker: string
  action: string
  shares: number
  price: number
  total: number
  reason: string
  conviction: string
  executed_at: string
}

export function PortfolioPanel() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null)
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)
  const [investing, setInvesting] = useState(false)
  const [lastResult, setLastResult] = useState<Record<string, unknown> | null>(null)

  const fetchPortfolio = useCallback(async () => {
    setLoading(true)
    const [pRes, hRes, tRes] = await Promise.all([
      supabase.from('tracker_portfolio').select('*').limit(1),
      supabase.from('tracker_holdings').select('*').order('current_value', { ascending: false }),
      supabase.from('tracker_trades').select('*').order('executed_at', { ascending: false }).limit(20),
    ])
    if (pRes.data?.[0]) setPortfolio(pRes.data[0] as unknown as Portfolio)
    if (hRes.data) setHoldings(hRes.data as unknown as Holding[])
    if (tRes.data) setTrades(tRes.data as unknown as Trade[])
    setLoading(false)
  }, [])

  useEffect(() => { fetchPortfolio() }, [fetchPortfolio])

  const handleInvest = async () => {
    setInvesting(true)
    setLastResult(null)
    try {
      const res = await fetch('/api/trump-tracker/invest', { method: 'POST' })
      const data = await res.json()
      setLastResult(data)
      await fetchPortfolio()
    } catch {
      setLastResult({ error: 'Failed to run investment engine' })
    }
    setInvesting(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10 text-muted-foreground">
        <RefreshCw className="w-4 h-4 animate-spin mr-2" />
        <span className="text-sm">Loading portfolio...</span>
      </div>
    )
  }

  if (!portfolio) return null

  const holdingsValue = holdings.reduce((sum, h) => sum + (h.current_value || h.shares * h.avg_buy_price), 0)
  const totalValue = portfolio.current_cash + holdingsValue
  const totalPnl = totalValue - portfolio.initial_capital
  const totalPnlPct = (totalPnl / portfolio.initial_capital) * 100
  const weeklyTarget = portfolio.initial_capital * portfolio.target_weekly_return
  const progressToTarget = Math.min(100, Math.max(0, (totalPnl / weeklyTarget) * 100))

  return (
    <div className="space-y-5">
      {/* Portfolio header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-card-foreground flex items-center gap-2">
            <PiggyBank className="w-5 h-5 text-green-500" />
            My Portfolio
          </h2>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            AI-managed · Target: +10%/week
          </p>
        </div>
        <button
          onClick={handleInvest}
          disabled={investing}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          {investing ? (
            <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Analyzing...</>
          ) : (
            <><Zap className="w-3.5 h-3.5" /> Run AI Invest</>
          )}
        </button>
      </div>

      {/* Value cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MiniCard
          icon={DollarSign}
          label="Total Value"
          value={`$${formatNum(totalValue)}`}
          color="#10b981"
        />
        <MiniCard
          icon={totalPnl >= 0 ? TrendingUp : TrendingDown}
          label="P&L"
          value={`${totalPnl >= 0 ? '+' : ''}$${formatNum(totalPnl)}`}
          sub={`${totalPnlPct >= 0 ? '+' : ''}${totalPnlPct.toFixed(2)}%`}
          color={totalPnl >= 0 ? '#10b981' : '#ef4444'}
        />
        <MiniCard
          icon={PiggyBank}
          label="Cash"
          value={`$${formatNum(portfolio.current_cash)}`}
          sub={`${((portfolio.current_cash / totalValue) * 100).toFixed(0)}%`}
          color="#3b82f6"
        />
        <MiniCard
          icon={Target}
          label="Weekly Target"
          value={`${progressToTarget.toFixed(0)}%`}
          sub={`$${formatNum(weeklyTarget)} goal`}
          color="#f59e0b"
        />
      </div>

      {/* Weekly target progress bar */}
      <div className="px-1">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
          <span>Weekly progress</span>
          <span>{progressToTarget.toFixed(0)}% of +10% target</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(progressToTarget, 100)}%`,
              backgroundColor: progressToTarget >= 100 ? '#10b981' : progressToTarget >= 50 ? '#f59e0b' : '#ef4444',
            }}
          />
        </div>
      </div>

      {/* AI Result banner */}
      {lastResult && (
        <div className={`p-3 rounded-lg border ${lastResult.error ? 'border-red-500/30 bg-red-500/5' : 'border-green-500/30 bg-green-500/5'}`}>
          <div className="flex items-start gap-2">
            <Sparkles className={`w-4 h-4 mt-0.5 flex-shrink-0 ${lastResult.error ? 'text-red-500' : 'text-green-500'}`} />
            <div className="text-xs">
              {lastResult.error ? (
                <p className="text-red-400">{lastResult.error as string}</p>
              ) : (
                <>
                  <p className="font-medium text-green-400 mb-1">
                    {(lastResult.trades as unknown[])?.length || 0} trades executed
                  </p>
                  {lastResult.commentary && (
                    <p className="text-muted-foreground">{lastResult.commentary as string}</p>
                  )}
                  {(lastResult.trades as { ticker: string; shares: number; total: string; conviction: string }[])?.map((t, i) => (
                    <div key={i} className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        t.conviction === 'high' ? 'bg-green-500/20 text-green-400' :
                        t.conviction === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {t.conviction?.toUpperCase()}
                      </span>
                      <span className="font-medium text-card-foreground">{t.ticker}</span>
                      <span className="text-muted-foreground">{t.shares} shares @ ${t.total}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Holdings */}
      {holdings.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
            Holdings ({holdings.length})
          </h3>
          <div className="space-y-1.5">
            {holdings.map(h => {
              const pnl = (h.current_value || h.shares * h.avg_buy_price) - (h.shares * h.avg_buy_price)
              const pnlPct = h.avg_buy_price > 0 ? (pnl / (h.shares * h.avg_buy_price)) * 100 : 0
              return (
                <div key={h.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/30 border border-border/50">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-card-foreground">{h.ticker}</span>
                    <span className="text-[10px] text-muted-foreground">{h.shares} shares</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-card-foreground">
                      ${formatNum(h.current_value || h.shares * h.avg_buy_price)}
                    </p>
                    <p className={`text-[10px] flex items-center gap-0.5 justify-end ${pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {pnl >= 0 ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
                      {pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(1)}%
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Recent trades */}
      {trades.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
            Recent Trades
          </h3>
          <div className="space-y-1">
            {trades.slice(0, 8).map(t => (
              <div key={t.id} className="flex items-center justify-between px-2 py-1.5 text-[11px]">
                <div className="flex items-center gap-2">
                  <span className={`font-bold ${t.action === 'buy' ? 'text-green-500' : 'text-red-500'}`}>
                    {t.action.toUpperCase()}
                  </span>
                  <span className="font-medium text-card-foreground">{t.ticker}</span>
                  <span className="text-muted-foreground">{t.shares} @ ${t.price.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">${formatNum(t.total)}</span>
                  {t.conviction && (
                    <span className={`text-[9px] px-1 py-0.5 rounded ${
                      t.conviction === 'high' ? 'bg-green-500/15 text-green-500' :
                      t.conviction === 'medium' ? 'bg-amber-500/15 text-amber-400' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {t.conviction}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {holdings.length === 0 && trades.length === 0 && (
        <div className="text-center py-8">
          <Zap className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground font-medium">$50,000 ready to invest</p>
          <p className="text-xs text-muted-foreground mt-1">
            Click &quot;Run AI Invest&quot; to analyze Hot Stocks and allocate capital
          </p>
        </div>
      )}
    </div>
  )
}

function MiniCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: typeof DollarSign
  label: string
  value: string
  sub?: string
  color: string
}) {
  return (
    <div className="p-3 rounded-lg border border-border bg-card">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3 h-3" style={{ color }} />
        <span className="text-[10px] text-muted-foreground">{label}</span>
      </div>
      <p className="text-sm font-bold text-card-foreground">{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
    </div>
  )
}

function formatNum(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return n.toFixed(2)
}
