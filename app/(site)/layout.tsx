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
  title: "EJ Blocks and Bots",
  description: "EJ Minecraft-inspired world of stories, science, and coding adventures!",
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
