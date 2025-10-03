// components/NavBar.tsx
"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseClient";

type SessionUser = { id: string; email?: string | null } | null;

type NavBarProps = {
  initialUser: SessionUser;
  adminEmail: string;
};

export default function NavBar({ initialUser, adminEmail }: NavBarProps) {
  const router = useRouter();
  const supabase = supabaseBrowser();
  const normalizedAdminEmail = adminEmail.toLowerCase();

  const [user, setUser] = useState<SessionUser>(initialUser ?? null);
  const [isAdmin, setIsAdmin] = useState<boolean>(() =>
    isAdminUser(initialUser, normalizedAdminEmail)
  );
  const [isPending, startTransition] = useTransition();
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return;
      const nextUser = data.session?.user ?? null;
      setUser(nextUser);
      setIsAdmin(isAdminUser(nextUser, normalizedAdminEmail));
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const nextUser = session?.user ?? null;
        setUser(nextUser);
        setIsAdmin(isAdminUser(nextUser, normalizedAdminEmail));
        startTransition(() => router.refresh());
      }
    );

    return () => {
      isMounted = false;
      subscription?.subscription?.unsubscribe();
    };
  }, [normalizedAdminEmail, router, supabase]);

  const isLoggedIn = Boolean(user);

  async function handleLogout() {
    setLoggingOut(true);
    await Promise.allSettled([
      supabase.auth.signOut(),
      fetch("/logout", { method: "POST" }),
    ]);

    startTransition(() => {
      router.push("/");
      router.refresh();
    });
    setLoggingOut(false);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-mc-wood-dark bg-mc-wood text-mc-parchment shadow-mc">
      <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 whitespace-nowrap font-mc text-xs uppercase tracking-[0.2em] hover:opacity-90"
        >
          <span className="inline-block h-4 w-4 rounded-sm bg-mc-leaf border border-mc-wood-dark shadow-pixel" />
          EJ Blog
        </Link>

        <nav className="flex flex-1 items-center gap-2 overflow-x-auto">
          <Link className="btn-mc" href="/">
            Blog
          </Link>
          <Link className="btn-mc" href="/minecraft-zone">
            Minecraft Zone
          </Link>
          <Link className="btn-mc" href="/scratch-board">
            Scratch Board
          </Link>
          <Link className="btn-mc" href="/badger">
            Badger
          </Link>
          <Link className="btn-mc" href="/calendar">
            Calendar
          </Link>
          <Link className="btn-mc" href="/tags">
            Tags
          </Link>

          {isLoggedIn && (
            <Link className="btn-mc" href="/post/new">
              New Post
            </Link>
          )}

          {isAdmin && (
            <Link className="btn-mc" href="/moderation">
              Parent / Moderation
            </Link>
          )}
        </nav>

        <div className="ms-auto shrink-0">
          {!isLoggedIn ? (
            <Link className="btn-mc-secondary" href="/login">
              Log in
            </Link>
          ) : (
            <button
              className="btn-mc-secondary"
              disabled={isPending || loggingOut}
              onClick={handleLogout}
            >
              {loggingOut ? "…" : "Log out"}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

function isAdminUser(user: SessionUser, adminEmail: string) {
  if (!user?.email) return false;
  return user.email.toLowerCase() === adminEmail;
}
