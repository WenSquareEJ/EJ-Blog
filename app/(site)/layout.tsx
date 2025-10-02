import './globals.css'
import type { ReactNode } from 'react'

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="site-banner">
          Minecraft Blog Banner Placeholder
        </div>
        <main className="p-4">
          {children}
        </main>
      </body>
    </html>
  )
}
