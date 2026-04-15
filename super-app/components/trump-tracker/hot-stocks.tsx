"use client"

import { useMemo, useState } from 'react'
import { Flame, ArrowUpRight, ArrowDownRight, Minus, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'
import type { TrumpInvestment } from '@/lib/trump-tracker/types'

interface HotStock {
  ticker: string
  assetName: string
  buyCount: number
  sellCount: number
  netSentiment: number // buyCount - sellCount
  uniqueBuyers: string[]
  uniqueSellers: string[]
  totalEstimatedUsd: number
  lastTradeDate: string
  trades: TrumpInvestment[]
}

export function HotStocks({ investments }: { investments: TrumpInvestment[] }) {
  const [expandedTicker, setExpandedTicker] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'buyers' | 'volume' | 'recent'>('buyers')

  const hotStocks = useMemo(() => {
    const stockMap: Record<string, HotStock> = {}

    for (const inv of investments) {
      // Only count trades with a ticker
      const ticker = inv.asset_ticker || inv.asset_name
      if (!ticker || ticker === '--') continue

      if (!stockMap[ticker]) {
        stockMap[ticker] = {
          ticker,
          assetName: inv.asset_name,
          buyCount: 0,
          sellCount: 0,
          netSentiment: 0,
          uniqueBuyers: [],
          uniqueSellers: [],
          totalEstimatedUsd: 0,
          lastTradeDate: inv.detected_at,
          trades: [],
        }
      }

      const stock = stockMap[ticker]
      stock.trades.push(inv)
      stock.totalEstimatedUsd += inv.estimated_amount_usd || 0

      if (new Date(inv.detected_at) > new Date(stock.lastTradeDate)) {
        stock.lastTradeDate = inv.detected_at
      }

      const action = (inv.action || '').toLowerCase()
      const isBuy = action.includes('buy') || action.includes('purchase')
      const isSell = action.includes('sell') || action.includes('sale')

      if (isBuy) {
        stock.buyCount++
        if (!stock.uniqueBuyers.includes(inv.family_member)) {
          stock.uniqueBuyers.push(inv.family_member)
        }
      } else if (isSell) {
        stock.sellCount++
        if (!stock.uniqueSellers.includes(inv.family_member)) {
          stock.uniqueSellers.push(inv.family_member)
        }
      } else {
        // Default to buy if action is unclear (filings, news)
        stock.buyCount++
        if (!stock.uniqueBuyers.includes(inv.family_member)) {
          stock.uniqueBuyers.push(inv.family_member)
        }
      }

      stock.netSentiment = stock.buyCount - stock.sellCount
    }

    let sorted = Object.values(stockMap)

    // Sort
    if (sortBy === 'buyers') {
      sorted.sort((a, b) => b.uniqueBuyers.length - a.uniqueBuyers.length || b.buyCount - a.buyCount)
    } else if (sortBy === 'volume') {
      sorted.sort((a, b) => b.totalEstimatedUsd - a.totalEstimatedUsd)
    } else {
      sorted.sort((a, b) => new Date(b.lastTradeDate).getTime() - new Date(a.lastTradeDate).getTime())
    }

    return sorted.slice(0, 20)
  }, [investments, sortBy])

  if (hotStocks.length === 0) {
    return (
      <div className="text-center py-12">
        <Flame className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No stock data yet</p>
        <p className="text-xs text-muted-foreground mt-1">Scan to load the latest 90 days of trades</p>
      </div>
    )
  }

  return (
    <div>
      {/* Sort controls */}
      <div className="flex items-center gap-1 mb-4">
        <span className="text-[10px] text-muted-foreground mr-1">Sort by:</span>
        {([
          { key: 'buyers' as const, label: 'Most Buyers' },
          { key: 'volume' as const, label: 'Volume' },
          { key: 'recent' as const, label: 'Recent' },
        ]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setSortBy(key)}
            className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
              sortBy === key
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Stock list */}
      <div className="space-y-1.5">
        {hotStocks.map((stock, i) => {
          const isExpanded = expandedTicker === stock.ticker
          const sentimentColor = stock.netSentiment > 0 ? 'text-green-500' : stock.netSentiment < 0 ? 'text-red-500' : 'text-muted-foreground'
          const SentimentIcon = stock.netSentiment > 0 ? ArrowUpRight : stock.netSentiment < 0 ? ArrowDownRight : Minus

          return (
            <div key={stock.ticker}>
              <button
                onClick={() => setExpandedTicker(isExpanded ? null : stock.ticker)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border bg-card hover:border-primary/20 transition-colors text-left"
              >
                {/* Rank */}
                <span className={`text-xs font-bold w-5 text-center flex-shrink-0 ${
                  i < 3 ? 'text-amber-500' : 'text-muted-foreground'
                }`}>
                  {i + 1}
                </span>

                {/* Ticker + name */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-card-foreground">{stock.ticker}</span>
                    <SentimentIcon className={`w-3.5 h-3.5 ${sentimentColor}`} />
                  </div>
                  {stock.assetName !== stock.ticker && (
                    <p className="text-[10px] text-muted-foreground truncate">{stock.assetName}</p>
                  )}
                </div>

                {/* Buyers count */}
                <div className="text-right flex-shrink-0">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-green-500">{stock.uniqueBuyers.length}</span>
                    <span className="text-[10px] text-muted-foreground">buyers</span>
                  </div>
                  {stock.uniqueSellers.length > 0 && (
                    <div className="flex items-center gap-1 justify-end">
                      <span className="text-[10px] font-bold text-red-400">{stock.uniqueSellers.length}</span>
                      <span className="text-[10px] text-muted-foreground">sellers</span>
                    </div>
                  )}
                </div>

                {/* Volume */}
                {stock.totalEstimatedUsd > 0 && (
                  <span className="text-[10px] font-medium text-muted-foreground flex-shrink-0 w-16 text-right">
                    ${formatCompact(stock.totalEstimatedUsd)}
                  </span>
                )}

                {/* Expand */}
                {isExpanded ? (
                  <ChevronUp className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                )}
              </button>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="ml-8 mr-3 mt-1 mb-2 p-3 rounded-lg bg-muted/30 border border-border/50 space-y-2">
                  {/* Buyers */}
                  {stock.uniqueBuyers.length > 0 && (
                    <div>
                      <span className="text-[10px] font-semibold text-green-500 uppercase">Buyers ({stock.buyCount} trades)</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {stock.uniqueBuyers.map(name => (
                          <span key={name} className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-400">
                            {name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sellers */}
                  {stock.uniqueSellers.length > 0 && (
                    <div>
                      <span className="text-[10px] font-semibold text-red-400 uppercase">Sellers ({stock.sellCount} trades)</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {stock.uniqueSellers.map(name => (
                          <span key={name} className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400">
                            {name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent trades */}
                  <div>
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase">Recent trades</span>
                    <div className="space-y-1 mt-1">
                      {stock.trades.slice(0, 5).map((t, j) => (
                        <div key={j} className="flex items-center justify-between text-[10px]">
                          <span className="text-muted-foreground">
                            {t.family_member} — {t.action || 'Trade'}
                          </span>
                          <div className="flex items-center gap-2">
                            {t.estimated_amount_usd && (
                              <span className="text-muted-foreground">${formatCompact(t.estimated_amount_usd)}</span>
                            )}
                            <span className="text-muted-foreground/60">
                              {new Date(t.detected_at).toLocaleDateString()}
                            </span>
                            {t.source_url && (
                              <a href={t.source_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`
  return n.toLocaleString()
}
