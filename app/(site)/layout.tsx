// /app/(site)/layout.tsx
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import "../globals.css";
import Link from "next/link";
import { supabaseServer } from "@/lib/supabaseServer";
import AIHelper from "@/components/AIHelper";
import LogoutButton from '@/components/LogoutButton';

const ADMIN_EMAIL = "wenyu.yan@gmail.com";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sb = supabaseServer();
  const { data: userRes } = await sb.auth.getUser();
  const user = userRes?.user || null;
  const isLoggedIn = Boolean(user);
  const isAdmin = !!user?.email && user.email.toLowerCase() === ADMIN_EMAIL;

  return (
    <html lang="en">
      <body className="bg-mc-grass text-mc-ink">
        {/* Top Nav */}
        <header className="sticky top-0 z-40 border-b bg-mc-sky/60 backdrop-blur supports-[backdrop-filter]:bg-mc-sky/40">
          <div className="mx-auto max-w-5xl px-3 py-2 flex items-center">
            {/* Brand (left) */}
            <Link
              href="/"
              className="shrink-0 font-mc text-sm md:text-base leading-none hover:opacity-90"
            >
              EJ Blog
            </Link>

            {/* Tabs (center) */}
            <nav className="flex-1 overflow-x-auto ml-3">
              <ul className="flex items-center gap-1 whitespace-nowrap pr-2">
                <li><Link className="btn-mc" href="/">Home</Link></li>
                <li><Link className="btn-mc" href="/calendar">Calendar</Link></li>
                <li><Link className="btn-mc" href="/milestones">Milestones</Link></li>
                <li><Link className="btn-mc" href="/minecraft-zone">Minecraft Zone</Link></li>
                <li><Link className="btn-mc" href="/scratch-board">Scratch Board</Link></li>
                <li><Link className="btn-mc" href="/tags">Tags</Link></li>
                {isAdmin && (
                  <>
                    <li><Link className="btn-mc" href="/moderation">Moderation</Link></li>
                    <li><Link className="btn-mc" href="/parent">Parent Zone</Link></li>
                  </>
                )}
                {isLoggedIn && <li><Link className="btn-mc" href="/post/new">New Post</Link></li>}
              </ul>
            </nav>

           {/* Auth (right) */}
{!isLoggedIn ? (
  <Link className="btn-mc-secondary" href="/login">Log in</Link>
) : (
  <LogoutButton />
)}
            </div>
          </div>
        </header>

        {/* Banner placeholder */}
        <div className="banner-placeholder">
          <div className="mx-auto max-w-5xl px-3 h-full flex items-center justify-center">
            <span className="text-xs md:text-sm opacity-80">
              Banner placeholder — drop in your image or message here later.
            </span>
          </div>
        </div>

        {/* Page content */}
        <main className="mx-auto max-w-5xl w-full px-3 py-5">{children}</main>

        {/* Floating AI helper */}
        <AIHelper />
      </body>
    </html>
  );
}