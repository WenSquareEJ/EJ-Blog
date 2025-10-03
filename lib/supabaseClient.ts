// /lib/supabaseClient.ts
import { createBrowserClient } from '@supabase/ssr'

/** Preferred: make a fresh browser client when you need one */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

/** Back-compat: a singleton so existing `import { supabase } ...` keeps working */
export const supabase = createSupabaseBrowserClient()
