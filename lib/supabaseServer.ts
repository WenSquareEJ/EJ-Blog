// lib/createServerClient.ts
import { cookies, headers } from "next/headers";
import { createServerClient as createcreateServerClientClient } from "@supabase/ssr";

/**
 * Server-side Supabase client for App Router (uses @supabase/ssr).
 * Works in server components, route handlers, etc.
 */
export function createServerClient() {
  const cookieStore = cookies();

  return createcreateServerClientClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: "", ...options, maxAge: 0 });
        },
      },
      // Forward request headers when needed (useful for RLS/session)
      headers: {
        get(key: string) {
          return headers().get(key) ?? undefined;
        },
      },
    }
  );
}

/** Convenience helper: fetch the current user on the server */
export async function getServerUser() {
  const supabase = createServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) return { user: null, error };
  return { user: data.user, error: null };
}