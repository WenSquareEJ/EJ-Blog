// /app/(site)/layout.tsx
import "./globals.css";
import supabaseServer from "@/lib/supabaseServer";
import AskEbot from "@/components/AskEbot";
import NavBar from "@/components/navbar";
import ToastViewport from "@/components/Toast";
import HomeBackground from "@/components/HomeBackground";

// --- force this layout to run on every request (no caching) ---
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export const metadata = {
  title: "EJ Blog",
  description: "Family blog in Minecraft style",
};

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ---------- Auth (server-side) ----------
  const sb = supabaseServer();
  const { data: userRes } = await sb.auth.getUser();
  const user = userRes?.user ?? null;

  const adminEmail =
    process.env.NEXT_PUBLIC_ADMIN_EMAIL?.toLowerCase() ??
    "wenyu.yan@gmail.com";

  const navUser = user
    ? {
        id: user.id,
        email: user.email ?? null,
      }
    : null;

  return (
    <html lang="en">
      <body className="theme-wood bg-mc-sky text-mc-ink min-h-screen flex flex-col">
        <HomeBackground />
        <NavBar initialUser={navUser} adminEmail={adminEmail} />

        <div className="banner-placeholder">
          <div className="mx-auto flex h-full max-w-5xl items-center justify-center px-4">
            <p className="text-xs font-mc uppercase tracking-[0.18em] text-mc-parchment opacity-80 md:text-sm">
              BLOCKS AND BOTS
            </p>
          </div>
        </div>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
          <div className="site-content-surface">
            {children}
          </div>
        </main>

        <ToastViewport />

        <AskEbot />
      </body>
    </html>
  );
}
