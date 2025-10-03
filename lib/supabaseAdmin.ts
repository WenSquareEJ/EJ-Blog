// lib/supabaseAdmin.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

export function supabaseAdmin(): SupabaseClient<Database> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient<Database>(url, serviceKey, {
    auth: { persistSession: false },
  }) as unknown as SupabaseClient<Database>
}

export default supabaseAdmin;
