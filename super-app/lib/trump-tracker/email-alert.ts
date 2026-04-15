import type { TrumpInvestment } from './types'

export function composeAlertEmail(investments: TrumpInvestment[]): {
  subject: string
  body: string
} {
  if (investments.length === 1) {
    const inv = investments[0]
    return {
      subject: `🚨 New Trump Investment: ${inv.asset_name} (${inv.asset_type})`,
      body: renderSingleEmail(inv),
    }
  }

  return {
    subject: `🚨 ${investments.length} New Trump Investments Detected`,
    body: renderBatchEmail(investments),
  }
}

function renderSingleEmail(inv: TrumpInvestment): string {
  const amount = inv.estimated_amount_usd
    ? `$${inv.estimated_amount_usd.toLocaleString()}`
    : 'Undisclosed'

  return `
New Trump Family Investment Detected
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Asset: ${inv.asset_name}${inv.asset_ticker ? ` (${inv.asset_ticker})` : ''}
Type: ${formatAssetType(inv.asset_type)}
Family Member: ${inv.family_member}
Action: ${inv.action || 'N/A'}
Est. Amount: ${amount}
Source: ${inv.source_type.replace('_', ' ')}
Detected: ${new Date(inv.detected_at).toLocaleString()}

${inv.ai_summary ? `📊 AI Summary:\n${inv.ai_summary}\n` : ''}
${inv.source_url ? `🔗 Source: ${inv.source_url}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
View all investments in the Trump Tracker dashboard.
`.trim()
}

function renderBatchEmail(investments: TrumpInvestment[]): string {
  const items = investments.map((inv, i) => {
    const amount = inv.estimated_amount_usd
      ? `$${inv.estimated_amount_usd.toLocaleString()}`
      : ''
    return `${i + 1}. ${inv.asset_name} (${formatAssetType(inv.asset_type)}) — ${inv.family_member}${amount ? ` — ${amount}` : ''}
   ${inv.action || ''} | ${inv.source_type.replace('_', ' ')}
   ${inv.source_url || ''}`
  })

  return `
${investments.length} New Trump Family Investments Detected
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${items.join('\n\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
View all investments in the Trump Tracker dashboard.
`.trim()
}

function formatAssetType(type: string): string {
  const map: Record<string, string> = {
    stock: '📈 Stock',
    crypto: '🪙 Crypto',
    real_estate: '🏢 Real Estate',
    nft: '🎨 NFT',
    spac: '🏦 SPAC',
    fund: '💰 Fund',
    other: '📋 Other',
  }
  return map[type] || type
}
