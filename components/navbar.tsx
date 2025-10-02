// components/NavBar.tsx
"use client";

import Link from "next/link";

export default function NavBar({ AuthArea }: { AuthArea: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-40 bg-mc-sage/85 backdrop-blur supports-[backdrop-filter]:bg-mc-sage/70">
      <div className="mx-auto max-w-5xl px-4">
        <nav className="flex items-center gap-3 flex-wrap py-3">
          {/* Left: Logo / Title */}
          <Link href="/" className="shrink-0 whitespace-nowrap font-bold flex items-center gap-2">
            <span className="inline-block h-4 w-4 rounded-sm bg-mc-grass border border-mc-wood translate-y-0.5" />
            EJ Blog
          </Link>

          {/* Middle: Links (wraps if needed) */}
          <ul className="flex items-center gap-4 flex-wrap">
            <li><Link href="/" className="hover:underline whitespace-nowrap">Home</Link></li>
            <li><Link href="/calendar" className="hover:underline whitespace-nowrap">Calendar</Link></li>
            <li><Link href="/tags" className="hover:underline whitespace-nowrap">Tags</Link></li>
            <li><Link href="/about" className="hover:underline whitespace-nowrap">About</Link></li>
          </ul>

          {/* Right: Auth area – pinned to the edge, never truncated */}
          <div className="ms-auto shrink-0 whitespace-nowrap">
            {AuthArea /* your Login/Logout component */}
          </div>
        </nav>
      </div>
    </header>
  );
}
