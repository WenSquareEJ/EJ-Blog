// lib/supabaseAdmin.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

type TypedSupabaseClient = SupabaseClient<Database, 'public', Database['public']>

export function supabaseAdmin(): TypedSupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient<Database>(url, serviceKey, {
    auth: { persistSession: false },
  })
}
