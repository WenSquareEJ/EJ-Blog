import { NextRequest, NextResponse } from "next/server";

const REACTION_KEYS = ["diamond","emerald","heart","blaze","brick","star","coin","gear"];
const memoryStore: Record<string, Record<string, number>> = {};

export async function POST(req: NextRequest) {
  let postId: string | undefined;
  let type: string = "diamond";
  try {
    const body = await req.json();
    postId = body?.postId;
    if (body?.type && typeof body.type === "string" && REACTION_KEYS.includes(body.type)) {
      type = body.type;
    }
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!postId || typeof postId !== "string" || !postId.trim()) {
    return NextResponse.json({ error: "postId required" }, { status: 400 });
  }
  // In-memory increment (replace with DB logic)
  if (!memoryStore[postId]) memoryStore[postId] = {};
  memoryStore[postId][type] = (memoryStore[postId][type] || 0) + 1;
  // Legacy: also increment diamond for old clients
  if (type === "diamond") {
    memoryStore[postId]["diamond"] = memoryStore[postId]["diamond"];
  }
  // Return both legacy and new shape
  return NextResponse.json({ ok: true, count: memoryStore[postId]["diamond"] || 0, counts: { ...memoryStore[postId] } });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const postId = searchParams.get("postId") || "";
  const aggregate = searchParams.get("aggregate");
  if (!postId) {
    return NextResponse.json({ error: "postId required" }, { status: 400 });
  }
  // In-memory fetch (replace with DB logic)
  const counts = memoryStore[postId] || {};
  if (aggregate === "byType") {
    // Return all keys, defaulting to 0
    const result: Record<string, number> = {};
    for (const key of REACTION_KEYS) result[key] = counts[key] || 0;
    return NextResponse.json({ counts: result });
  } else {
    // Legacy: just return diamond count
    return NextResponse.json({ count: counts["diamond"] || 0 });
  }
}
