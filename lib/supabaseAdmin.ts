// lib/supabaseAdmin.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

let adminClient: SupabaseClient<Database> | null = null

export function supabaseAdmin(): SupabaseClient<Database> {
  if (adminClient) return adminClient

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  adminClient = createClient<Database>(url, serviceKey, {
    auth: { persistSession: false },
  }) as unknown as SupabaseClient<Database>

  return adminClient
}

export default supabaseAdmin;
