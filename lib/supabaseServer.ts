// /lib/supabaseServer.ts
import { cookies } from "next/headers";
import {
  createServerClient as createSupabaseServerClient,
  type CookieOptions,
} from "@supabase/ssr";

/**
 * Server-side Supabase client for route handlers / server components.
 * Works with @supabase/ssr and Next.js app router cookies.
 */
export function createServerClient() {
  const cookieStore = cookies();

  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options?: CookieOptions) {
          // Next’s cookies() API sets by name/value/options
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options?: CookieOptions) {
          // Clear by setting maxAge to 0
          cookieStore.set({ name, value: "", ...options, maxAge: 0 });
        },
      },
    }
  );
}

/** Backwards-compatible alias (some files import { supabaseServer }) */
export const supabaseServer = createServerClient;

/** Optional default export so `import x from '@/lib/supabaseServer'` also works */
export default createServerClient;