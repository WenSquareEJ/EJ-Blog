"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { User } from "@supabase/supabase-js";

export default function AvatarHousePageClient() {
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      setLoading(true);
      try {
        // Try to get the current user
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;

        let user: User | null = data.user ?? null;

        // Fallback to session if no user is found
        if (!user) {
          const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
          if (sessionError) throw sessionError;
          user = sessionData.session?.user ?? null;
        }

        if (isMounted) {
          setUserEmail(user?.email ?? null);
        }
      } catch (e: any) {
        if (isMounted) {
          setError(e?.message || "Unable to get session");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [supabase]);

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-mc text-2xl">Choose Your Avatar</h1>
        <Link href="/site" className="btn-mc">← Back to Home</Link>
      </div>

      {loading && <p className="text-sm text-mc-stone">Loading…</p>}

      {!loading && !userEmail && (
        <p className="text-sm text-red-600">Please sign in to change your avatar.</p>
      )}

      {!loading && userEmail && (
        <div className="space-y-4">
          <p className="text-sm text-mc-stone">Signed in as: {userEmail}</p>
          <div className="home-card p-4">
            <p className="text-sm">✅ Auth OK — next step: mount the Avatar grid here.</p>
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600">Error: {error}</p>
      )}
    </div>
  );
}