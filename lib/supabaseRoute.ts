// lib/supabaseRoute.ts
// Helper to create a Supabase client inside Next.js Route Handlers while
// keeping request/response cookies in sync.
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

export function supabaseRoute(response: NextResponse): SupabaseClient<Database> {
  const requestCookies = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return requestCookies.get(name)?.value;
        },
        set(name: string, value: string, options?: CookieOptions) {
          const cookieOptions = options ?? {};
          response.cookies.set({ name, value, ...cookieOptions });
        },
        remove(name: string, options?: CookieOptions) {
          const cookieOptions = options ?? {};
          response.cookies.set({
            name,
            value: "",
            ...cookieOptions,
            maxAge: 0,
          });
        },
      },
    }
  ) as unknown as SupabaseClient<Database>;
}

export default supabaseRoute;
