import type { RawInvestment } from '../types'

const EDGAR_SEARCH_URL = 'https://efts.sec.gov/LATEST/search-index'
const USER_AGENT = 'TrumpTracker/1.0 (contact@example.com)'

interface EdgarHit {
  _source: {
    file_date: string
    display_names: string[]
    root_forms: string[]
    file_description?: string
    adsh: string
    ciks: string[]
    biz_locations?: string[]
    items?: string[]
  }
  _id: string
}

export async function collectSECFilings(config: Record<string, unknown>): Promise<RawInvestment[]> {
  const searchTerms = (config.search_terms as string[]) || ['trump media', 'DJT', 'world liberty financial']
  const investments: RawInvestment[] = []

  // Build a combined OR query for all terms
  const query = searchTerms.map(t => `"${t}"`).join(' OR ')

  try {
    const params = new URLSearchParams({
      q: query,
      dateRange: 'custom',
      startdt: getDateDaysAgo(90),
      enddt: new Date().toISOString().slice(0, 10),
      from: '0',
      size: '50',
    })

    const res = await fetch(`${EDGAR_SEARCH_URL}?${params}`, {
      headers: { 'User-Agent': USER_AGENT },
    })

    if (!res.ok) return []

    const data = await res.json()
    const hits: EdgarHit[] = data?.hits?.hits || []

    for (const hit of hits) {
      const src = hit._source
      const formType = src.root_forms?.[0] || 'Filing'
      const displayName = src.display_names?.[0] || ''
      const adsh = src.adsh || ''

      // Build SEC URL from ADSH
      const filingUrl = adsh
        ? `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${src.ciks?.[0]}&type=${formType}&dateb=&owner=include&count=10`
        : undefined

      // Extract ticker from display name if present
      const tickerMatch = displayName.match(/\(([A-Z]{1,5}),?\s/)
      const ticker = tickerMatch?.[1]

      // Determine what kind of filing this is
      const isInsiderForm = ['4', '3', '5', '144'].includes(formType)
      const is13F = formType.startsWith('13F')
      const isSchedule13 = formType.includes('13D') || formType.includes('13G')

      let action = `SEC ${formType}`
      if (isInsiderForm) action = `Insider trade (Form ${formType})`
      else if (is13F) action = `Institutional holdings (13F)`
      else if (isSchedule13) action = `Major ownership (${formType})`

      investments.push({
        asset_name: ticker || cleanDisplayName(displayName),
        asset_ticker: ticker,
        asset_type: 'stock',
        family_member: inferFamilyMember(displayName),
        entity_name: cleanDisplayName(displayName),
        action,
        description: `${formType} filing by ${cleanDisplayName(displayName)} — ${src.file_description || 'See filing'}`,
        source_type: 'sec_filing',
        source_url: filingUrl,
        source_title: `SEC ${formType}: ${cleanDisplayName(displayName)}`,
        detected_at: src.file_date || new Date().toISOString(),
      })
    }
  } catch {
    // Skip on error
  }

  return investments
}

function cleanDisplayName(name: string): string {
  // Remove CIK info: "Trump Media & Technology Group Corp.  (DJT, DJTWW)  (CIK 0001849635)"
  return name.replace(/\s*\(CIK\s+\d+\)\s*/g, '').replace(/\s+/g, ' ').trim()
}

function inferFamilyMember(text: string): string {
  const lower = text.toLowerCase()
  if (lower.includes('nunes')) return 'Devin Nunes (Trump Media CEO)'
  if (lower.includes('eric trump')) return 'Eric Trump'
  if (lower.includes('donald') && lower.includes('jr')) return 'Donald Trump Jr'
  if (lower.includes('ivanka')) return 'Ivanka Trump'
  if (lower.includes('kushner') || lower.includes('jared')) return 'Jared Kushner'
  if (lower.includes('trump media') || lower.includes('djt')) return 'Trump Media (DJT)'
  if (lower.includes('world liberty')) return 'World Liberty Financial'
  return 'Trump-related entity'
}

function getDateDaysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}
