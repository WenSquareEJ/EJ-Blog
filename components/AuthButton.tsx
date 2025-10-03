'use client';

import Link from 'next/link';
import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabaseClient';

type SessionUser = { id: string; email?: string | null } | null;

export default function AuthButtons() {
  const router = useRouter();
  // IMPORTANT: createBrowserClient needs URL + anon key
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [user, setUser] = useState<SessionUser>(null);
  const [isPending, startTransition] = useTransition();

  // Load user on mount and listen for auth changes
  useEffect(() => {
    let mounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (mounted) setUser(data.user ?? null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_evt) => {
      // refresh the header state after login/logout
      startTransition(() => router.refresh());
      supabase.auth.getUser().then(({ data }) => {
        if (mounted) setUser(data.user ?? null);
      });
    });

    return () => {
      mounted = false;
      sub?.subscription.unsubscribe();
    };
  }, [router, supabase]);

  // Not logged in -> show Login
  if (!user) {
    return (
      <Link className="btn-mc-secondary" href="/login">
        Log in
      </Link>
    );
  }

  // Logged in -> show Logout
  return (
    <form action="/logout" method="post">
      <button className="btn-mc-secondary" type="submit" disabled={isPending}>
        {isPending ? 'Logging out…' : 'Log out'}
      </button>
    </form>
  );
}