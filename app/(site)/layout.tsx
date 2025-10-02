import Link from 'next/link'
// @ts-expect-error Server Component
import AuthButtons from '@/components/AuthButtons'

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-mc-grass">
      <header className="sticky top-0 z-50 bg-mc-leaves/90 backdrop-blur border-b border-mc-stem">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center gap-4">
          <Link href="/" className="shrink-0 font-mc text-xl">EJ Blog</Link>

          {/* Nav never clips; it wraps if needed */}
          <nav className="min-w-0 flex-1">
            <ul className="flex flex-wrap items-center gap-4 text-sm">
              <li><Link href="/">Home</Link></li>
              <li><Link href="/calendar">Calendar</Link></li>
              <li><Link href="/tags">Tags</Link></li>
              <li><Link href="/about">About</Link></li>
            </ul>
          </nav>

          {/* Auth area stays visible; no overflow/ellipsis */}
          <div className="flex-none">
            <AuthButtons />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  )
}
