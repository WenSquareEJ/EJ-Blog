// app/api/profile/avatar/route.ts
import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

const ALLOWED_AVATARS = [
  "alex.png",
  "bluey.png",
  "creeper.png",
  "enderman.png",
  "erik_steve.png",
  "scientist.png",
  "skeleton.png",
  "villager.png",
  "waffle.png",
  "zombie.png",
];

export async function POST(req: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Accept either { filename } or { avatar }
    const body = await req.json().catch(() => ({}));
    const raw = body?.filename ?? body?.avatar;
    const filename = typeof raw === "string" ? raw : "";

    if (!ALLOWED_AVATARS.includes(filename)) {
      return NextResponse.json(
        { ok: false, error: "Invalid avatar filename." },
        { status: 400 }
      );
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      return NextResponse.json(
        { ok: false, error: `Auth error: ${userError.message}` },
        { status: 401 }
      );
    }
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Not authenticated." },
        { status: 401 }
      );
    }

    // Create the row if missing, otherwise update
    const { data: existing, error: selErr } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (selErr) {
      return NextResponse.json(
        { ok: false, error: `Select policy error: ${selErr.message}` },
        { status: 400 }
      );
    }

    if (!existing) {
      const { error: insErr } = await supabase
        .from("profiles")
        .insert({ id: user.id, avatar: filename });

      if (insErr) {
        return NextResponse.json(
          { ok: false, error: `Insert policy error: ${insErr.message}` },
          { status: 400 }
        );
      }
    } else {
      const { error: updErr } = await supabase
        .from("profiles")
        .update({ avatar: filename })
        .eq("id", user.id);

      if (updErr) {
        return NextResponse.json(
          { ok: false, error: `Update policy error: ${updErr.message}` },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Unknown server error" },
      { status: 500 }
    );
  }
}