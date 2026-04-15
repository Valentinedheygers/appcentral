import { supabase as supabaseClient } from '@/lib/supabase'
import { generateFingerprint } from '@/lib/trump-tracker/dedup'
import { collectSECFilings } from '@/lib/trump-tracker/collectors/sec-edgar'
import { collectNewsRSS } from '@/lib/trump-tracker/collectors/news-rss'
import { collectCryptoWallets } from '@/lib/trump-tracker/collectors/crypto-wallets'
import { collectCongressDisclosures } from '@/lib/trump-tracker/collectors/congress'
import { collectSocialMedia } from '@/lib/trump-tracker/collectors/social-media'
import { collectCongressTrades } from '@/lib/trump-tracker/collectors/congress-trades'
import type { RawInvestment, CollectorResult } from '@/lib/trump-tracker/types'

const COLLECTORS: Record<string, (config: Record<string, unknown>) => Promise<RawInvestment[]>> = {
  sec_edgar: collectSECFilings,
  news_rss: collectNewsRSS,
  crypto_eth: collectCryptoWallets,
  crypto_sol: collectCryptoWallets,
  congress: collectCongressDisclosures,
  social_media: collectSocialMedia,
  congress_house: collectCongressTrades,
  congress_senate: collectCongressTrades,
}

export async function POST(request: Request) {
  const supabase = supabaseClient

  let body: { sources?: string[] } = {}
  try {
    body = await request.json()
  } catch {
    // Empty body is fine — run all sources
  }

  // Load enabled sources
  let query = supabase.from('trump_tracker_sources').select('*').eq('enabled', true)
  if (body.sources?.length) {
    query = query.in('source_key', body.sources)
  }
  const { data: sources, error: srcError } = await query

  if (srcError || !sources?.length) {
    return Response.json({ error: 'No sources found', detail: srcError?.message }, { status: 500 })
  }

  const results: CollectorResult[] = []

  // Run collectors
  for (const source of sources) {
    const collector = COLLECTORS[source.source_key]
    if (!collector) {
      results.push({ source: source.source_key, investments: [], error: 'No collector found' })
      continue
    }

    try {
      const rawInvestments = await collector(source.config as Record<string, unknown>)
      results.push({ source: source.source_key, investments: rawInvestments })

      // Update last_polled_at
      await supabase
        .from('trump_tracker_sources')
        .update({ last_polled_at: new Date().toISOString(), last_error: null })
        .eq('id', source.id)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      results.push({ source: source.source_key, investments: [], error: errorMsg })

      await supabase
        .from('trump_tracker_sources')
        .update({ last_error: errorMsg })
        .eq('id', source.id)
    }
  }

  // Deduplicate and insert
  let totalNew = 0
  const summary: { source: string; newCount: number; errors: string[] }[] = []

  for (const result of results) {
    const errors: string[] = result.error ? [result.error] : []
    let newCount = 0

    for (const inv of result.investments) {
      const fingerprint = generateFingerprint(inv)

      const { error: insertError } = await supabase
        .from('trump_investments')
        .upsert(
          {
            asset_name: inv.asset_name,
            asset_ticker: inv.asset_ticker || null,
            asset_type: inv.asset_type,
            family_member: inv.family_member,
            entity_name: inv.entity_name || null,
            action: inv.action || null,
            estimated_amount_usd: inv.estimated_amount_usd || null,
            description: inv.description || null,
            source_type: inv.source_type,
            source_url: inv.source_url || null,
            source_title: inv.source_title || null,
            fingerprint,
            detected_at: inv.detected_at || new Date().toISOString(),
          },
          { onConflict: 'fingerprint', ignoreDuplicates: true }
        )

      if (!insertError) {
        newCount++
      }
    }

    totalNew += newCount
    summary.push({ source: result.source, newCount, errors })
  }

  return Response.json({ results: summary, totalNew })
}
