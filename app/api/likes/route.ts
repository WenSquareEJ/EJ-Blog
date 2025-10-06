import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  let postId: string | undefined;
  try {
    const body = await req.json();
    postId = body?.postId;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!postId || typeof postId !== "string" || !postId.trim()) {
    return NextResponse.json({ error: "postId required" }, { status: 400 });
  }
  // No DB logic yet
  return NextResponse.json({ ok: true });
}
