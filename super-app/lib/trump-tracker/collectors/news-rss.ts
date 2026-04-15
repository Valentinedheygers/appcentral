import type { RawInvestment } from '../types'

const GOOGLE_NEWS_RSS = 'https://news.google.com/rss/search'

interface RSSItem {
  title: string
  link: string
  pubDate: string
  description: string
  source: string
}

export async function collectNewsRSS(config: Record<string, unknown>): Promise<RawInvestment[]> {
  const queries = (config.queries as string[]) || [
    'trump investment',
    'trump stock market',
    'trump crypto',
  ]
  const investments: RawInvestment[] = []

  for (const query of queries) {
    try {
      const url = `${GOOGLE_NEWS_RSS}?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`
      const res = await fetch(url)
      if (!res.ok) continue

      const xml = await res.text()
      const items = parseRSSItems(xml)

      // Only keep items from last 48 hours
      const cutoff = Date.now() - 48 * 60 * 60 * 1000

      for (const item of items) {
        const pubTime = new Date(item.pubDate).getTime()
        if (pubTime < cutoff) continue

        // Filter for investment-relevant articles
        if (!isInvestmentRelevant(item.title + ' ' + item.description)) continue

        const { assetName, assetType, familyMember, action } = extractInvestmentDetails(item.title)

        investments.push({
          asset_name: assetName,
          asset_type: assetType,
          family_member: familyMember,
          action,
          description: item.title,
          source_type: 'news',
          source_url: item.link,
          source_title: `${item.source}: ${item.title.slice(0, 100)}`,
          detected_at: item.pubDate,
        })
      }
    } catch {
      // Skip failed queries
    }
  }

  return investments
}

function parseRSSItems(xml: string): RSSItem[] {
  const items: RSSItem[] = []
  const itemRegex = /<item>([\s\S]*?)<\/item>/g
  let match

  while ((match = itemRegex.exec(xml)) !== null) {
    const content = match[1]
    items.push({
      title: extractTag(content, 'title'),
      link: extractTag(content, 'link'),
      pubDate: extractTag(content, 'pubDate'),
      description: extractTag(content, 'description'),
      source: extractTag(content, 'source'),
    })
  }
  return items
}

function extractTag(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`))
  return (match?.[1] || match?.[2] || '').trim()
}

function isInvestmentRelevant(text: string): boolean {
  const lower = text.toLowerCase()
  const investmentTerms = [
    'invest', 'stock', 'shares', 'equity', 'crypto', 'bitcoin', 'token',
    'buy', 'acquire', 'purchase', 'deal', 'fund', 'ipo', 'spac',
    'real estate', 'property', 'nft', 'djt', 'truth social',
    'world liberty', 'filing', 'disclosure', 'portfolio',
    'million', 'billion', '$',
  ]
  return investmentTerms.some(term => lower.includes(term))
}

function extractInvestmentDetails(title: string): {
  assetName: string
  assetType: RawInvestment['asset_type']
  familyMember: string
  action: string
} {
  const lower = title.toLowerCase()

  // Detect asset type
  let assetType: RawInvestment['asset_type'] = 'other'
  if (lower.includes('crypto') || lower.includes('bitcoin') || lower.includes('token') || lower.includes('$trump')) {
    assetType = 'crypto'
  } else if (lower.includes('stock') || lower.includes('shares') || lower.includes('djt') || lower.includes('equity')) {
    assetType = 'stock'
  } else if (lower.includes('real estate') || lower.includes('property') || lower.includes('tower') || lower.includes('hotel')) {
    assetType = 'real_estate'
  } else if (lower.includes('nft')) {
    assetType = 'nft'
  } else if (lower.includes('spac')) {
    assetType = 'spac'
  } else if (lower.includes('fund')) {
    assetType = 'fund'
  }

  // Detect family member
  let familyMember = 'Donald Trump'
  if (lower.includes('eric trump')) familyMember = 'Eric Trump'
  else if (lower.includes('donald trump jr') || lower.includes('don jr')) familyMember = 'Donald Trump Jr'
  else if (lower.includes('ivanka')) familyMember = 'Ivanka Trump'
  else if (lower.includes('kushner') || lower.includes('jared')) familyMember = 'Jared Kushner'
  else if (lower.includes('barron')) familyMember = 'Barron Trump'

  // Extract asset name — use first capitalized proper noun after investment keyword, or fallback
  const tickerMatch = title.match(/\b([A-Z]{2,5})\b/)
  const assetName = tickerMatch?.[1] || title.slice(0, 60)

  return {
    assetName,
    assetType,
    familyMember,
    action: 'News report',
  }
}
