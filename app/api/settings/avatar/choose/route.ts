import { NextResponse } from "next/server";

import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { createServerClient } from "@supabase/ssr";
import { isAvatarFilename, normalizeAvatarFilename, AvatarFilename } from "@/lib/erik";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    // 1) Try cookie-based session first
    const supabaseCookie = createRouteHandlerClient({ cookies });
    let { data: { user }, error } = await supabaseCookie.auth.getUser();

    // 2) If no user, try Bearer token fallback
    if (!user) {
      const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
      const match = authHeader?.match(/^Bearer\s+(.+)$/i);
      const accessToken = match?.[1];

      if (accessToken) {
        const supabaseBearer = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            global: {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            },
            cookies: {
              get() { return undefined; },
              set() {},
              remove() {},
            },
          }
        );
        const res = await supabaseBearer.auth.getUser();
        user = res.data.user ?? null;
        error = res.error ?? null;
      }
    }

    if (!user) {
      return NextResponse.json({ ok: false, error: "Not authenticated." }, { status: 401 });
    }

    // Validate filename
    const body = await req.json().catch(() => ({}));
    const raw = String(body?.filename ?? "");
    const normalized = normalizeAvatarFilename(raw);
    if (!isAvatarFilename(normalized)) {
      return NextResponse.json({ ok: false, error: "Invalid avatar filename." }, { status: 400 });
    }

    // Restrict updates to Erik only
    const { data: erikProfile, error: erikError } = await supabaseCookie
      .from("profiles")
      .select("id")
      .eq("username", "Erik")
      .single();

    if (erikError || !erikProfile || user.id !== erikProfile.id) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    // Upsert into profiles (no admin calls)
    const { error: upsertError } = await supabaseCookie
      .from("profiles")
      .upsert({ id: user.id, avatar: normalized as AvatarFilename }, { onConflict: "id" });

    if (upsertError) {
      return NextResponse.json({ ok: false, error: upsertError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
