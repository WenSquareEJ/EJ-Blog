// /app/layout.tsx
import './globals.css'

export const metadata = {
  title: 'EJ Blog',
  description: 'Family blog',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-mc-grass/10 text-mc-ink antialiased">
        {children}
      </body>
    </html>
  )
}
