// /app/(site)/login/page.tsx
"use client";

import { useEffect, useState } from "react";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const supabase = supabaseBrowser();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // 🔁 Keep server cookie in sync with client auth state
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Sync browser auth state into HTTP-only cookies for server components
      if (shouldSyncEvent(event, session)) {
        await syncSession(event, session);
      }

      // Make server components (layout) re-run with the new cookie
      router.refresh();
    });

    return () => subscription.unsubscribe();
  }, [supabase, router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setMsg(error.message);
        return;
      }
      // We proactively sync the session so server layouts update on first redirect
      if (data.session) {
        await syncSession("SIGNED_IN", data.session);
      }

      // After onAuthStateChange runs, the cookie is set and layout will see it
      router.push("/");
    } catch (err: any) {
      setMsg(err?.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function shouldSyncEvent(event: AuthChangeEvent, session: Session | null) {
    if (event === "SIGNED_OUT" || event === "USER_DELETED") return true;
    const hasTokens = Boolean(session?.access_token && session?.refresh_token);
    return (
      event === "SIGNED_IN" ||
      event === "INITIAL_SESSION" ||
      event === "TOKEN_REFRESHED" ||
      event === "USER_UPDATED"
    ) && hasTokens;
  }

  async function syncSession(event: AuthChangeEvent, session: Session | null) {
    try {
      const res = await fetch("/auth/callback", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event, session }),
      });
      if (!res.ok) {
        console.error("Failed to sync Supabase session", event, await res.text());
      }
    } catch (error) {
      console.error("Error syncing Supabase session", error);
    }
  }

  return (
    <div className="mx-auto max-w-md w-full p-4 sm:p-6 bg-white/70 rounded-lg shadow">
      <h1 className="text-xl font-semibold mb-4">Log in</h1>

      <form onSubmit={handleLogin} className="space-y-3">
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input
            type="email"
            className="w-full rounded border px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Password</label>
          <input
            type="password"
            className="w-full rounded border px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>

        {msg && <p className="text-sm text-red-600">{msg}</p>}

        <button type="submit" disabled={loading} className="btn-mc-secondary w-full">
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-4 text-xs opacity-80">
        Don&apos;t have an account?{" "}
        <Link href="/" className="underline">
          Go back
        </Link>
      </p>
    </div>
  );
}
