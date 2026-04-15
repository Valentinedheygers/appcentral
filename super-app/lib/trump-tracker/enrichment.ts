import Anthropic from '@anthropic-ai/sdk'
import type { RawInvestment, InvestmentAssetType } from './types'

const SYSTEM_PROMPT = `You are a financial analyst AI. Given a news article or text about Trump family investments, extract structured data.

Return ONLY valid JSON with these fields:
{
  "asset_name": "exact name of the asset/company/token",
  "asset_ticker": "ticker symbol if applicable, or null",
  "asset_type": "stock|crypto|real_estate|nft|spac|fund|other",
  "family_member": "which Trump family member (Donald Trump, Eric Trump, Donald Trump Jr, Ivanka Trump, Jared Kushner, Barron Trump)",
  "action": "buy|sell|launch|stake|filing|announce|other",
  "estimated_amount_usd": null or number,
  "summary": "2-3 sentence summary of the investment/deal"
}

If the text is NOT about an actual investment or financial transaction, return: {"is_investment": false}`

export async function enrichInvestment(
  rawText: string,
  apiKey?: string
): Promise<{
  isInvestment: boolean
  data?: Partial<RawInvestment> & { ai_summary?: string }
}> {
  const key = apiKey || process.env.ANTHROPIC_API_KEY
  if (!key) return { isInvestment: false }

  try {
    const client = new Anthropic({ apiKey: key })

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: rawText.slice(0, 3000) }],
    })

    const text = message.content[0]?.type === 'text' ? message.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return { isInvestment: false }

    const parsed = JSON.parse(jsonMatch[0])

    if (parsed.is_investment === false) {
      return { isInvestment: false }
    }

    return {
      isInvestment: true,
      data: {
        asset_name: parsed.asset_name,
        asset_ticker: parsed.asset_ticker,
        asset_type: parsed.asset_type as InvestmentAssetType,
        family_member: parsed.family_member || 'Donald Trump',
        action: parsed.action,
        estimated_amount_usd: parsed.estimated_amount_usd,
        ai_summary: parsed.summary,
      },
    }
  } catch {
    return { isInvestment: false }
  }
}
