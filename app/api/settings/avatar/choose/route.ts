import { NextResponse } from "next/server";
import { AVATAR_OPTIONS, getErikUserId, isAvatarFilename, AvatarFilename } from "@/lib/erik";

import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const raw = String(body?.filename ?? "");
    const normalized = raw.trim().toLowerCase().replace(/^.*[\\/]/, ""); // remove paths if any

    if (!isAvatarFilename(normalized)) {
      return NextResponse.json({ ok: false, error: "Invalid avatar filename." }, { status: 400 });
    }

    // Get requester user
    const supabase = createRouteHandlerClient({ cookies });
    let requesterUserId: string | null = null;
    let requesterEmail: string | null = null;
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (user) {
        requesterUserId = user.id;
        requesterEmail = user.email ?? null;
      }
    } catch {}

    // Fallback: try to get from Authorization header if present
    // (skipped for simplicity, Next.js API routes usually have session)

    // Get Erik's user ID
    const erikUserId = await getErikUserId();
    if (!erikUserId) {
      return NextResponse.json({ error: "Erik user not found" }, { status: 500 });
    }

    // Security: Only Erik or admin can change
    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
    if (
      requesterUserId !== erikUserId &&
      requesterEmail !== adminEmail
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update Erik's user_metadata.avatar
    const { error: updateError } = await supabase.auth.admin.updateUserById(erikUserId, {
  user_metadata: { avatar: normalized as AvatarFilename },
    });
    if (updateError) {
      return NextResponse.json({ error: "Failed to update avatar" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
