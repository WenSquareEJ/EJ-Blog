import '../globals.css'
import LogoPlaceholder from '@/components/LogoPlaceholder'
import BannerPlaceholder from '@/components/BannerPlaceholder'
import Link from 'next/link'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-skin="normal">
      <body className="bg-gray-100">
        <header className="bg-white border-b">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <LogoPlaceholder />
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/">Home</Link>
              <Link href="/calendar">Calendar</Link>
              <Link href="/badges">Badges</Link>
              <Link href="/about">About</Link>
            </nav>
          </div>
          <div className="max-w-4xl mx-auto px-4"><BannerPlaceholder /></div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-6">{children}</main>
        <div className="pixel-divider mt-10" />
        <footer className="max-w-4xl mx-auto px-4 py-6 text-xs text-gray-500">© {new Date().getFullYear()} Family Site · Privacy-first</footer>
      </body>
    </html>
  )
}
