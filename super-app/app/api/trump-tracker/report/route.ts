import { supabase } from '@/lib/supabase'

export async function POST() {
  // Load portfolio
  const { data: portfolios } = await supabase
    .from('tracker_portfolio')
    .select('*')
    .limit(1)

  if (!portfolios?.length) {
    return Response.json({ error: 'No portfolio found' }, { status: 404 })
  }

  const portfolio = portfolios[0]

  // Load holdings
  const { data: holdings } = await supabase
    .from('tracker_holdings')
    .select('*')
    .eq('portfolio_id', portfolio.id)
    .order('current_value', { ascending: false })

  // Load today's trades
  const today = new Date().toISOString().slice(0, 10)
  const { data: todayTrades } = await supabase
    .from('tracker_trades')
    .select('*')
    .eq('portfolio_id', portfolio.id)
    .gte('executed_at', today + 'T00:00:00')
    .order('executed_at', { ascending: false })

  // Load recent snapshots for trend
  const { data: snapshots } = await supabase
    .from('tracker_snapshots')
    .select('*')
    .eq('portfolio_id', portfolio.id)
    .order('date', { ascending: false })
    .limit(7)

  // Calculate stats
  const holdingsValue = (holdings || []).reduce((sum: number, h: Record<string, number>) =>
    sum + (h.current_value || h.shares * h.avg_buy_price), 0)
  const totalValue = portfolio.current_cash + holdingsValue
  const totalPnl = totalValue - portfolio.initial_capital
  const totalPnlPct = (totalPnl / portfolio.initial_capital) * 100
  const weeklyTarget = portfolio.initial_capital * portfolio.target_weekly_return
  const progressPct = (totalPnl / weeklyTarget) * 100

  // Build report
  const holdingsSection = (holdings || []).length > 0
    ? (holdings || []).map((h: Record<string, number | string>) => {
        const value = (h.current_value as number) || (h.shares as number) * (h.avg_buy_price as number)
        const pct = ((value / totalValue) * 100).toFixed(1)
        return `  • ${h.ticker}: ${h.shares} shares @ $${(h.avg_buy_price as number).toFixed(2)} = $${value.toFixed(2)} (${pct}% of portfolio)`
      }).join('\n')
    : '  No holdings yet — all cash'

  const tradesSection = (todayTrades || []).length > 0
    ? (todayTrades || []).map((t: Record<string, number | string>) =>
        `  ${(t.action as string).toUpperCase()} ${t.ticker} — ${t.shares} shares @ $${(t.price as number).toFixed(2)} = $${(t.total as number).toFixed(2)}\n    Conviction: ${t.conviction} | Reason: ${t.reason}`
      ).join('\n\n')
    : '  No trades executed today'

  const trendLine = (snapshots || []).reverse().map((s: Record<string, number | string>) =>
    `  ${s.date}: $${(s.total_value as number).toFixed(2)} (${(s.cumulative_pnl_pct as number) >= 0 ? '+' : ''}${(s.cumulative_pnl_pct as number).toFixed(2)}%)`
  ).join('\n')

  const subject = `📊 Portfolio Report — $${totalValue.toFixed(0)} (${totalPnlPct >= 0 ? '+' : ''}${totalPnlPct.toFixed(2)}%) — ${today}`

  const body = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  DAILY PORTFOLIO REPORT — ${today}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 PORTFOLIO SUMMARY
  Starting capital: $${portfolio.initial_capital.toLocaleString()}
  Current value:    $${totalValue.toFixed(2)}
  Cash available:   $${portfolio.current_cash.toFixed(2)}
  Holdings value:   $${holdingsValue.toFixed(2)}

📈 PERFORMANCE
  Total P&L:        ${totalPnl >= 0 ? '+' : ''}$${totalPnl.toFixed(2)} (${totalPnlPct >= 0 ? '+' : ''}${totalPnlPct.toFixed(2)}%)
  Weekly target:    +10% ($${weeklyTarget.toFixed(0)})
  Progress:         ${progressPct.toFixed(0)}% of weekly target

📦 CURRENT HOLDINGS
${holdingsSection}

⚡ TODAY'S TRADES
${tradesSection}

📊 7-DAY TREND
${trendLine || '  No historical data yet'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Strategy: Follow Trump family + Congress insider trades
AI-managed portfolio targeting +10% weekly growth
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`.trim()

  return Response.json({ subject, body, date: today, stats: { totalValue, totalPnl, totalPnlPct, progressPct } })
}
