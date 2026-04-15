import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Untyped client for tables not yet generated into database.types.ts
// (trump_investments, trump_tracker_*, tracker_*)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabaseAny: any = supabase

// Server-side client with service role (for API routes only)
export function createServiceClient() {
  return createClient<Database>(
    supabaseUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

// Type helpers
export type Contact = Database['public']['Tables']['contacts']['Row']
export type ContactInsert = Database['public']['Tables']['contacts']['Insert']
export type Company = Database['public']['Tables']['companies']['Row']
export type CompanyInsert = Database['public']['Tables']['companies']['Insert']
export type Interaction = Database['public']['Tables']['interactions']['Row']
export type Tag = Database['public']['Tables']['tags']['Row']
export type Campaign = Database['public']['Tables']['campaigns']['Row']
export type NotableEvent = Database['public']['Tables']['notable_events']['Row']
export type ContactEnriched = Database['public']['Views']['contacts_enriched']['Row']
export type ContactStatus = Database['public']['Enums']['contact_status']
export type ContactSource = Database['public']['Enums']['contact_source']
export type InteractionChannel = Database['public']['Enums']['interaction_channel']
