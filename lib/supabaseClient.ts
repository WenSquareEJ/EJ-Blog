// lib/supabaseClient.ts
"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client for components that run in the browser.
 * Uses public URL + anon key from env vars.
 */
export function createSupabaseBrowser(
  url = process.env.NEXT_PUBLIC_SUPABASE_URL!,
  anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
) {
  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }
  return createBrowserClient(url, anonKey);
}

export default createSupabaseBrowser;