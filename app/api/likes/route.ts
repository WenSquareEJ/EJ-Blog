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
  
  console.log("Processing anonymous reaction:", { postId, type });
  
  try {
    const supabase = getServiceClient();
  
  // Encode the reaction type in the target_id to distinguish 8 types
  // Format: "post:{postId}:{reactionType}"
  const encodedTargetId = `post:${postId}:${type}`;
  
  // Insert anonymous reaction - use null for user_id (anonymous)
  const { error: insertError, data: insertData } = await supabase
    .from("reactions")
    .insert({ 
      target_type: "post",
      target_id: encodedTargetId,
      kind: "like", // Use consistent kind for all reactions
      user_id: null // Anonymous
    })
    .select();
  
  if (insertError) {
    console.error("❌ Error inserting reaction:", insertError);
    const response = NextResponse.json({ 
      error: "insert_failed", 
      details: insertError, 
      hint: "Check RLS and NOT NULL/constraints"
    }, { status: 400 });
    response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
    return response;
  }
  
  console.log("✅ Successfully inserted reaction:", insertData);

  // Fetch all reactions for this post and calculate counts
  const { data: allReactions, error: fetchError } = await supabase
    .from("reactions")
    .select("target_id")
    .eq("target_type", "post")
    .like("target_id", `post:${postId}:%`)
    .is("user_id", null); // Only anonymous reactions

  if (fetchError) {
    console.error("❌ Error fetching reactions:", fetchError);
    const response = NextResponse.json({ 
      error: "fetch_failed", 
      details: fetchError 
    }, { status: 400 });
    response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
    return response;
  }

  // Count reactions by type
  const counts: Record<string, number> = {};
  for (const key of REACTION_KEYS) counts[key] = 0;
  
  if (allReactions) {
    for (const reaction of allReactions) {
      // Extract reaction type from target_id format: "post:postId:type"
      const parts = reaction.target_id.split(":");
      if (parts.length === 3 && parts[0] === "post" && parts[1] === postId) {
        const reactionType = parts[2];
        if (REACTION_KEYS.includes(reactionType)) {
          counts[reactionType] = (counts[reactionType] || 0) + 1;
        }
      }
    }
  }

  const total = Object.values(counts).reduce((a, b) => a + (b || 0), 0);
  const response = NextResponse.json({ 
    ok: true, 
    count: counts["diamond"] || 0, // legacy compatibility
    counts,
    total
  });
  response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
  return response;
  } catch (error) {
    console.error("❌ Unexpected error in POST /api/likes:", error);
    const response = NextResponse.json({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
    response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
    return response;
  }
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
  
  // Fetch all reactions for this post
  const { data: allReactions, error: fetchError } = await supabase
    .from("reactions")
    .select("target_id")
    .eq("target_type", "post")
    .like("target_id", `post:${postId}:%`)
    .is("user_id", null); // Only anonymous reactions

  if (fetchError) {
    console.error("❌ Error fetching reactions:", fetchError);
  }

  // Count reactions by type
  const counts: Record<string, number> = {};
  for (const key of REACTION_KEYS) counts[key] = 0;
  
  if (allReactions) {
    for (const reaction of allReactions) {
      // Extract reaction type from target_id format: "post:postId:type"
      const parts = reaction.target_id.split(":");
      if (parts.length === 3 && parts[0] === "post" && parts[1] === postId) {
        const reactionType = parts[2];
        if (REACTION_KEYS.includes(reactionType)) {
          counts[reactionType] = (counts[reactionType] || 0) + 1;
        }
      }
    }
  }

  const total = Object.values(counts).reduce((a, b) => a + (b || 0), 0);
  if (aggregate === "byType") {
    const response = NextResponse.json({ counts, total });
    response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
    return response;
  } else {
    // Legacy: just return diamond count
    const response = NextResponse.json({ count: counts["diamond"] || 0, total });
    response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
    return response;
  }
}
