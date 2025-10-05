

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
  const supabase = createRouteHandlerClient({ cookies });
  const { filename } = await req.json();
  if (!filename || typeof filename !== "string" || !ALLOWED_AVATARS.includes(filename)) {
    return NextResponse.json({ ok: false, error: "Invalid avatar filename." }, { status: 400 });
  }

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ ok: false, error: "Not authenticated." }, { status: 401 });
  }

  // Upsert profile row
  const { error: upsertError } = await supabase
    .from("profiles")
    .upsert({ id: user.id, avatar: filename }, { onConflict: "id" });

  if (upsertError) {
    return NextResponse.json({ ok: false, error: upsertError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    // If form POST, redirect to home with toast
    if (!contentType.includes("application/json")) {
      return NextResponse.redirect("/", 303);
    }
    return NextResponse.json({ ok: true, avatarUrl });
  } catch (e) {
    console.warn('[api/profile/avatar] Unexpected error', e);
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
  }
}
