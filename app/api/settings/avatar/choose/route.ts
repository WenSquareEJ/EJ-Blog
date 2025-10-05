import { NextResponse } from "next/server";
import { AVATAR_OPTIONS, getErikUserId } from "@/lib/erik";
import supabaseAdmin from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { filename } = body;
    if (!filename || typeof filename !== "string" || !AVATAR_OPTIONS.includes(filename)) {
      return NextResponse.json({ error: "Invalid avatar filename" }, { status: 400 });
    }

    // Get requester user
    const sb = supabaseAdmin();
    let requesterUserId: string | null = null;
    let requesterEmail: string | null = null;
    try {
      // Try to get session from cookies
      const { data: { user }, error } = await sb.auth.getUser();
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
    const { error: updateError } = await sb.auth.admin.updateUserById(erikUserId, {
      user_metadata: { avatar: filename },
    });
    if (updateError) {
      return NextResponse.json({ error: "Failed to update avatar" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
