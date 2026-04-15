import type { RawInvestment } from '../types'

// Social media monitoring — uses news aggregation as a proxy
// since Truth Social and X don't have reliable free APIs

export async function collectSocialMedia(config: Record<string, unknown>): Promise<RawInvestment[]> {
  const keywords = (config.keywords as string[]) || [
    'invest', 'stock', 'buy', 'crypto', 'DJT',
  ]
  const investments: RawInvestment[] = []

  // Strategy: Search Google News for Trump social media posts about investments
  // These get reported by media within hours
  try {
    const query = `trump truth social (${keywords.slice(0, 5).join(' OR ')})`
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en&when=2d`

    const res = await fetch(url)
    if (!res.ok) return []

    const xml = await res.text()
    const items = parseRSSItems(xml)

    const cutoff = Date.now() - 48 * 60 * 60 * 1000

    for (const item of items.slice(0, 10)) {
      const pubTime = new Date(item.pubDate).getTime()
      if (pubTime < cutoff) continue

      // Must mention Truth Social or Trump's social media post
      const combined = (item.title + ' ' + item.description).toLowerCase()
      const isSocialMediaReport =
        combined.includes('truth social') ||
        combined.includes('posted') ||
        combined.includes('tweeted') ||
        combined.includes('announced on')

      if (!isSocialMediaReport) continue

      // Must also mention something financial
      const isFinancial = keywords.some(kw => combined.includes(kw.toLowerCase()))
      if (!isFinancial) continue

      investments.push({
        asset_name: extractAssetFromTitle(item.title),
        asset_type: detectAssetType(combined),
        family_member: detectFamilyMember(combined),
        action: 'Social media mention',
        description: item.title,
        source_type: 'social_media',
        source_url: item.link,
        source_title: `Social: ${item.title.slice(0, 80)}`,
        detected_at: item.pubDate,
      })
    }
  } catch {
    // Expected — RSS may be unavailable
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

  const djt = title.match(/\bDJT\b/)
  if (djt) return 'DJT (Trump Media)'

  return title.slice(0, 60)
}

function detectAssetType(text: string): RawInvestment['asset_type'] {
  if (text.includes('crypto') || text.includes('bitcoin') || text.includes('token') || text.includes('$trump')) return 'crypto'
  if (text.includes('stock') || text.includes('djt') || text.includes('shares')) return 'stock'
  if (text.includes('real estate') || text.includes('property')) return 'real_estate'
  if (text.includes('nft')) return 'nft'
  return 'other'
}

function detectFamilyMember(text: string): string {
  if (text.includes('eric trump')) return 'Eric Trump'
  if (text.includes('donald trump jr') || text.includes('don jr')) return 'Donald Trump Jr'
  if (text.includes('ivanka')) return 'Ivanka Trump'
  if (text.includes('kushner')) return 'Jared Kushner'
  return 'Donald Trump'
}
