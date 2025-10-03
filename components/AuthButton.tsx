'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { createBrowserClient } from '@/lib/supabaseClient';

const ADMIN_EMAIL = 'wenyu.yan@gmail.com';

type SessionUser = { email: string | null } | null;

export default function AuthButtons() {
  const router = useRouter();
  const supabase = createBrowserClient();
  const [isPending, startTransition] = useTransition();
  const [user, setUser] = useState<SessionUser>(null);

  // Read session on mount and whenever it changes
  useEffect(() => {
    let isMounted = true;

    async function load() {
      const { data } = await supabase.auth.getUser();
      if (isMounted) {
        setUser(data?.user ? { email: data.user.email ?? null } : null);
      }
    }

    load();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      load();
      // ensure server components refresh too
      startTransition(() => router.refresh());
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [router, supabase]);

  async function handleLogout() {
    await supabase.auth.signOut();
    startTransition(() => {
      router.refresh();
      router.push('/');
    });
  }

  const isAdmin =
    !!user?.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  if (!user) {
    // Logged OUT — show Login
    return <Link className="btn-mc-secondary" href="/login">Log in</Link>;
  }

  // Logged IN — show Parent Zone (if admin) + Logout
  return (
    <div className="flex items-center gap-2">
      {isAdmin && (
        <Link className="btn-mc" href="/moderation">
          Parent Zone
        </Link>
      )}
      <button
        type="button"
        className="btn-mc-secondary"
        onClick={handleLogout}
        disabled={isPending}
      >
        {isPending ? 'Logging out…' : 'Log out'}
      </button>
    </div>
  );
}