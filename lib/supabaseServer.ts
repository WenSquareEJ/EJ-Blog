// /lib/supabaseServer.ts
// Works with any of these imports across your app:
//   import { supabaseServer } from "@/lib/supabaseServer";
//   import { createServerClient } from "@/lib/supabaseServer";
//   import supabaseServer from "@/lib/supabaseServer";
//
// And in each case you use it like:
//   const sb = supabaseServer();
//   // or
//   const sb = createServerClient();
//   // or
//   const sb = supabaseServerDefault(); // if you import default under a custom name

import { cookies } from "next/headers";
import {
  createServerClient as _createServerClient,
  type CookieOptions,
} from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

function makeServerClient(): SupabaseClient<Database> {
  const cookieStore = cookies();

  return _createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options?: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options?: CookieOptions) {
          cookieStore.set({ name, value: "", ...options, maxAge: 0 });
        },
      },
    }
  );
}

/** Preferred name going forward */
export function supabaseServer() {
  return makeServerClient();
}

/** Backwards-compatible alias for older imports */
export function createServerClient() {
  return makeServerClient();
}

/** Default export so `import x from "@/lib/supabaseServer"` also works */
export default makeServerClient;
