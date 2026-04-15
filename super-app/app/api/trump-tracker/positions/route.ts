import { supabaseAny as supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const status = url.searchParams.get('status') // 'open' | 'closed' | null (all)

  let query = supabase
    .from('tracker_positions')
    .select('*')
    .order('entry_date', { ascending: false })
    .limit(100)

  if (status === 'open') {
    query = query.eq('status', 'open')
  } else if (status === 'closed') {
    query = query.neq('status', 'open')
  }

  const { data, error } = await query

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ positions: data || [] })
}
