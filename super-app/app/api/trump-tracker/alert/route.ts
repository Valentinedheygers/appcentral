import { supabaseAny } from '@/lib/supabase'
import { composeAlertEmail } from '@/lib/trump-tracker/email-alert'
import type { TrumpInvestment } from '@/lib/trump-tracker/types'

export async function POST(request: Request) {
  const { investmentIds, recipientEmail } = await request.json() as {
    investmentIds?: string[]
    recipientEmail?: string
  }

  const email = recipientEmail || process.env.ALERT_EMAIL || 'user@example.com'

  // Fetch investments to alert about
  let query = supabaseAny.from('trump_investments').select('*')

  if (investmentIds?.length) {
    query = query.in('id', investmentIds)
  } else {
    query = query.eq('alert_sent', false).order('detected_at', { ascending: false }).limit(20)
  }

  const { data: investments, error } = await query

  if (error || !investments?.length) {
    return Response.json({ sent: 0, message: 'No investments to alert about' })
  }

  const typedInvestments = investments as unknown as TrumpInvestment[]
  const { subject, body } = composeAlertEmail(typedInvestments)

  const alertPromises = typedInvestments.map(inv =>
    supabaseAny.from('trump_tracker_alerts').insert({
      investment_id: inv.id,
      recipient_email: email,
      subject,
      status: 'pending',
    })
  )

  await Promise.all(alertPromises)

  const ids = typedInvestments.map(inv => inv.id)
  await supabaseAny
    .from('trump_investments')
    .update({ alert_sent: true })
    .in('id', ids)

  return Response.json({
    sent: typedInvestments.length,
    subject,
    body,
    recipientEmail: email,
    investmentIds: ids,
  })
}
