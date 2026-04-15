import { supabaseAny as supabase } from '@/lib/supabase'
import { fetchPrices, getSimulatedPrice, parsePriceFromText } from '@/lib/trump-tracker/price-fetcher'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

interface TipRow {
  id: string
  week_of: string
  rank: number
  asset: string
  ticker: string | null
  asset_type: string | null
  direction: string
  conviction: string | null
  rationale: string
  entry_zone: string | null
  exit_strategy: string | null
  stop_loss: string | null
  target_return: string | null
}

interface PositionRow {
  id: string
  tip_id: string | null
  ticker: string
  direction: string
  entry_price: number
  current_price: number | null
  target_price: number | null
  stop_loss_price: number | null
  status: string
  entry_date: string
}

/**
 * Market-close snapshot:
 * 1. For each tip of the current week, ensure a position exists (create if not)
 * 2. Fetch live prices for all open positions
 * 3. Recalculate P&L
 * 4. Auto-close positions that hit their target or stop-loss
 * 5. Save a daily history row per position
 */
export async function POST() {
  const today = new Date().toISOString().slice(0, 10)

  // ---- STEP 1: Convert this week's tips into positions ----
  const thisMonday = new Date()
  thisMonday.setDate(thisMonday.getDate() - thisMonday.getDay() + 1)
  const weekOfStr = thisMonday.toISOString().slice(0, 10)

  const { data: tipsData } = await supabase
    .from('tracker_tips')
    .select('*')
    .eq('week_of', weekOfStr)
    .order('rank', { ascending: true })

  const tips = (tipsData || []) as TipRow[]
  let newPositions = 0

  for (const tip of tips) {
    const ticker = (tip.ticker || tip.asset).trim().toUpperCase()
    if (!ticker) continue

    // Check if a position already exists for this tip
    const { data: existing } = await supabase
      .from('tracker_positions')
      .select('id')
      .eq('tip_id', tip.id)
      .maybeSingle()

    if (existing) continue

    // Fetch entry price (live or simulated)
    const priceResult = await fetchPrices([ticker])
    const liveEntry = priceResult[ticker]?.price
    const entryPrice = liveEntry ?? getSimulatedPrice(ticker)

    // Parse target and stop-loss from text
    const targetPrice = parsePriceFromText(tip.exit_strategy, entryPrice)
    const stopLossPrice = parsePriceFromText(tip.stop_loss, entryPrice)
    const targetReturnPct = tip.target_return
      ? parseFloat(tip.target_return.replace(/[^\d.-]/g, ''))
      : null

    const { error } = await supabase.from('tracker_positions').insert({
      tip_id: tip.id,
      ticker,
      asset: tip.asset,
      asset_type: tip.asset_type,
      direction: tip.direction,
      conviction: tip.conviction,
      rank: tip.rank,
      week_of: tip.week_of,
      entry_date: today,
      entry_price: entryPrice,
      entry_zone: tip.entry_zone,
      current_price: entryPrice,
      last_snapshot_at: new Date().toISOString(),
      target_price: targetPrice,
      stop_loss_price: stopLossPrice,
      target_return_pct: targetReturnPct,
      rationale: tip.rationale,
      status: 'open',
      pnl: 0,
      pnl_pct: 0,
    })

    if (!error) newPositions++
  }

  // ---- STEP 2: Update all open positions with live prices ----
  const { data: openData } = await supabase
    .from('tracker_positions')
    .select('*')
    .eq('status', 'open')

  const openPositions = (openData || []) as PositionRow[]

  if (openPositions.length === 0) {
    return Response.json({
      success: true,
      date: today,
      week_of: weekOfStr,
      newPositions,
      updated: 0,
      closed: 0,
      openCount: 0,
    })
  }

  // Batch fetch all prices in parallel
  const tickers = Array.from(new Set(openPositions.map(p => p.ticker)))
  const prices = await fetchPrices(tickers)

  let updated = 0
  let closed = 0

  for (const pos of openPositions) {
    const priceResult = prices[pos.ticker]
    const currentPrice = priceResult?.price ?? getSimulatedPrice(pos.ticker)

    // Compute P&L — direction-aware
    const isLong = pos.direction.toLowerCase() === 'long'
    const priceDelta = currentPrice - pos.entry_price
    const pnl = isLong ? priceDelta : -priceDelta
    const pnlPct = (pnl / pos.entry_price) * 100

    // Check if target or stop-loss hit
    let newStatus = pos.status
    let closeReason: string | null = null
    let closedDate: string | null = null

    if (pos.target_price) {
      const targetHit = isLong
        ? currentPrice >= pos.target_price
        : currentPrice <= pos.target_price
      if (targetHit) {
        newStatus = 'target_hit'
        closeReason = `Target $${pos.target_price.toFixed(2)} hit at $${currentPrice.toFixed(2)}`
        closedDate = today
      }
    }

    if (newStatus === 'open' && pos.stop_loss_price) {
      const stopHit = isLong
        ? currentPrice <= pos.stop_loss_price
        : currentPrice >= pos.stop_loss_price
      if (stopHit) {
        newStatus = 'stopped_out'
        closeReason = `Stop-loss $${pos.stop_loss_price.toFixed(2)} triggered at $${currentPrice.toFixed(2)}`
        closedDate = today
      }
    }

    // Update the position
    const updateData: Record<string, unknown> = {
      current_price: currentPrice,
      last_snapshot_at: new Date().toISOString(),
      pnl,
      pnl_pct: pnlPct,
      updated_at: new Date().toISOString(),
    }
    if (newStatus !== 'open') {
      updateData.status = newStatus
      updateData.closed_date = closedDate
      updateData.close_price = currentPrice
      updateData.close_reason = closeReason
      closed++
    } else {
      updated++
    }

    await supabase.from('tracker_positions').update(updateData).eq('id', pos.id)

    // Save daily history row (upsert on position_id + date)
    await supabase.from('tracker_position_history').upsert(
      {
        position_id: pos.id,
        date: today,
        price: currentPrice,
        pnl,
        pnl_pct: pnlPct,
      },
      { onConflict: 'position_id,date' }
    )
  }

  return Response.json({
    success: true,
    date: today,
    week_of: weekOfStr,
    newPositions,
    updated,
    closed,
    openCount: updated,
    pricesSource: Object.values(prices).filter(p => p.source === 'yahoo').length + ' live / ' + Object.values(prices).filter(p => p.source === 'simulated').length + ' simulated',
  })
}
