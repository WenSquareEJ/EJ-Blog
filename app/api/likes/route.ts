import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabaseService";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const REACTION_KEYS = ["diamond","emerald","heart","blaze","brick","star","coin","gear"];

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
    const response = NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
    return response;
  }
  if (!postId || typeof postId !== "string" || !postId.trim()) {
    const response = NextResponse.json({ error: "postId required" }, { status: 400 });
    response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
    return response;
  }

  const supabase = getServiceClient();
  
  // Insert the like into Supabase
  const { error: insertError } = await supabase
    .from("post_likes" as any)
    .insert({ post_id: postId, type });
  
  if (insertError) {
    console.error("Error inserting like:", insertError);
    console.error("Post ID:", postId, "Type:", type);
    const response = NextResponse.json({ error: "Failed to save like", details: insertError.message }, { status: 500 });
    response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
    return response;
  }

  // Get updated counts for all reaction types
  const { data: countsData } = await supabase
    .from("post_likes" as any)
    .select("type")
    .eq("post_id", postId);

  const counts: Record<string, number> = {};
  for (const key of REACTION_KEYS) counts[key] = 0;
  
  if (countsData) {
    for (const row of countsData) {
      if (row.type && REACTION_KEYS.includes(row.type)) {
        counts[row.type] = (counts[row.type] || 0) + 1;
      }
    }
  }

  const response = NextResponse.json({ 
    ok: true, 
    count: counts["diamond"] || 0, // legacy compatibility
    counts 
  });
  response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
  return response;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const postId = searchParams.get("postId") || "";
  const aggregate = searchParams.get("aggregate");
  if (!postId) {
    const response = NextResponse.json({ error: "postId required" }, { status: 400 });
    response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
    return response;
  }

  const supabase = getServiceClient();
  
  // Fetch counts from Supabase
  const { data: countsData } = await supabase
    .from("post_likes" as any)
    .select("type")
    .eq("post_id", postId);

  const counts: Record<string, number> = {};
  for (const key of REACTION_KEYS) counts[key] = 0;
  
  if (countsData) {
    for (const row of countsData) {
      if (row.type && REACTION_KEYS.includes(row.type)) {
        counts[row.type] = (counts[row.type] || 0) + 1;
      }
    }
  }

  if (aggregate === "byType") {
    const response = NextResponse.json({ counts });
    response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
    return response;
  } else {
    // Legacy: just return diamond count
    const response = NextResponse.json({ count: counts["diamond"] || 0 });
    response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
    return response;
  }
}
