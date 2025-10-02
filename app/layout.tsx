// /app/layout.tsx
import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'EJ Blog',
  description: 'Family blog',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      {/* Safari/iOS overflow fix lives in globals.css, but we keep a predictable structure here */}
      <body className="min-h-screen bg-mc-grass/20 text-mc-charcoal antialiased">
        {children}
      </body>
    </html>
  )
}
