// /lib/supabaseClient.ts
'use client'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Small safety in dev — in Vercel these must be set in Project → Settings → Environment Variables
if (!url || !anon) {
  // Don't throw at import time; just log so the app still builds
  console.warn(
    '[supabaseClient] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY'
  )
}

/** Browser client for use in Client Components/hooks */
export function createClient() {
  return createSupabaseClient(url ?? '', anon ?? '')
}
