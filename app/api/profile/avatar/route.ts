
import { NextResponse } from 'next/server';
import supabaseServer from '@/lib/supabaseServer';
import { getErikUserId } from '@/lib/erik';
const AVATAR_FILENAMES = [
  "steve.png",
  "alex.png",
  "slime.png",
  "creeper.png",
  "skeleton.png",
  "enderman.png",
  "parrot-blue.png",
  "parrot-red.png",
  "miner.png",
  "builder.png",
];
const AVATAR_PATH = "/assets/avatars/";
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.toLowerCase() ?? "";

export async function POST(req: Request) {
  try {
    const sb = supabaseServer();
    const { data: { user } = { user: null } } = await sb.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Accept form POST or JSON
    let avatarUrl: string | null = null;
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = await req.json();
      avatarUrl = typeof body.avatarUrl === "string" ? body.avatarUrl : null;
    } else if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      avatarUrl = typeof form.get("avatarUrl") === "string" ? form.get("avatarUrl") as string : null;
    }
    if (!avatarUrl || !avatarUrl.startsWith(AVATAR_PATH) || avatarUrl.length > 2048) {
      return NextResponse.json({ error: "Invalid avatarUrl" }, { status: 400 });
    }
    const filename = avatarUrl.replace(AVATAR_PATH, "");
    if (!AVATAR_FILENAMES.includes(filename)) {
      return NextResponse.json({ error: "Avatar not allowed" }, { status: 400 });
    }
    // Only Erik or admin can update
    const erikUserId = await getErikUserId();
    const isErik = user.id === erikUserId;
    const isAdmin = user.email?.toLowerCase() === ADMIN_EMAIL;
    if (!isErik && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (!erikUserId) {
      return NextResponse.json({ error: "Erik user not found" }, { status: 404 });
    }
    // Update Erik's profile only
    const { error } = await sb
      .from("profiles")
      .update({ avatar_url: avatarUrl })
      .eq("id", erikUserId)
      .select("id, avatar_url")
      .single();
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
