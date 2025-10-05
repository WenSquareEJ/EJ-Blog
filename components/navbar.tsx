// components/NavBar.tsx
"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
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
  const [badgeCount, setBadgeCount] = useState<number | null>(null);

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
  // Erik user ID from env
  const ERIK_USER_ID = process.env.NEXT_PUBLIC_ERIK_USER_ID?.trim();
  const isErik = !!(user?.id && ERIK_USER_ID && user.id === ERIK_USER_ID);

  useEffect(() => {
    if (!isLoggedIn) {
      setBadgeCount(null);
      return;
    }

    let cancelled = false;

    fetch('/api/badges/earned-count')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        const count = data?.count;
        if (typeof count === 'number' && count > 0) {
          setBadgeCount(count);
        } else {
          setBadgeCount(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setBadgeCount(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, user?.id]);

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

  const pathname = usePathname();
  const isHome = pathname === "/";
  return (
    <header className={`sticky top-0 z-40 border-b border-mc-wood-dark bg-mc-wood text-mc-parchment shadow-mc${isHome ? " navbar--compact" : ""}`}>
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2 px-4 py-3 sm:gap-3">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 whitespace-nowrap font-mc text-[0.7rem] uppercase tracking-[0.2em] hover:opacity-90"
        >
          <span className="inline-block h-4 w-4 rounded-sm bg-mc-leaf border border-mc-wood-dark shadow-pixel" />
          EJ
        </Link>

        <nav className="navbar-links flex w-full flex-1 flex-wrap items-center gap-1.5 sm:w-auto sm:gap-2">
          {!isHome && (
            <>
              <Link className="btn-mc" href="/">
                Home
              </Link>
              <Link className="btn-mc" href="/blog">
                Blog
              </Link>
              {user && (
                <Link className="btn-mc" href="/site/avatar">
                  Avatar
                </Link>
              )}
              {(isErik || isAdmin) && (
                <Link className="btn-mc" href="/site/avatar-house">
                  Avatar House
                </Link>
              )}
              <Link className="btn-mc" href="/minecraft-zone">
                Minecraft Zone
              </Link>
              <Link className="btn-mc" href="/scratch-board">
                Scratch Board
              </Link>
              <Link className="btn-mc" href="/badges">
                Badges
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
            </>
          )}
        </nav>

        <div className="ms-0 flex shrink-0 items-center gap-2 sm:ms-auto">
          {isLoggedIn && badgeCount !== null && !isHome && (
            <span
              className="nav-badge-count"
              aria-label={`Badges earned: ${badgeCount}`}
            >
              🎖️ {badgeCount}
            </span>
          )}
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
