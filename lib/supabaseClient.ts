// lib/supabaseClient.ts
import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// Keep a singleton instance so the client isn't recreated every render
let _client: SupabaseClient<Database> | null = null;

export function supabaseBrowser(): SupabaseClient<Database> {
  if (_client) return _client as SupabaseClient<Database>;
  _client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ) as unknown as SupabaseClient<Database>;
  return _client;
}

// Aliases so older code keeps working
export const createSupabaseBrowser = supabaseBrowser;
export const createClient = supabaseBrowser;

// Default export also works
export default supabaseBrowser;
