/**
 * Fetches current stock prices from Yahoo Finance's free unofficial API.
 * No API key required.
 */

interface YahooQuoteResponse {
  chart?: {
    result?: Array<{
      meta?: {
        regularMarketPrice?: number
        previousClose?: number
        symbol?: string
        currency?: string
      }
    }>
    error?: { code: string; description: string }
  }
}

export interface PriceResult {
  ticker: string
  price: number | null
  previousClose: number | null
  source: 'yahoo' | 'simulated'
  error?: string
}

/**
 * Fetch a single ticker's current price.
 */
export async function fetchPrice(ticker: string): Promise<PriceResult> {
  // Clean ticker — Yahoo uses uppercase and doesn't want spaces
  const clean = ticker.trim().toUpperCase()
  if (!clean) return { ticker, price: null, previousClose: null, source: 'simulated', error: 'empty ticker' }

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(clean)}?interval=1d&range=1d`
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TrumpTracker/1.0)',
        Accept: 'application/json',
      },
    })

    if (!res.ok) {
      return { ticker: clean, price: null, previousClose: null, source: 'simulated', error: `HTTP ${res.status}` }
    }

    const data: YahooQuoteResponse = await res.json()
    const meta = data?.chart?.result?.[0]?.meta

    if (!meta || typeof meta.regularMarketPrice !== 'number') {
      return { ticker: clean, price: null, previousClose: null, source: 'simulated', error: 'no price in response' }
    }

    return {
      ticker: clean,
      price: meta.regularMarketPrice,
      previousClose: meta.previousClose ?? null,
      source: 'yahoo',
    }
  } catch (err) {
    return {
      ticker: clean,
      price: null,
      previousClose: null,
      source: 'simulated',
      error: err instanceof Error ? err.message : 'fetch failed',
    }
  }
}

/**
 * Fetch multiple ticker prices in parallel.
 */
export async function fetchPrices(tickers: string[]): Promise<Record<string, PriceResult>> {
  const results = await Promise.all(tickers.map(t => fetchPrice(t)))
  const map: Record<string, PriceResult> = {}
  for (const r of results) {
    map[r.ticker] = r
  }
  return map
}

/**
 * Fallback simulated price (used when Yahoo doesn't know the ticker,
 * or for non-standard tickers like "CIK", "UK", etc.)
 */
export function getSimulatedPrice(ticker: string): number {
  const prices: Record<string, number> = {
    DJT: 28.5, AAPL: 198.0, MSFT: 420.0, NVDA: 135.0,
    TSLA: 265.0, GOOGL: 165.0, META: 510.0, AMZN: 195.0,
    AI: 32.0, BTC: 85000, XRP: 2.1, TRUMP: 12.5,
    COIN: 225.0, MSTR: 340.0, SQ: 78.0, PLTR: 95.0,
    SOFI: 14.5, AMD: 155.0, INTC: 28.0, JPM: 245.0,
    GS: 520.0, MS: 105.0, BAC: 42.0, WFC: 70.0, C: 68.0,
    SPY: 585.0, QQQ: 510.0, IWM: 225.0, GLD: 255.0, SLV: 30.0,
  }
  if (prices[ticker]) return prices[ticker]
  // Deterministic hash-based price for unknown tickers
  let hash = 0
  for (let i = 0; i < ticker.length; i++) hash = (hash * 31 + ticker.charCodeAt(i)) & 0xffff
  return 20 + (hash % 400)
}

/**
 * Parse entry/exit/stop text like "$28-$30", "above 195", "+5%", "2.5% gain"
 * into a concrete price. Returns null if unparseable.
 */
export function parsePriceFromText(text: string | null | undefined, referencePrice: number): number | null {
  if (!text) return null

  // Handle percentage: "+5%", "2.5% gain", "-3%"
  const pctMatch = text.match(/([+-]?\d+(?:\.\d+)?)\s*%/)
  if (pctMatch) {
    const pct = parseFloat(pctMatch[1])
    return referencePrice * (1 + pct / 100)
  }

  // Handle explicit price: "$28.50", "28-30", "195"
  const priceMatch = text.match(/\$?(\d+(?:\.\d+)?)/g)
  if (priceMatch && priceMatch.length > 0) {
    const nums = priceMatch.map(p => parseFloat(p.replace('$', '')))
    // If range, take midpoint
    if (nums.length >= 2) return (nums[0] + nums[1]) / 2
    return nums[0]
  }

  return null
}
