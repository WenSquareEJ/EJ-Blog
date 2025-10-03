// app/(site)/layout.tsx
import type { ReactNode } from "react";
import Link from "next/link";
import { supabaseServer } from "@/lib/supabaseServer";

// Put your admin email in Vercel env: NEXT_PUBLIC_ADMIN_EMAIL
const ADMIN_EMAIL = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || "").toLowerCase();

export default async function SiteLayout({ children }: { children: ReactNode }) {
  // Server-side: identify the current user
  const sb = supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();

  const isAdmin = !!user?.email && user.email.toLowerCase() === ADMIN_EMAIL;

  return (
    <html lang="en">
      <body className="bg-mc-grass text-mc-ink">
        {/* Top Nav */}
        <header className="sticky top-0 z-40 border-b bg-mc-sky/60 backdrop-blur supports-[backdrop-filter]:bg-mc-sky/40">
          <nav className="mx-auto flex max-w-5xl items-center justify-between px-3 py-2">
            {/* Left: brand + primary links */}
            <div className="flex items-center gap-3">
              <Link href="/" className="font-bold text-lg">
                EJ Blog
              </Link>
              <div className="hidden md:flex items-center gap-3 text-sm">
                <Link href="/">Home</Link>
                <Link href="/calendar">Calendar</Link>
                <Link href="/tags">Tags</Link>
                <Link href="/blog">Blog</Link>
                <Link href="/minecraft-zone">Minecraft Zone</Link>
                <Link href="/scratch-board">Scratch Board</Link>
                <Link href="/milestones">Milestones</Link>
                <Link href="/badges">Badges</Link>
                <Link href="/about">About</Link>
              </div>
            </div>

            {/* Right: auth + role-based links */}
            <div className="flex items-center gap-3 text-sm">
              {user ? (
                <>
                  <Link href="/post/new" className="btn-mc">New Post</Link>
                  {isAdmin && (
                    <>
                      <Link href="/moderation">Moderation</Link>
                      <Link href="/parent">Parent Dashboard</Link>
                    </>
                  )}
                  <span className="opacity-70 hidden sm:inline">
                    {user.email}
                  </span>
                  <Link href="/logout" className="btn-mc">Log out</Link>
                </>
              ) : (
                <Link href="/login" className="btn-mc">Log in</Link>
              )}
            </div>
          </nav>
        </header>

        {/* Page content */}
        <main className="mx-auto max-w-5xl px-3 py-6">{children}</main>
      </body>
    </html>
  );
}