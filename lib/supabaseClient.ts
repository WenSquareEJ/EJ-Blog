// /lib/supabaseClient.ts
'use client';

import { createBrowserClient } from '@supabase/ssr';

/**
 * Use in CLIENT components (files that start with 'use client').
 * We export both names so older imports don't break.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createSupabaseBrowser(url, anon);
}

export { createBrowserClient };