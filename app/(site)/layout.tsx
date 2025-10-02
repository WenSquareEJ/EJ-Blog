// app/(site)/layout.tsx
import './globals.css'
import Link from 'next/link'
import { Press_Start_2P } from 'next/font/google'

const mcFont = Press_Start_2P({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-mc',
})

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={mcFont.variable}>
      <body>
        <div className="min-h-screen grid grid-rows-[auto_auto_1fr]">

          {/* Banner placeholder */}
          <div className="w-full border-b bg-mc-grass/40 backdrop-blur-sm">
            <div className="mx-auto max-w-5xl px-4 py-3 text-center">
              {/* Put custom banner text/image here later */}
            </div>
          </div>

          {/* Top Nav – scrollable center to avoid “…” overflow */}
          <header className="sticky top-0 z-40 border-b bg-mc-sky/60 backdrop-blur supports-[backdrop-filter]:bg-mc-sky/40">
            <div className="mx-auto max-w-5xl px-4 py-3 flex items-center gap-3">
              <Link href="/" className="shrink-0 font-mc text-xl leading-none hover:opacity-90">
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
          <main className="mx-auto max-w-5xl w-full px-4 py-6">{children}</main>
        </div>
      </body>
    </html>
  )
}
