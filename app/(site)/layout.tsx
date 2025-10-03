// /app/(site)/layout.tsx
import "./globals.css";
import Link from "next/link";
import AIHelper from "@/components/AIHelper"; // uses your existing component
import { createServerSupabase } from "@/lib/createServerClient";

const ADMIN_EMAIL = "wenyu.yan@gmail.com";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get current user on the server (reliable for nav visibility)
  const supabase = createServerSupabase();
  const { data } = await supabase.auth.getUser();
  const user = data.user ?? null;

  const isLoggedIn = !!user;
  const isAdmin =
    !!user?.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

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
            <div className="flex-1 overflow-x-auto">
              <ul className="flex items-center gap-1 whitespace-nowrap pr-2">
                {/* Keep your main links visible to everyone */}
                <li><Link className="btn-mc" href="/">Blog</Link></li>
                <li><Link className="btn-mc" href="/minecraft-zone">Minecraft Zone</Link></li>
                <li><Link className="btn-mc" href="/scratch-board">Scratch Board</Link></li>
                <li><Link className="btn-mc" href="/badger">Badger</Link></li>
                <li><Link className="btn-mc" href="/calendar">Calendar</Link></li>
                <li><Link className="btn-mc" href="/tags">Tags</Link></li>

                {/* Show New Post for any logged-in user */}
                {isLoggedIn && (
                  <li><Link className="btn-mc" href="/post/new">New Post</Link></li>
                )}

                {/* Show Parent/Moderation Zone only for admin */}
                {isAdmin && (
                  <li><Link className="btn-mc" href="/moderation">Parent Zone</Link></li>
                )}
              </ul>
            </div>

            {/* Auth (right) */}
            <div className="ml-2">
              {!isLoggedIn ? (
                <Link className="btn-mc-secondary" href="/login">Log in</Link>
              ) : (
                <form action="/logout" method="post">
                  <button className="btn-mc-secondary" type="submit">Log out</button>
                </form>
              )}
            </div>
          </nav>
        </header>

        {/* Banner placeholder (under nav) — keep your reminder */}
        <div className="banner-placeholder">
          <div className="mx-auto max-w-5xl px-3 h-full flex items-center justify-center">
            <p className="font-pixel text-xs opacity-70">
              Banner placeholder — add artwork here
            </p>
          </div>
        </div>

        {/* Page content */}
        <main className="mx-auto max-w-5xl w-full px-3 py-5">
          {children}
        </main>

        {/* Always-on AI Helper (uses your existing component) */}
        {/* Ensure AIHelper internally uses: className="fixed bottom-4 right-4 z-50" */}
        <AIHelper />
      </body>
    </html>
  );
}