// /app/(site)/layout.tsx
import type { Metadata } from "next";
import Link from "next/link";
import "../globals.css"; // <-- globals.css lives in /app

import { Press_Start_2P, Pixelify_Sans } from "next/font/google";

// Pixel font for headings / nav (chunky)
const mcFont = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-mc",
});

// Readable pixel font for main body
const pixelBody = Pixelify_Sans({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-pixel",
});

export const metadata: Metadata = {
  title: "EJ Blog",
  description: "Minecraft-styled blog",
};

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${mcFont.variable} ${pixelBody.variable}`}>
      <body className="bg-mc-grass text-mc-ink">
        {/* Banner placeholder (optional) */}
        <div className="w-full border-b bg-mc-grass/40 backdrop-blur-sm">
          <div className="mx-auto max-w-5xl px-4 py-3 text-center" />
        </div>

        {/* Top Nav */}
        <header className="sticky top-0 z-40 border-b bg-mc-sky/60 backdrop-blur supports-[backdrop-filter]:bg-mc-sky/40">
          <div className="mx-auto max-w-5xl px-4 py-3 flex items-center gap-3">
            <Link
              href="/"
              className="shrink-0 font-mc text-xl leading-none hover:opacity-90"
            >
              EJ Blog
            </Link>

            <nav className="flex-1 overflow-x-auto">
              <ul className="flex items-center gap-2 whitespace-nowrap pr-2">
                <li><Link className="btn-mc" href="/">Home</Link></li>
                <li><Link className="btn-mc" href="/calendar">Calendar</Link></li>
                <li><Link className="btn-mc" href="/tags">Tags</Link></li>
                <li><Link className="btn-mc" href="/badges">Badges</Link></li>
                <li><Link className="btn-mc" href="/moderation">Moderation</Link></li>
                <li><Link className="btn-mc" href="/post/new">New Post</Link></li>
              </ul>
            </nav>

            <div className="flex items-center gap-2">
              <Link className="btn-mc-secondary" href="/login">Log in</Link>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="mx-auto max-w-5xl w-full px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
