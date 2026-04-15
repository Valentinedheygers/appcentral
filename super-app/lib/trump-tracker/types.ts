export type InvestmentAssetType = 'stock' | 'crypto' | 'real_estate' | 'nft' | 'spac' | 'fund' | 'other'

export type SourceType = 'sec_filing' | 'news' | 'crypto_onchain' | 'congress_disclosure' | 'social_media'

export interface TrumpInvestment {
  id: string
  created_at: string
  detected_at: string
  asset_name: string
  asset_ticker: string | null
  asset_type: InvestmentAssetType
  family_member: string
  entity_name: string | null
  action: string | null
  estimated_amount_usd: number | null
  description: string | null
  ai_summary: string | null
  source_type: string
  source_url: string | null
  source_title: string | null
  fingerprint: string
  verified: boolean
  alert_sent: boolean
}

export interface TrackerSource {
  id: string
  source_key: string
  source_type: string
  display_name: string
  config: Record<string, unknown>
  enabled: boolean
  last_polled_at: string | null
  last_error: string | null
  created_at: string
}

export interface RawInvestment {
  asset_name: string
  asset_ticker?: string
  asset_type: InvestmentAssetType
  family_member: string
  entity_name?: string
  action?: string
  estimated_amount_usd?: number
  description?: string
  source_type: SourceType
  source_url?: string
  source_title?: string
  detected_at?: string
}

export interface CollectorResult {
  source: string
  investments: RawInvestment[]
  error?: string
}

export interface CollectResponse {
  results: { source: string; newCount: number; errors: string[] }[]
  totalNew: number
}
