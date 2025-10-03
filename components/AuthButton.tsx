// components/AuthButton.tsx
"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseClient";

type SessionUser = { id: string; email: string | null };

export default function AuthButtons() {
  const router = useRouter();
  const supabase = supabaseBrowser();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setUser(
        data.user ? { id: data.user.id, email: data.user.email ?? null } : null
      );
    });
    return () => {
      mounted = false;
    };
  }, [supabase]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    startTransition(() => router.refresh());
  }

  if (!user) {
    return (
      <a className="btn-mc" href="/login" aria-label="Log in">
        Log in
      </a>
    );
  }

  return (
    <button
      className="btn-mc"
      onClick={handleSignOut}
      disabled={isPending}
      aria-label="Log out"
    >
      {isPending ? "Logging out..." : "Log out"}
    </button>
  );
}
