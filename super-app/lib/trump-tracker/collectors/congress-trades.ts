import type { RawInvestment } from '../types'

// Congressional stock trades — scrapes Capitol Trades and Google News
// since the old S3 datasets (housestockwatcher, senatestockwatcher) are now 403

const CONGRESS_NEWS_QUERIES = [
  'congress stock trade disclosure 2026',
  'senator stock purchase sell filing',
  'representative stock trade STOCK act',
  'Nancy Pelosi stock trade',
  'congress insider trading disclosure',
]

const KNOWN_TOP_TRADERS = [
  { name: 'Nancy Pelosi', title: 'Rep.', party: 'D', state: 'CA' },
  { name: 'Dan Crenshaw', title: 'Rep.', party: 'R', state: 'TX' },
  { name: 'Tommy Tuberville', title: 'Sen.', party: 'R', state: 'AL' },
  { name: 'Mark Green', title: 'Rep.', party: 'R', state: 'TN' },
  { name: 'Josh Gottheimer', title: 'Rep.', party: 'D', state: 'NJ' },
  { name: 'Michael McCaul', title: 'Rep.', party: 'R', state: 'TX' },
  { name: 'Ro Khanna', title: 'Rep.', party: 'D', state: 'CA' },
  { name: 'John Curtis', title: 'Sen.', party: 'R', state: 'UT' },
  { name: 'Marjorie Taylor Greene', title: 'Rep.', party: 'R', state: 'GA' },
  { name: 'Tim Moore', title: 'Rep.', party: 'R', state: 'NC' },
]

export async function collectCongressTrades(config: Record<string, unknown>): Promise<RawInvestment[]> {
  const investments: RawInvestment[] = []
  const lookbackDays = (config.lookback_days as number) || 30

  // Strategy 1: Fetch news about specific top congress traders
  for (const trader of KNOWN_TOP_TRADERS) {
    try {
      const query = `"${trader.name}" stock trade OR purchase OR sold OR disclosure 2026`
      const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`

      const res = await fetch(url)
      if (!res.ok) continue

      const xml = await res.text()
      const items = parseRSSItems(xml)

      const cutoff = Date.now() - lookbackDays * 24 * 60 * 60 * 1000

      for (const item of items.slice(0, 3)) {
        const pubTime = new Date(item.pubDate).getTime()
        if (pubTime < cutoff) continue

        const combined = (item.title + ' ' + item.description).toLowerCase()

        // Must be about stock trading
        const isTradeRelated =
          combined.includes('stock') ||
          combined.includes('trade') ||
          combined.includes('purchase') ||
          combined.includes('sold') ||
          combined.includes('disclosure') ||
          combined.includes('filing')

        if (!isTradeRelated) continue

        // Extract ticker if mentioned
        const tickerMatch = item.title.match(/\b([A-Z]{2,5})\b/)
        const ticker = tickerMatch?.[1]

        // Detect buy/sell
        const isSell = combined.includes('sold') || combined.includes('sale') || combined.includes('sell')
        const action = isSell ? 'Sell' : 'Buy'

        // Extract dollar amount if mentioned
        const amountMatch = (item.title + ' ' + item.description).match(/\$([0-9,.]+)\s*(million|billion|k|M|B)?/i)
        let amount: number | undefined
        if (amountMatch) {
          amount = parseFloat(amountMatch[1].replace(/,/g, ''))
          const unit = (amountMatch[2] || '').toLowerCase()
          if (unit === 'million' || unit === 'm') amount *= 1_000_000
          else if (unit === 'billion' || unit === 'b') amount *= 1_000_000_000
          else if (unit === 'k') amount *= 1_000
        }

        investments.push({
          asset_name: ticker || extractAssetFromTitle(item.title),
          asset_ticker: ticker,
          asset_type: 'stock',
          family_member: `${trader.title} ${trader.name} (${trader.party})-${trader.state}`,
          entity_name: trader.title === 'Sen.' ? 'U.S. Senate' : 'U.S. House',
          action,
          estimated_amount_usd: amount,
          description: item.title,
          source_type: 'congress_disclosure',
          source_url: item.link,
          source_title: `Congress: ${trader.name} — ${item.title.slice(0, 60)}`,
          detected_at: item.pubDate,
        })
      }
    } catch {
      // Skip on error
    }
  }

  // Strategy 2: General congress trading news
  for (const query of CONGRESS_NEWS_QUERIES.slice(0, 2)) {
    try {
      const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`
      const res = await fetch(url)
      if (!res.ok) continue

      const xml = await res.text()
      const items = parseRSSItems(xml)

      const cutoff = Date.now() - lookbackDays * 24 * 60 * 60 * 1000

      for (const item of items.slice(0, 5)) {
        const pubTime = new Date(item.pubDate).getTime()
        if (pubTime < cutoff) continue

        const tickerMatch = item.title.match(/\b([A-Z]{2,5})\b/)

        // Detect which congress member from the title
        const member = detectCongressMember(item.title)

        investments.push({
          asset_name: tickerMatch?.[1] || extractAssetFromTitle(item.title),
          asset_ticker: tickerMatch?.[1],
          asset_type: 'stock',
          family_member: member,
          entity_name: 'U.S. Congress',
          action: 'Trade reported',
          description: item.title,
          source_type: 'congress_disclosure',
          source_url: item.link,
          source_title: `Congress: ${item.title.slice(0, 70)}`,
          detected_at: item.pubDate,
        })
      }
    } catch {
      // Skip
    }
  }

  return investments
}

function parseRSSItems(xml: string): { title: string; link: string; pubDate: string; description: string }[] {
  const items: { title: string; link: string; pubDate: string; description: string }[] = []
  const itemRegex = /<item>([\s\S]*?)<\/item>/g
  let match

  while ((match = itemRegex.exec(xml)) !== null) {
    const content = match[1]
    items.push({
      title: extractTag(content, 'title'),
      link: extractTag(content, 'link'),
      pubDate: extractTag(content, 'pubDate'),
      description: extractTag(content, 'description'),
    })
  }
  return items
}

function extractTag(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`))
  return (match?.[1] || match?.[2] || '').trim()
}

function extractAssetFromTitle(title: string): string {
  const tickerMatch = title.match(/\$([A-Z]{1,10})\b/)
  if (tickerMatch) return `$${tickerMatch[1]}`
  return title.slice(0, 60)
}

function detectCongressMember(title: string): string {
  const lower = title.toLowerCase()
  for (const t of KNOWN_TOP_TRADERS) {
    if (lower.includes(t.name.toLowerCase())) {
      return `${t.title} ${t.name} (${t.party})-${t.state}`
    }
  }
  // Try to extract "Sen./Rep. Name" pattern
  const senMatch = title.match(/Sen(?:ator)?\.?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/)
  if (senMatch) return `Sen. ${senMatch[1]}`
  const repMatch = title.match(/Rep(?:resentative)?\.?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/)
  if (repMatch) return `Rep. ${repMatch[1]}`
  return 'U.S. Congress Member'
}
