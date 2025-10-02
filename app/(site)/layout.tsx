import '../globals.css'
import LogoPlaceholder from '@/components/LogoPlaceholder'
import BannerPlaceholder from '@/components/BannerPlaceholder'
import Link from 'next/link'
import AuthStatus from '@/components/AuthStatus'
import ThemeToggle from '@/components/ThemeToggle' // keep if you already added it

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-skin="minecraft"> {/* <-- force Minecraft skin */}
      <head>
        {/* Pixel font (lightweight & kid-friendly) */}
        <link href="https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@400;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-mc-sky">
        <header className="sticky top-0 z-50 backdrop-blur bg-mc-sky/80 border-b border-mc-stone/30">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <LogoPlaceholder />
            <nav className="flex items-center gap-5 text-sm">
              <Link href="/">Home</Link>
              <Link href="/calendar">Calendar</Link>
              <Link href="/tags">Tags</Link>
              <Link href="/about">About</Link>
              <div className="w-px h-5 bg-mc-stone/40" />
              <AuthStatus />
              {/* <ThemeToggle />  optional with dark mode */}
            </nav>
          </div>
          <div className="max-w-4xl mx-auto px-4"><BannerPlaceholder /></div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-6">{children}</main>
        <div className="pixel-divider mt-10" />
        <footer className="max-w-4xl mx-auto px-4 py-6 text-xs text-mc-stone">© {new Date().getFullYear()} EJ’s Blog</footer>
      </body>
    </html>
  )
}
