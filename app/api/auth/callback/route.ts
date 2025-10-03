// /app/auth/callback/route.ts
import { NextResponse } from "next/server";
import supabaseRoute from "@/lib/supabaseRoute";

// Handle client->server auth state sync (password sign-in, sign-out, token refresh)
export async function POST(req: Request) {
  const { event, session } = await req.json().catch(() => ({}) as any);
  const response = NextResponse.json({ ok: true });
  const supabase = supabaseRoute(response);

  if (event === "SIGNED_OUT" || event === "USER_DELETED") {
    await supabase.auth.signOut();
    return response;
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

// Optional: supports OAuth or magic link redirect
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const redirect = requestUrl.searchParams.get("redirect_to") ?? "/";
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL || requestUrl.origin;
  const response = NextResponse.redirect(new URL(redirect, origin));

  if (!code) {
    return response;
  }

  const supabase = supabaseRoute(response);
  await supabase.auth.exchangeCodeForSession(code);

  return response;
}
