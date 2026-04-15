import { supabaseAny as supabase } from '@/lib/supabase'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const SYSTEM_PROMPT = `You are a highly disciplined macro trader with 50 years of top-tier performance across equities, commodities, and geopolitical-driven markets.

You base your decisions on:
- US political dynamics (Congress decisions, regulatory shifts, fiscal policy)
- Influence networks (including high-profile business and political families like the Trump family)
- Market sentiment vs. real capital flows
- Historical analogs and pattern recognition

Your objective is to identify FIVE high-conviction trade ideas for the coming week that have a realistic probability of generating consistent returns (target ~2% weekly per trade, with controlled risk).

For each of the 5 trades, provide:
- asset (full name)
- ticker (stock/ETF symbol)
- asset_type (stock|etf|commodity|currency|crypto|index)
- direction (long or short)
- conviction (high|medium|low)
- rationale (2-3 sentences: what is mispriced and why now)
- catalysts (political/economic/narrative triggers)
- entry_zone (specific price range or "current market")
- exit_strategy (profit-taking target as a price or %)
- stop_loss (specific price or %)
- risks (what invalidates the thesis)
- target_return (expected % return for the week)
- source_signals (which insider trades or political events from the data support this)

Constraints:
- Avoid speculation without data-backed reasoning
- Prioritize asymmetric risk/reward
- Be concise, practical, execution-focused
- No hype, no vague predictions
- Use the insider trade data provided as your primary signal source
- Each trade must have a distinct thesis (no duplicates)

Return ONLY valid JSON with this exact structure:
{
  "tips": [
    {
      "rank": 1,
      "asset": "...",
      "ticker": "...",
      "asset_type": "...",
      "direction": "long",
      "conviction": "high",
      "rationale": "...",
      "catalysts": "...",
      "entry_zone": "...",
      "exit_strategy": "...",
      "stop_loss": "...",
      "risks": "...",
      "target_return": "+2.5%",
      "source_signals": "..."
    }
  ]
}`

interface Tip {
  rank: number
  asset: string
  ticker?: string
  asset_type?: string
  direction: string
  conviction?: string
  rationale: string
  catalysts?: string
  entry_zone?: string
  exit_strategy?: string
  stop_loss?: string
  risks?: string
  target_return?: string
  source_signals?: string
}

export async function POST(request: Request) {
  let bodyApiKey: string | undefined
  try {
    const body = await request.json()
    bodyApiKey = body?.apiKey
  } catch {
    // no body is fine
  }

  // 1. Load last 90 days of tracked investments
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
  const { data: investments } = await supabase
    .from('trump_investments')
    .select('*')
    .gte('detected_at', ninetyDaysAgo)
    .order('detected_at', { ascending: false })
    .limit(400)

  if (!investments?.length) {
    return Response.json({ error: 'No data to analyze. Run a scan first.' }, { status: 400 })
  }

  // 2. Build aggregated hot stocks summary for the prompt
  interface StockAgg {
    ticker: string
    buyers: Set<string>
    sellers: Set<string>
    buyCount: number
    sellCount: number
    totalUsd: number
    mostRecent: string
    trumpRelated: boolean
    congressRelated: boolean
  }
  const stockMap: Record<string, StockAgg> = {}

  for (const inv of investments as Array<{
    asset_ticker?: string
    asset_name: string
    family_member: string
    action?: string
    estimated_amount_usd?: number
    detected_at: string
  }>) {
    const ticker = inv.asset_ticker || inv.asset_name
    if (!ticker || ticker === '--' || ticker.length > 15) continue

    if (!stockMap[ticker]) {
      stockMap[ticker] = {
        ticker,
        buyers: new Set(),
        sellers: new Set(),
        buyCount: 0,
        sellCount: 0,
        totalUsd: 0,
        mostRecent: inv.detected_at,
        trumpRelated: false,
        congressRelated: false,
      }
    }

    const s = stockMap[ticker]
    const action = (inv.action || '').toLowerCase()
    const isSell = action.includes('sell') || action.includes('sale')

    if (isSell) {
      s.sellCount++
      s.sellers.add(inv.family_member)
    } else {
      s.buyCount++
      s.buyers.add(inv.family_member)
    }

    s.totalUsd += inv.estimated_amount_usd || 0
    if (new Date(inv.detected_at) > new Date(s.mostRecent)) s.mostRecent = inv.detected_at
    if (inv.family_member.startsWith('Rep.') || inv.family_member.startsWith('Sen.')) s.congressRelated = true
    else s.trumpRelated = true
  }

  const topStocks = Object.values(stockMap)
    .filter(s => s.ticker.match(/^[A-Z]{1,6}$/))
    .sort((a, b) => (b.buyers.size + b.buyCount) - (a.buyers.size + a.buyCount))
    .slice(0, 20)

  const today = new Date().toISOString().slice(0, 10)
  const weekOf = new Date()
  weekOf.setDate(weekOf.getDate() - weekOf.getDay() + 1) // Monday of current week
  const weekOfStr = weekOf.toISOString().slice(0, 10)

  // 3. Build user prompt with the data
  const dataContext = topStocks.map((s, i) =>
    `${i + 1}. ${s.ticker} — Buyers: ${s.buyers.size} unique (${s.buyCount} trades), Sellers: ${s.sellers.size} (${s.sellCount} trades), Volume: $${(s.totalUsd / 1000).toFixed(0)}k, Last: ${new Date(s.mostRecent).toLocaleDateString()}, ${s.trumpRelated ? 'TRUMP-linked' : ''}${s.congressRelated ? ' CONGRESS-linked' : ''}`
  ).join('\n')

  const userPrompt = `DATE: ${today}
WEEK OF: ${weekOfStr}

INSIDER TRADING DATA (last 90 days, ranked by unique buyers):
${dataContext}

RECENT POLITICAL CONTEXT:
- Trump administration in full execution mode (tariffs, deregulation, crypto-friendly)
- Congressional trading activity elevated
- Trump family business interests: DJT (Trump Media), World Liberty Financial (crypto), $TRUMP memecoin

Generate your 5 highest-conviction trade ideas for the week starting ${weekOfStr}. Base them on the insider signals above plus your macro expertise. Return ONLY the JSON.`

  const apiKey = bodyApiKey || process.env.ANTHROPIC_API_KEY
  if (!apiKey || apiKey === 'sk-ant-REPLACE_ME') {
    return Response.json({ error: 'Anthropic API key missing. Paste your key in the field above to generate tips.' }, { status: 401 })
  }

  let tips: Tip[] = []

  try {
    const client = new Anthropic({ apiKey })
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const text = msg.content[0]?.type === 'text' ? msg.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return Response.json({ error: 'AI response not parseable', raw: text.slice(0, 500) }, { status: 500 })
    }

    const parsed = JSON.parse(jsonMatch[0])
    tips = (parsed.tips || []).slice(0, 5)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return Response.json({ error: 'AI call failed', detail: message }, { status: 500 })
  }

  if (tips.length === 0) {
    return Response.json({ error: 'No tips generated' }, { status: 500 })
  }

  // 4. Delete any existing tips for this week and insert new ones
  await supabase.from('tracker_tips').delete().eq('week_of', weekOfStr)

  const rowsToInsert = tips.map((tip, i) => ({
    week_of: weekOfStr,
    rank: tip.rank || i + 1,
    asset: tip.asset,
    ticker: tip.ticker || null,
    asset_type: tip.asset_type || null,
    direction: tip.direction,
    conviction: tip.conviction || null,
    rationale: tip.rationale,
    catalysts: tip.catalysts || null,
    entry_zone: tip.entry_zone || null,
    exit_strategy: tip.exit_strategy || null,
    stop_loss: tip.stop_loss || null,
    risks: tip.risks || null,
    target_return: tip.target_return || null,
    source_signals: tip.source_signals || null,
  }))

  const { error: insertError } = await supabase.from('tracker_tips').insert(rowsToInsert)

  if (insertError) {
    return Response.json({ error: 'Failed to save tips', detail: insertError.message }, { status: 500 })
  }

  return Response.json({
    success: true,
    week_of: weekOfStr,
    generated_at: new Date().toISOString(),
    tips: rowsToInsert,
    signals_analyzed: topStocks.length,
  })
}
