// components/NavBar.tsx
"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const ADMIN_EMAIL = "wenyu.yan@gmail.com";

type SessionUser = { id: string; email?: string | null } | null;

export default function NavBar() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser>(null);
  const [isPending, startTransition] = useTransition();

  // Create a plain browser Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    // 1) Get current session on mount
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });

    // 2) Listen to auth changes so the UI updates immediately
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      // re-render current page (e.g. to reveal New Post / Moderation)
      startTransition(() => router.refresh());
    });

    return () => {
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isLoggedIn = !!user;
  const isAdmin =
    !!user?.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  async function handleLogout() {
    await supabase.auth.signOut();
    startTransition(() => router.push("/"));
  }

  return (
    <header className="sticky top-0 z-40 bg-mc-sage/85 backdrop-blur supports-[backdrop-filter]:bg-mc-sage/70">
      <div className="mx-auto max-w-5xl px-4">
        <nav className="flex items-center gap-3 flex-wrap py-3">
          {/* Left: Logo / Title */}
          <Link
            href="/"
            className="shrink-0 whitespace-nowrap font-bold flex items-center gap-2"
          >
            <span className="inline-block h-4 w-4 rounded-sm bg-mc-grass border border-mc-wood translate-y-0.5" />
            EJ Blog
          </Link>

          {/* Middle: Links (wraps if needed) */}
          <ul className="flex items-center gap-3 flex-wrap">
            <li>
              <Link href="/" className="hover:underline whitespace-nowrap">
                Blog
              </Link>
            </li>
            <li>
              <Link
                href="/minecraft-zone"
                className="hover:underline whitespace-nowrap"
              >
                Minecraft Zone
              </Link>
            </li>
            <li>
              <Link
                href="/scratch-board"
                className="hover:underline whitespace-nowrap"
              >
                Scratch Board
              </Link>
            </li>
            <li>
              <Link
                href="/badger"
                className="hover:underline whitespace-nowrap"
              >
                Badger
              </Link>
            </li>
            <li>
              <Link
                href="/calendar"
                className="hover:underline whitespace-nowrap"
              >
                Calendar
              </Link>
            </li>
            <li>
              <Link href="/tags" className="hover:underline whitespace-nowrap">
                Tags
              </Link>
            </li>

            {/* Logged-in only */}
            {isLoggedIn && (
              <li>
                <Link
                  href="/post/new"
                  className="hover:underline whitespace-nowrap"
                >
                  New Post
                </Link>
              </li>
            )}

            {/* Admin-only (Parent/Moderation page) */}
            {isAdmin && (
              <li>
                <Link
                  href="/moderation"
                  className="hover:underline whitespace-nowrap"
                >
                  Parent / Moderation
                </Link>
              </li>
            )}
          </ul>

          {/* Right: Auth area – pinned to edge */}
          <div className="ms-auto shrink-0 whitespace-nowrap">
            {!isLoggedIn ? (
              <Link className="btn-mc-secondary" href="/login">
                Log in
              </Link>
            ) : (
              <button
                disabled={isPending}
                onClick={handleLogout}
                className="btn-mc-secondary"
              >
                {isPending ? "…" : "Log out"}
              </button>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}