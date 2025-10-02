// /app/(site)/layout.tsx
import type { Metadata } from "next";
import Link from "next/link";
import "../globals.css";

import { Press_Start_2P, Pixelify_Sans } from "next/font/google";
import { supabaseServer } from "@/lib/supabaseServer";

// Chunky pixel for brand + tabs
const mcFont = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-mc",
});

// Readable pixel for everything else
const pixelBody = Pixelify_Sans({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-pixel",
});

export const metadata: Metadata = {
  title: "EJ Blog",
  description: "Minecraft-styled blog",
};

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Logged-in check to conditionally show “New Post”
  const sb = supabaseServer();
  const { data: userRes } = await sb.auth.getUser();
  const isLoggedIn = Boolean(userRes?.user);

  return (
    <html lang="en" className={`${mcFont.variable} ${pixelBody.variable}`}>
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
                <li><Link className="btn-mc" href="/tags">Tags</Link></li>
                <li><Link className="btn-mc" href="/moderation">Moderation</Link></li>
                {isLoggedIn && (
                  <li><Link className="btn-mc" href="/post/new">New Post</Link></li>
                )}
              </ul>
            </nav>

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
          </div>
        </header>

        {/* Banner placeholder (under nav) */}
        <div className="banner-placeholder">
          <div className="mx-auto max-w-5xl px-3 h-full flex items-center justify-center">
            {/* optional banner content */}
          </div>
        </div>

        {/* Page content */}
        <main className="mx-auto max-w-5xl w-full px-3 py-5">
          {children}
        </main>
      </body>
    </html>
  );
}
