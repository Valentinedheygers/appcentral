import { supabase as supabaseClient } from '@/lib/supabase'
import { enrichInvestment } from '@/lib/trump-tracker/enrichment'

export async function POST(request: Request) {
  const supabase = supabaseClient

  const { investmentId, rawText, apiKey } = await request.json() as {
    investmentId: string
    rawText?: string
    apiKey?: string
  }

  if (!investmentId) {
    return Response.json({ error: 'Missing investmentId' }, { status: 400 })
  }

  // Fetch the investment
  const { data: inv, error } = await supabase
    .from('trump_investments')
    .select('*')
    .eq('id', investmentId)
    .single()

  if (error || !inv) {
    return Response.json({ error: 'Investment not found' }, { status: 404 })
  }

  // Use provided text or compose from existing data
  const textToAnalyze = rawText || [
    inv.source_title,
    inv.description,
    `Asset: ${inv.asset_name}`,
    `Family member: ${inv.family_member}`,
    `Source: ${inv.source_url}`,
  ].filter(Boolean).join('\n')

  const result = await enrichInvestment(textToAnalyze, apiKey)

  if (!result.isInvestment || !result.data) {
    return Response.json({ enriched: false, message: 'Not identified as investment' })
  }

  // Update the investment with enriched data
  const updates: Record<string, unknown> = {}
  if (result.data.ai_summary) updates.ai_summary = result.data.ai_summary
  if (result.data.asset_name && result.data.asset_name !== inv.asset_name) updates.asset_name = result.data.asset_name
  if (result.data.asset_ticker) updates.asset_ticker = result.data.asset_ticker
  if (result.data.estimated_amount_usd) updates.estimated_amount_usd = result.data.estimated_amount_usd
  if (result.data.action) updates.action = result.data.action

  if (Object.keys(updates).length > 0) {
    await supabase
      .from('trump_investments')
      .update(updates)
      .eq('id', investmentId)
  }

  return Response.json({
    enriched: true,
    updates,
    summary: result.data.ai_summary,
  })
}
