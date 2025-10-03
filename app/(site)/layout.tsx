// app/(site)/layout.tsx
import "./globals.css";
import Link from "next/link";
import { createServerClient } from "@/lib/supabaseServer"; // server-side
import AuthButtons from "@/components/AuthButtons";
import NewPostLink from "@/components/NewPostLink";
import ModerationQueueLink from "@/components/ModerationQueueLink";
import ParentDashboardLink from "@/components/ParentDashboardLink";
import AIHelper from "@/components/AIHelper"; // shows for everyone

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const adminEmail = (process.env.ADMIN_EMAIL || "").toLowerCase();
  const isAdmin = !!user?.email && user.email.toLowerCase() === adminEmail;

  return (
    <html lang="en">
      <body className="bg-mc-grass text-mc-ink">
        {/* Top Nav */}
        <header className="sticky top-0 z-40 border-b bg-mc-sky/60 backdrop-blur supports-[backdrop-filter]:bg-mc-sky/40">
          <nav className="mx-auto flex max-w-5xl items-center gap-3 px-3 py-2">
            {/* Left */}
            <div className="flex gap-3 font-mc items-center">
              <Link href="/" className="hover:underline">Home</Link>
              <Link href="/calendar" className="hover:underline">Calendar</Link>
              <Link href="/tags" className="hover:underline">Tags</Link>
              <Link href="/blog" className="hover:underline">Blog</Link>
              <Link href="/minecraft-zone" className="hover:underline">Minecraft Zone</Link>
              <Link href="/scratch-board" className="hover:underline">Scratch Board</Link>
              <Link href="/milestones" className="hover:underline">Milestones</Link>
              <Link href="/badges" className="hover:underline">Badges</Link>
              <Link href="/about" className="hover:underline">About</Link>
            </div>

            {/* Right */}
            <div className="ml-auto flex items-center gap-2">
              {/* Show when logged in */}
              {user && (
                <>
                  <NewPostLink />
                  {isAdmin && (
                    <>
                      <ModerationQueueLink />
                      <ParentDashboardLink />
                    </>
                  )}
                </>
              )}

              {/* Auth area (Login / Logout) */}
              <AuthButtons />
            </div>
          </nav>
        </header>

        {/* Page */}
        <main className="mx-auto grid max-w-5xl grid-cols-1 gap-6 px-3 py-6 lg:grid-cols-[1fr_280px]">
          <section>{children}</section>

          {/* Right Sidebar — AI Helper shows to everyone */}
          <aside className="hidden lg:block">
            <AIHelper />
          </aside>
        </main>
      </body>
    </html>
  );
}