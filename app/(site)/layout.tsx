// /app/(site)/layout.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { supabaseServer } from "@/lib/supabaseServer";

import { Press_Start_2P, Pixelify_Sans } from "next/font/google";

// Pixel fonts
const mcFont = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-mc",
});

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
  const sb = supabaseServer();
  const { data: userRes } = await sb.auth.getUser();
  const isLoggedIn = Boolean(userRes?.user);

  return (
    <html lang="en" className={`${mcFont.variable} ${pixelBody.variable}`}>
      <body className="bg-mc-grass text-mc-ink font-pixel">
        {/* Top Navigation */}
        <header className="sticky top-0 z-40 border-b-4 border-mc-dirt bg-mc-sky/70 backdrop-blur">
          <div className="mx-auto max-w-6xl px-4 py-3 flex items-center">
            {/* Brand */}
            <Link
              href="/"
              className="font-mc text-base md:text-lg tracking-wide hover:opacity-90"
            >
              EJ Blog
            </Link>

            {/* Nav Links */}
            <nav className="flex-1 ml-6">
              <ul className="flex flex-wrap gap-2">
                <li><Link className="btn-mc" href="/">Home</Link></li>
                <li><Link className="btn-mc" href="/calendar">Calendar</Link></li>
                <li><Link className="btn-mc" href="/tags">Tags</Link></li>
                <li><Link className="btn-mc" href="/milestones">Milestones</Link></li>
                <li><Link className="btn-mc" href="/minecraft-zone">Minecraft Zone</Link></li>
                <li><Link className="btn-mc" href="/scratch-board">Scratch Board</Link></li>
                <li><Link className="btn-mc" href="/badges">Badges</Link></li>
                {isLoggedIn && (
                  <li><Link className="btn-mc" href="/post/new">New Post</Link></li>
                )}
              </ul>
            </nav>

            {/* Auth */}
            <div className="ml-3">
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

        {/* Banner Placeholder */}
        <div className="banner-placeholder bg-mc-leaf text-center py-6 text-mc-ink font-mc">
          🌱 Banner Placeholder (custom banner goes here)
        </div>

        {/* Page Content */}
        <main className="mx-auto max-w-6xl w-full px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
