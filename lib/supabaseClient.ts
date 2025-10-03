// lib/supabaseClient.ts
import { createBrowserClient } from "@supabase/ssr";

// Keep a singleton instance so the client isn't recreated every render
let _client: ReturnType<typeof createBrowserClient> | null = null;

export function supabaseBrowser() {
  if (_client) return _client;
  _client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  return _client;
}

// Aliases so older code keeps working
export const createSupabaseBrowser = supabaseBrowser;
export const createClient = supabaseBrowser;

// Default export also works
export default supabaseBrowser;