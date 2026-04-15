import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Lazy singletons — avoid throwing at module load (breaks Vercel build
// when NEXT_PUBLIC_* env vars aren't available during "collect page data").
let _supabase: SupabaseClient<Database> | null = null
let _supabaseAny: SupabaseClient | null = null

function getClient(): SupabaseClient<Database> {
  if (!_supabase) {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase env vars are not set')
    }
    _supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
  }
  return _supabase
}

function getAnyClient(): SupabaseClient {
  if (!_supabaseAny) {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase env vars are not set')
    }
    _supabaseAny = createClient(supabaseUrl, supabaseAnonKey)
  }
  return _supabaseAny
}

// Proxy objects that look like SupabaseClient but lazily initialise on first use.
// This lets modules import { supabase, supabaseAny } at top level safely,
// even when env vars aren't available (e.g. Vercel's build-time page data collection).
export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get(_target, prop) {
    const client = getClient()
    const value = (client as unknown as Record<string | symbol, unknown>)[prop]
    return typeof value === 'function' ? (value as (...args: unknown[]) => unknown).bind(client) : value
  },
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabaseAny: any = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getAnyClient()
    const value = (client as unknown as Record<string | symbol, unknown>)[prop]
    return typeof value === 'function' ? (value as (...args: unknown[]) => unknown).bind(client) : value
  },
})

// Server-side client with service role (for API routes only)
export function createServiceClient() {
  if (!supabaseUrl) throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set')
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
