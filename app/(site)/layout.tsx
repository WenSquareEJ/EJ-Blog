// app/(site)/layout.tsx
import Link from "next/link";
import "./globals.css";
import { Press_Start_2P } from "next/font/google";

const pixel = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className={`${pixel.className} min-h-screen overflow-x-hidden bg-mc-grass`}>
        <header className="w-full border-b border-mc-stone/30 bg-mc-dirt/10">
          <nav className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
            <Link href="/" className="text-mc-emerald">EJ Blog</Link>
            <div className="flex gap-4 text-sm">
              <Link href="/">Home</Link>
              <Link href="/tags">Tags</Link>
              <Link href="/moderation">Moderation</Link>
              <Link href="/login">Login</Link>
            </div>
          </nav>
        </header>

        <main className="mx-auto max-w-5xl px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
