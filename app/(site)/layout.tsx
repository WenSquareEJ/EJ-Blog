// /app/(site)/layout.tsx
import Link from "next/link";
import NewPostLink from "@/components/NewPostLink";
import "../globals.css";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Top Nav */}
      <header className="sticky top-0 z-40 border-b bg-mc-sky/60 backdrop-blur supports-[backdrop-filter]:bg-mc-sky/40">
        <div className="mx-auto max-w-5xl px-3 py-2 flex items-center gap-2">
          {/* Brand (left) */}
          <Link
            href="/"
            className="shrink-0 font-mc text-sm md:text-base leading-none hover:opacity-90"
          >
            EJ Blog
          </Link>

          {/* Tabs (center) */}
          <nav className="flex-1 overflow-x-auto ml-2">
            <ul className="flex items-center gap-1 whitespace-nowrap pr-2">
              <li><Link className="btn-mc" href="/">Home</Link></li>
              <li><Link className="btn-mc" href="/calendar">Calendar</Link></li>
              <li><Link className="btn-mc" href="/tags">Tags</Link></li>
              <li><Link className="btn-mc" href="/moderation">Moderation</Link></li>
              {/* Only shows if logged in (client-side) */}
              <li><NewPostLink /></li>
            </ul>
          </nav>

          {/* Auth (right) — simple link keeps things minimal */}
          <div className="ml-1">
            <Link className="btn-mc-secondary" href="/login">Log in</Link>
          </div>
        </div>
      </header>

      {/* Banner placeholder (under nav) */}
      <div className="banner-placeholder">
        <div className="mx-auto max-w-5xl px-3 h-full flex items-center justify-center">
          {/* Put banner text/image later if you’d like */}
        </div>
      </div>

      {/* Page content */}
      <main className="mx-auto max-w-5xl w-full px-3 py-5">
        {children}
      </main>
    </>
  );
}
