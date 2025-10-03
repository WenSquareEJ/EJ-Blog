// /app/auth/callback/route.ts
import { NextResponse } from "next/server";
import supabaseServer from "@/lib/supabaseServer";

// Handle client->server auth state sync (password sign-in, sign-out, token refresh)
export async function POST(req: Request) {
  const supabase = supabaseServer();
  const { event, session } = await req.json();

  try {
    if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
      // Persist the session into HTTP-only cookies
      await supabase.auth.setSession(session);
    }
    if (event === "SIGNED_OUT") {
      await supabase.auth.signOut();
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 400 });
  }
}

// Optional: supports OAuth or magic link redirect
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  if (code) {
    const supabase = supabaseServer();
    await supabase.auth.exchangeCodeForSession(code);
  }
  return NextResponse.redirect(
    new URL("/", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000")
  );
}