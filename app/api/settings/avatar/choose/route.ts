import { NextResponse } from "next/server";
import { isAvatarFilename, normalizeAvatarFilename, AvatarFilename } from "@/lib/erik";

import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { filename } = await req.json();
    const normalized = normalizeAvatarFilename(String(filename || ""));
    if (!isAvatarFilename(normalized)) {
      return NextResponse.json({ ok: false, error: "Invalid avatar filename." }, { status: 400 });
    }
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ ok: false, error: "Not authenticated." }, { status: 401 });
    }
    const { error: upsertError } = await supabase
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
