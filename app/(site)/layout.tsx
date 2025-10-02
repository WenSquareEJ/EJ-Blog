// /app/(site)/layout.tsx
import type { Metadata } from "next";
import Link from "next/link";
import "../globals.css";

import { Press_Start_2P, Pixelify_Sans } from "next/font/google";

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

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${mcFont.variable} ${pixelBody.variable}`}>
      <body className="bg-mc-grass text-mc-ink">
        {/* Top Nav (brand on the left, tabs on the right) */}
        <header className="sticky top-0 z-40 border-b bg-mc-sky/60 backdrop-blur supports-[backdrop-filter]:bg-mc-sky/40">
          <div className="mx-auto max-w-5xl px-3 py-2 flex items-center gap-3">
            <Link
              href="/"
              className="shrink-0 font-mc text-base md:text-lg leading-none hover:opacity-90"
            >
              EJ Blog
            </Link>

            <nav className="flex-1 overflow-x-auto">
              <ul className="flex items-center gap-1.5 whitespace-nowrap pr-2">
                <li><Link className="btn-mc" href="/">Home</Link></li>
                <li><Link className="btn-mc" href="/calendar">Calendar</Link></li>
                <li><Link className="btn-mc" href="/tags">Tags</Link></li>
                {/* Removed "Badges" */}
                <li><Link className="btn-mc" href="/moderation">Moderation</Link></li>
                <li><Link className="btn-mc" href="/post/new">New Post</Link></li>
              </ul>
            </nav>

            <div className="flex items-center gap-1.5">
              <Link className="btn-mc-secondary" href="/login">Log in</Link>
            </div>
          </div>
        </header>

        {/* Banner placeholder (green strip under the nav) */}
        <div className="banner-placeholder">
          <div className="mx-auto max-w-5xl px-3 h-full flex items-center justify-center">
            {/* (optional) put banner text or image here */}
            {/* <span className="font-mc text-sm md:text-base">Your banner here</span> */}
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
