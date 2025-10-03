import "./globals.css";
import Link from "next/link";
import AuthButtons from "@/components/AuthButtons";
import { createServerClient } from "@/lib/supabaseServer"; // <- uses your server helper

const ADMIN_EMAIL = "wenyu.yan@gmail.com";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get user server-side
  const supabase = createServerClient();
  const { data } = await supabase.auth.getUser();
  const user = data?.user ?? null;

  const isAdmin =
    (user?.email || "").toLowerCase() === ADMIN_EMAIL.toLowerCase();

  return (
    <html lang="en">
      <body className="bg-mc-grass text-mc-ink">
        {/* Top Nav */}
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
            <ul className="flex-1 flex items-center gap-1 overflow-x-auto whitespace-nowrap pr-2">
              <li><Link className="btn-mc" href="/">Home</Link></li>
              <li><Link className="btn-mc" href="/calendar">Calendar</Link></li>
              <li><Link className="btn-mc" href="/tags">Tags</Link></li>

              {/* Admin-only */}
              {isAdmin && (
                <>
                  <li><Link className="btn-mc" href="/parent">Parent Zone</Link></li>
                  <li><Link className="btn-mc" href="/moderation">Moderation</Link></li>
                </>
              )}

              {/* New Post: visible to any logged-in user */}
              {user && (
                <li><Link className="btn-mc" href="/post/new">New Post</Link></li>
              )}
            </ul>

            {/* Auth (right) */}
            <div className="ml-2 flex items-center gap-2">
              <AuthButtons />
              {/* Tiny debug badge to confirm which user is logged in */}
              {user && (
                <span className="text-[10px] opacity-60">
                  ({user.email})
                </span>
              )}
            </div>
          </nav>
        </header>

        {/* Banner placeholder (under nav) */}
        <div className="banner-placeholder">
          <div className="mx-auto max-w-5xl px-3 h-full flex items-center justify-center">
            <p className="font-mc text-xs opacity-80">
              Banner placeholder — replace this area later
            </p>
          </div>
        </div>

        {/* Page content */}
        <main className="mx-auto max-w-5xl w-full px-3 py-5">{children}</main>
      </body>
    </html>
  );
}