import { NextResponse } from "next/server";
import supabaseRoute from "@/lib/supabaseRoute";

export async function POST(req: Request) {
  const { event, session } = await req.json().catch(() => ({}) as any);
  const response = NextResponse.json({ ok: true });
  const supabase = supabaseRoute(response);

  if (event === "SIGNED_OUT" || event === "USER_DELETED") {
    await supabase.auth.signOut();
  }

  if (
    (event === "SIGNED_IN" ||
      event === "INITIAL_SESSION" ||
      event === "TOKEN_REFRESHED" ||
      event === "USER_UPDATED") &&
    session?.access_token &&
    session?.refresh_token
  ) {
    await supabase.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    });
  }

  return response;
}

export async function GET(req: Request) {
  const requestUrl = new URL(req.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/";

  const origin =
    process.env.NEXT_PUBLIC_SITE_URL || requestUrl.origin;
  const redirectUrl = new URL(next, origin);
  const response = NextResponse.redirect(redirectUrl);

  if (!code) {
    return response;
  }

  const supabase = supabaseRoute(response);
  await supabase.auth.exchangeCodeForSession(code);

  return response;
}
