import "./globals.css";
import AuthButtons from "@/components/AuthButtons";
import MainNav from "@/components/MainNav";
import { createServerClient } from "@/lib/supabaseServer"; // or your supabaseServer() helper

const ADMIN_EMAIL = "wenyu.yan@gmail.com";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServerClient(); // or supabaseServer()
  const { data } = await supabase.auth.getUser();
  const user = data?.user ?? null;
  const isLoggedIn = !!user;
  const isAdmin =
    (user?.email || "").toLowerCase() === ADMIN_EMAIL.toLowerCase();

  return (
    <html lang="en">
      <body className="bg-mc-grass text-mc-ink">
        <header className="sticky top-0 z-40 border-b bg-mc-sky/60 backdrop-blur supports-[backdrop-filter]:bg-mc-sky/40">
          {/* Left: brand + nav; Right: auth */}
          <div className="mx-auto max-w-5xl flex items-center justify-between">
            <MainNav isLoggedIn={isLoggedIn} isAdmin={isAdmin} />
            <div className="px-3">
              <AuthButtons />
            </div>
          </div>
        </header>

        <div className="banner-placeholder">
          <div className="mx-auto max-w-5xl px-3 h-full flex items-center justify-center">
            <p className="font-mc text-xs opacity-80">
              Banner placeholder — replace this area later
            </p>
          </div>
        </div>

        <main className="mx-auto max-w-5xl w-full px-3 py-5">{children}</main>
      </body>
    </html>
  );
}