'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import type { User } from '@supabase/supabase-js';
import { createBrowserClient } from '@/lib/supabaseClient';

// Your admin email (case-insensitive)
const ADMIN_EMAIL = 'wenyu.yan@gmail.com';

type Props = {
  user: User | null;
};

export default function AuthButtons({ user }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const supabase = createBrowserClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    // Make sure UI updates to logged-out state
    startTransition(() => {
      router.refresh();
      router.push('/');
    });
  }

  const isAdmin =
    !!user?.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  if (!user) {
    // Logged OUT — show Login
    return (
      <Link className="btn-mc-secondary" href="/login">
        Log in
      </Link>
    );
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