"use client";

import { createBrowserClient } from "@supabase/ssr";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Singleton browser client
export const supabaseBrowser = createBrowserClient(url, anon);

// Keep server cookies in sync
if (typeof window !== "undefined") {
  supabaseBrowser.auth.onAuthStateChange(async (event, session) => {
    try {
      await fetch("/auth/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event, session }),
      });
    } catch {
      // ignore network hiccups
    }
  });
}

export default supabaseBrowser;