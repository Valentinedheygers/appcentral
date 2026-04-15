import { supabase } from '@/lib/supabase'
import Anthropic from '@anthropic-ai/sdk'

interface HotStock {
  ticker: string
  buyCount: number
  sellCount: number
  uniqueBuyers: number
  netSentiment: number
  totalUsd: number
  recentDate: string
}

export async function POST() {
  // 1. Load portfolio
  const { data: portfolios } = await supabase
    .from('tracker_portfolio')
    .select('*')
    .limit(1)

  if (!portfolios?.length) {
    return Response.json({ error: 'No portfolio found' }, { status: 404 })
  }

  const portfolio = portfolios[0]

  // 2. Load current holdings
  const { data: holdings } = await supabase
    .from('tracker_holdings')
    .select('*')
    .eq('portfolio_id', portfolio.id)

  // 3. Load last 90 days of tracked investments to analyze
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
  const { data: investments } = await supabase
    .from('trump_investments')
    .select('*')
    .gte('detected_at', ninetyDaysAgo)
    .order('detected_at', { ascending: false })
    .limit(500)

  if (!investments?.length) {
    return Response.json({ error: 'No investment data to analyze. Run a scan first.' }, { status: 400 })
  }

  // 4. Build Hot Stocks ranking
  const stockMap: Record<string, HotStock> = {}
  for (const inv of investments) {
    const ticker = inv.asset_ticker || inv.asset_name
    if (!ticker || ticker === '--' || ticker.length > 10) continue

    if (!stockMap[ticker]) {
      stockMap[ticker] = { ticker, buyCount: 0, sellCount: 0, uniqueBuyers: 0, netSentiment: 0, totalUsd: 0, recentDate: inv.detected_at }
    }
    const s = stockMap[ticker]
    const action = (inv.action || '').toLowerCase()
    const isSell = action.includes('sell') || action.includes('sale')

    if (isSell) { s.sellCount++ } else { s.buyCount++ }
    s.netSentiment = s.buyCount - s.sellCount
    s.totalUsd += inv.estimated_amount_usd || 0
    if (new Date(inv.detected_at) > new Date(s.recentDate)) s.recentDate = inv.detected_at
  }

  // Count unique buyers per ticker
  for (const inv of investments) {
    const ticker = inv.asset_ticker || inv.asset_name
    if (!stockMap[ticker]) continue
    // Simplified: just use buyCount as proxy
    stockMap[ticker].uniqueBuyers = stockMap[ticker].buyCount
  }

  const hotStocks = Object.values(stockMap)
    .filter(s => s.ticker.match(/^[A-Z]{1,5}$/)) // Only valid tickers
    .sort((a, b) => b.uniqueBuyers - a.uniqueBuyers)
    .slice(0, 15)

  // 5. Ask Claude to make investment decisions
  const currentHoldings = (holdings || []).map(h => ({
    ticker: h.ticker,
    shares: h.shares,
    avgPrice: h.avg_buy_price,
    currentValue: h.current_value || h.shares * h.avg_buy_price,
  }))

  const today = new Date().toISOString().slice(0, 10)
  const totalValue = portfolio.current_cash + (holdings || []).reduce((sum: number, h: Record<string, number>) => sum + (h.current_value || h.shares * h.avg_buy_price), 0)
  const weekReturn = ((totalValue - portfolio.initial_capital) / portfolio.initial_capital) * 100

  const prompt = `You are an aggressive portfolio manager. Your mission: grow a $50,000 portfolio by 10% per week by following the same stocks that Trump family and US Congress members are trading.

CURRENT PORTFOLIO STATE:
- Cash available: $${portfolio.current_cash.toLocaleString()}
- Total portfolio value: $${totalValue.toLocaleString()}
- Week performance: ${weekReturn > 0 ? '+' : ''}${weekReturn.toFixed(2)}%
- Target: +10% weekly
- Current holdings: ${currentHoldings.length > 0 ? JSON.stringify(currentHoldings) : 'None (all cash)'}

HOT STOCKS (ranked by insider conviction from Trump family + Congress trades):
${hotStocks.map((s, i) => `${i + 1}. ${s.ticker} — ${s.buyCount} buys, ${s.sellCount} sells, net sentiment: ${s.netSentiment > 0 ? '+' : ''}${s.netSentiment}, est volume: $${(s.totalUsd / 1000).toFixed(0)}k`).join('\n')}

TODAY'S DATE: ${today}

RULES:
- Allocate across 3-5 positions max (concentrated bets for 10% weekly target)
- Highest conviction stocks get largest allocation
- Never invest more than 40% of portfolio in one stock
- Keep 10% cash reserve minimum
- If a stock has more sellers than buyers, consider selling if held
- Be aggressive — this is a high-growth strategy

Return ONLY valid JSON array of trades to execute:
[
  { "action": "buy"|"sell", "ticker": "AAPL", "allocation_pct": 25, "conviction": "high"|"medium"|"low", "reason": "short explanation" }
]

If no good trades today, return empty array [].`

  let trades: { action: string; ticker: string; allocation_pct: number; conviction: string; reason: string }[] = []
  let aiCommentary = ''

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (apiKey && apiKey !== 'sk-ant-REPLACE_ME') {
    try {
      const client = new Anthropic({ apiKey })
      const msg = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      })
      const text = msg.content[0]?.type === 'text' ? msg.content[0].text : ''
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        trades = JSON.parse(jsonMatch[0])
      }
      // Extract any commentary outside the JSON
      aiCommentary = text.replace(/\[[\s\S]*\]/, '').trim().slice(0, 500)
    } catch {
      // Fallback to rule-based
    }
  }

  // Fallback: rule-based strategy if no AI key
  if (trades.length === 0) {
    const validStocks = hotStocks.filter(s => s.netSentiment > 0 && s.ticker.match(/^[A-Z]{2,5}$/))
    const topPicks = validStocks.slice(0, 4)
    const allocPerStock = Math.floor(80 / Math.max(topPicks.length, 1)) // 80% allocated, 20% cash

    trades = topPicks.map((stock, i) => ({
      action: 'buy',
      ticker: stock.ticker,
      allocation_pct: i === 0 ? allocPerStock + 10 : allocPerStock, // Extra to top pick
      conviction: i === 0 ? 'high' : i < 2 ? 'medium' : 'low',
      reason: `${stock.buyCount} insider buys, net sentiment +${stock.netSentiment}. Top pick from tracker signals.`,
    }))

    aiCommentary = `Rule-based allocation: Top ${topPicks.length} stocks by insider conviction. ${topPicks.map(s => s.ticker).join(', ')}.`
  }

  // 6. Execute trades
  const executedTrades: Record<string, unknown>[] = []
  let cashRemaining = portfolio.current_cash

  for (const trade of trades) {
    if (trade.action === 'buy' && cashRemaining > 0) {
      const allocAmount = Math.min(
        (trade.allocation_pct / 100) * totalValue,
        cashRemaining * 0.95 // Keep some buffer
      )
      if (allocAmount < 100) continue

      // Use a simulated price (we'd normally fetch real-time quotes)
      const simulatedPrice = getSimulatedPrice(trade.ticker)
      const shares = Math.floor(allocAmount / simulatedPrice)
      if (shares <= 0) continue

      const total = shares * simulatedPrice
      cashRemaining -= total

      // Upsert holding
      const existing = (holdings || []).find((h: Record<string, string>) => h.ticker === trade.ticker)
      if (existing) {
        const newShares = existing.shares + shares
        const newAvg = ((existing.shares * existing.avg_buy_price) + total) / newShares
        await supabase
          .from('tracker_holdings')
          .update({ shares: newShares, avg_buy_price: newAvg, current_price: simulatedPrice, current_value: newShares * simulatedPrice, last_updated: new Date().toISOString() })
          .eq('id', existing.id)
      } else {
        await supabase
          .from('tracker_holdings')
          .insert({ portfolio_id: portfolio.id, ticker: trade.ticker, asset_name: trade.ticker, shares, avg_buy_price: simulatedPrice, current_price: simulatedPrice, current_value: shares * simulatedPrice })
      }

      // Log trade
      await supabase.from('tracker_trades').insert({
        portfolio_id: portfolio.id,
        ticker: trade.ticker,
        asset_name: trade.ticker,
        action: 'buy',
        shares,
        price: simulatedPrice,
        total,
        reason: trade.reason,
        conviction: trade.conviction,
        source_signal: 'tracker_hot_stocks',
      })

      executedTrades.push({ action: 'buy', ticker: trade.ticker, shares, price: simulatedPrice, total: total.toFixed(2), conviction: trade.conviction, reason: trade.reason })
    }
  }

  // 7. Update portfolio cash
  await supabase
    .from('tracker_portfolio')
    .update({ current_cash: cashRemaining, updated_at: new Date().toISOString() })
    .eq('id', portfolio.id)

  // 8. Save daily snapshot
  const holdingsValue = totalValue - cashRemaining
  const dailyPnl = totalValue - portfolio.initial_capital
  const dailyPnlPct = (dailyPnl / portfolio.initial_capital) * 100

  await supabase.from('tracker_snapshots').upsert({
    portfolio_id: portfolio.id,
    date: today,
    total_value: cashRemaining + holdingsValue,
    cash: cashRemaining,
    holdings_value: holdingsValue,
    daily_pnl: dailyPnl,
    daily_pnl_pct: dailyPnlPct,
    cumulative_pnl: dailyPnl,
    cumulative_pnl_pct: dailyPnlPct,
    num_holdings: executedTrades.length + (holdings || []).length,
    top_holding: executedTrades[0]?.ticker as string || (holdings || [])[0]?.ticker,
    ai_commentary: aiCommentary,
  }, { onConflict: 'portfolio_id,date' })

  return Response.json({
    success: true,
    date: today,
    portfolio: {
      cash: cashRemaining.toFixed(2),
      totalValue: (cashRemaining + holdingsValue).toFixed(2),
      pnl: dailyPnl.toFixed(2),
      pnlPct: dailyPnlPct.toFixed(2) + '%',
    },
    trades: executedTrades,
    commentary: aiCommentary,
    hotStocksAnalyzed: hotStocks.length,
  })
}

function getSimulatedPrice(ticker: string): number {
  // Simulated prices for common tickers
  // In production, you'd call a real-time quote API (Yahoo Finance, Finnhub, etc.)
  const prices: Record<string, number> = {
    'DJT': 28.50, 'AAPL': 198.00, 'MSFT': 420.00, 'NVDA': 135.00,
    'TSLA': 265.00, 'GOOGL': 165.00, 'META': 510.00, 'AMZN': 195.00,
    'AI': 32.00, 'BTC': 85000, 'XRP': 2.10, 'TRUMP': 12.50,
    'CIK': 15.00, 'NYSE': 95.00, 'INC': 22.00, 'COIN': 225.00,
    'MSTR': 340.00, 'SQ': 78.00, 'PLTR': 95.00, 'SOFI': 14.50,
    'AMD': 155.00, 'INTC': 28.00, 'JPM': 245.00, 'GS': 520.00,
    'MS': 105.00, 'BAC': 42.00, 'WFC': 70.00, 'C': 68.00,
  }
  return prices[ticker] || (10 + Math.random() * 200) // Random price for unknown tickers
}
