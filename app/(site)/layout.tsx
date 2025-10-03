// /app/(site)/layout.tsx
import "./globals.css";
import Link from "next/link";
import { supabaseServer } from "@/lib/supabaseServer";
import AIHelper from "@/components/AIHelper"; // uses your existing component

export const metadata = {
  title: "EJ Blog",
  description: "Family blog in Minecraft style",
};

// change this if you add more admins
const ADMIN_EMAIL = "wenyu.yan@gmail.com";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ---------- Auth (server-side) ----------
  const sb = supabaseServer();
  const { data: userRes } = await sb.auth.getUser();
  const user = userRes?.user ?? null;
  const isLoggedIn = Boolean(user);
  const isAdmin =
    !!user?.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  return (
    <html lang="en">
      <body className="bg-mc-grass text-mc-ink">
        {/* ---------- Top Nav ---------- */}
        <header className="sticky top-0 z-40 border-b bg-mc-sky/60 backdrop-blur supports-[backdrop-filter]:bg-mc-sky/40">
          <nav className="mx-auto max-w-5xl px-3 py-2 flex items-center gap-2">
            {/* Brand (left) */}
            <Link
              href="/"
              className="shrink-0 font-mc text-sm md:text-base leading-none hover:opacity-90"
            >
              EJ Blog
            </Link>

            {/* Tabs (center) */}
            <ul className="flex-1 overflow-x-auto flex items-center gap-1 whitespace-nowrap pr-2">
              {/* Public sections */}
              <li><Link href="/" className="btn-mc">Blog</Link></li>
              <li><Link href="/minecraft-zone" className="btn-mc">Minecraft Zone</Link></li>
              <li><Link href="/scratch-board" className="btn-mc">Scratch Board</Link></li>
              <li><Link href="/badger" className="btn-mc">Badger</Link></li>
              <li><Link href="/calendar" className="btn-mc">Calendar</Link></li>
              <li><Link href="/tags" className="btn-mc">Tags</Link></li>

              {/* Logged-in only */}
              {isLoggedIn && (
                <li><Link href="/post/new" className="btn-mc">New Post</Link></li>
              )}

              {/* Admin-only (Parent/Moderation Zone is a single page at /moderation) */}
              {isAdmin && (
                <li><Link href="/moderation" className="btn-mc">Parent / Moderation</Link></li>
              )}
            </ul>

            {/* Auth (right) */}
            <div className="ml-1 shrink-0">
              {!isLoggedIn ? (
                <Link className="btn-mc-secondary" href="/login">
                  Log in
                </Link>
              ) : (
                <form action="/logout" method="post">
                  <button type="submit" className="btn-mc-secondary">
                    Log out
                  </button>
                </form>
              )}
            </div>
          </nav>
        </header>

        {/* ---------- Banner placeholder (under nav) ---------- */}
        <div className="banner-placeholder">
          <div className="mx-auto max-w-5xl px-3 h-full flex items-center justify-center">
            {/* Keep this text to remind: */}
            <p className="text-xs md:text-sm opacity-80">
              Banner placeholder — add your image or text here later.
            </p>
          </div>
        </div>

        {/* ---------- Page content ---------- */}
        <main className="mx-auto max-w-5xl w-full px-3 py-5">
          {children}
        </main>

        {/* ---------- AI Helper on every page (bottom-right) ---------- */}
        {/* Your existing AIHelper component is rendered; make sure it positions itself fixed bottom-right. */}
        <AIHelper />
      </body>
    </html>
  );
}