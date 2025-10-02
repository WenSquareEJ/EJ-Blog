// /app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'
import { Press_Start_2P } from 'next/font/google'

// Pixel font used across the site
const mc = Press_Start_2P({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-mc',
})

export const metadata: Metadata = {
  title: 'EJ Blog',
  description: 'Minecraft-style blog',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={mc.variable}>
      {/* Site-wide background + text color */}
      <body className="min-h-screen bg-mc-grass text-mc-ink">
        {children}
      </body>
    </html>
  )
}
