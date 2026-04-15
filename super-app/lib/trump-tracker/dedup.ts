import type { RawInvestment } from './types'

export function generateFingerprint(inv: RawInvestment): string {
  const dateStr = inv.detected_at
    ? new Date(inv.detected_at).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10)

  const raw = [
    inv.asset_name.toLowerCase().trim(),
    inv.family_member.toLowerCase().trim(),
    (inv.source_url || '').toLowerCase().trim(),
    dateStr,
  ].join('|')

  // Use Web Crypto API (available in Node 18+ and Edge Runtime)
  return hashString(raw)
}

function hashString(str: string): string {
  // Simple hash for dedup — deterministic, no crypto needed
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash + char) | 0
  }
  // Convert to hex and pad to ensure uniqueness with source URL
  const hex = (hash >>> 0).toString(16).padStart(8, '0')
  // Add a secondary hash for more entropy
  let hash2 = 5381
  for (let i = 0; i < str.length; i++) {
    hash2 = ((hash2 << 5) + hash2 + str.charCodeAt(i)) | 0
  }
  const hex2 = (hash2 >>> 0).toString(16).padStart(8, '0')
  return `${hex}${hex2}`
}
