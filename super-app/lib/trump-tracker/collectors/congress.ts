import type { RawInvestment } from '../types'

// Congressional financial disclosure search
// Note: These government sites are fragile — this collector is best-effort

export async function collectCongressDisclosures(config: Record<string, unknown>): Promise<RawInvestment[]> {
  const searchNames = (config.search_names as string[]) || ['Trump']
  const investments: RawInvestment[] = []

  // Senate Electronic Financial Disclosures
  for (const name of searchNames) {
    try {
      const senateResults = await searchSenateDisclosures(name)
      investments.push(...senateResults)
    } catch {
      // Government sites often block automated access
    }
  }

  return investments
}

async function searchSenateDisclosures(name: string): Promise<RawInvestment[]> {
  const investments: RawInvestment[] = []

  try {
    // The Senate EFD search requires specific form data
    const res = await fetch('https://efdsearch.senate.gov/search/report/data/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (compatible; TrumpTracker/1.0)',
      },
      body: new URLSearchParams({
        first_name: '',
        last_name: name,
        filer_type: '',
        report_type: '',
        submitted_start_date: getDateDaysAgo(30),
        submitted_end_date: new Date().toISOString().slice(0, 10),
      }),
    })

    if (!res.ok) return []

    const data = await res.json()

    // Senate returns array of arrays: [first_name, last_name, office, report_type, date, url]
    if (Array.isArray(data?.data)) {
      for (const row of data.data) {
        if (!Array.isArray(row) || row.length < 6) continue

        const [firstName, lastName, office, reportType, date] = row
        const fullName = `${firstName} ${lastName}`.trim()

        // Extract URL from HTML if present
        const urlMatch = String(row[5] || row[4]).match(/href="([^"]+)"/)
        const url = urlMatch ? `https://efdsearch.senate.gov${urlMatch[1]}` : undefined

        investments.push({
          asset_name: `Congressional Disclosure: ${reportType}`,
          asset_type: 'other',
          family_member: inferTrumpFamilyMember(fullName),
          entity_name: office,
          action: 'disclosure',
          description: `${reportType} filed by ${fullName} (${office})`,
          source_type: 'congress_disclosure',
          source_url: url,
          source_title: `Senate Disclosure: ${fullName} — ${reportType}`,
          detected_at: date ? new Date(date).toISOString() : new Date().toISOString(),
        })
      }
    }
  } catch {
    // Expected to fail often — government sites block bots
  }

  return investments
}

function inferTrumpFamilyMember(name: string): string {
  const lower = name.toLowerCase()
  if (lower.includes('eric')) return 'Eric Trump'
  if (lower.includes('donald') && lower.includes('jr')) return 'Donald Trump Jr'
  if (lower.includes('ivanka')) return 'Ivanka Trump'
  if (lower.includes('kushner') || lower.includes('jared')) return 'Jared Kushner'
  return 'Donald Trump'
}

function getDateDaysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`
}
