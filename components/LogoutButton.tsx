'use client';

import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

export default function LogoutButton() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  return (
    <button
      className="btn-mc-secondary"
      onClick={async () => {
        await supabase.auth.signOut();
        router.refresh();          // refresh server components (header)
        router.replace('/');       // send user home
      }}
      type="button"
    >
      Log out
    </button>
  );
}