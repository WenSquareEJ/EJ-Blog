import Link from 'next/link'
import AuthButtons from '@/components/AuthButtons'
import './globals.css'

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-mc-grass">
        <header className="sticky top-0 z-40 bg-mc-leaf/80 backdrop-blur">
          <div className="mx-auto max-w-5xl px-4 py-3">
            <div className="flex items-center gap-3">
              <Link href="/" className="font-bold text-lg whitespace-nowrap">
                EJ Blog
              </Link>

              {/* Scrollable menu so it never collapses to "..." */}
              <nav className="flex-1 overflow-x-auto">
                <ul className="flex items-center gap-4 whitespace-nowrap">
                  <li><Link href="/" className="hover:underline">Home</Link></li>
                  <li><Link href="/calendar" className="hover:underline">Calendar</Link></li>
                  <li><Link href="/tags" className="hover:underline">Tags</Link></li>
                  <li><Link href="/about" className="hover:underline">About</Link></li>
                </ul>
              </nav>

              <div className="shrink-0">
                {/* @ts-expect-error Async Server Component is fine to use here */}
                <AuthButtons />
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  )
}
