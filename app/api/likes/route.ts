import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabaseService";
import crypto from "crypto";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const REACTION_KEYS = ["diamond","emerald","heart","blaze","brick","star","coin","gear"];
const NAMESPACE_UUID = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

function generateDeterministicUuid(postId: string, reactionType: string): string {
  const name = `${postId}:${reactionType}`;
  // Use MD5 for deterministic UUID generation (32 hex chars -> valid UUID format)
  const hash = crypto.createHash('md5')
    .update(NAMESPACE_UUID + name)
    .digest('hex');
  
  // Format as UUID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  return hash.replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5');
}

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
  
    // Create a deterministic UUID for this post+reaction combination
    const deterministicUuid = generateDeterministicUuid(postId, type);
    
    // First, check if this reaction already exists
    const { data: existingReaction, error: checkError } = await supabase
      .from("reactions")
      .select("id")
      .eq("target_type", "post")
      .eq("target_id", deterministicUuid)
      .eq("kind", "like")
      .is("user_id", null)
      .maybeSingle();
      
    if (checkError) {
      console.error("❌ Error checking existing reaction:", checkError);
      const response = NextResponse.json({ 
        error: "check_failed", 
        details: checkError 
      }, { status: 400 });
      response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
      return response;
    }
    
    if (existingReaction) {
      // Reaction exists, delete it (toggle off)
      const { error: deleteError } = await supabase
        .from("reactions")
        .delete()
        .eq("target_type", "post")
        .eq("target_id", deterministicUuid)
        .eq("kind", "like")
        .is("user_id", null);
        
      if (deleteError) {
        console.error("❌ Error deleting reaction:", deleteError);
        const response = NextResponse.json({ 
          error: "delete_failed", 
          details: deleteError 
        }, { status: 400 });
        response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
        return response;
      }
      
      console.log("✅ Successfully deleted reaction (toggle off)");
    } else {
      // Reaction doesn't exist, create it (toggle on)
      const { error: insertError, data: insertData } = await supabase
        .from("reactions")
        .insert({ 
          target_type: "post", 
          target_id: deterministicUuid,
          kind: "like", 
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
    
      console.log("✅ Successfully inserted reaction (toggle on):", insertData);
    }

    // Fetch reaction counts by checking for each reaction type
    const counts: Record<string, number> = {};
    
    // Check each reaction type individually
    for (const reactionType of REACTION_KEYS) {
      const deterministicUuid = generateDeterministicUuid(postId, reactionType);
        
      const { count, error: countError } = await supabase
        .from("reactions")
        .select("*", { count: "exact", head: true })
        .eq("target_type", "post")
        .eq("target_id", deterministicUuid)
        .eq("kind", "like")
        .is("user_id", null);
        
      if (!countError && count !== null) {
        counts[reactionType] = count;
      } else {
        counts[reactionType] = 0;
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
  
  // Count reactions by checking for each reaction type
  const counts: Record<string, number> = {};
  
  // Check each reaction type individually
  for (const reactionType of REACTION_KEYS) {
    const deterministicUuid = generateDeterministicUuid(postId, reactionType);
      
    const { count, error: countError } = await supabase
      .from("reactions")
      .select("*", { count: "exact", head: true })
      .eq("target_type", "post")
      .eq("target_id", deterministicUuid)
      .eq("kind", "like")
      .is("user_id", null);
      
    if (!countError && count !== null) {
      counts[reactionType] = count;
    } else {
      counts[reactionType] = 0;
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