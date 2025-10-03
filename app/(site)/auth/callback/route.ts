import { NextResponse } from "next/server";
import supabaseServer from "@/lib/supabaseServer";

export async function POST(req: Request) {
  const { event, session } = await req.json().catch(() => ({} as any));
  const sb = supabaseServer();

  // Keep the server cookies in sync with the browser session
  if (event === "SIGNED_OUT" || event === "USER_DELETED") {
    await sb.auth.signOut();
  } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
    if (session?.access_token && session?.refresh_token) {
      await sb.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });
    }
  }
  return NextResponse.json({ ok: true });
}