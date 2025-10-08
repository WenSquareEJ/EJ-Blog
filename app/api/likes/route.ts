import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabaseService";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const REACTION_KEYS = ["diamond","emerald","heart","blaze","brick","star","coin","gear"];

// Map our 8 types to existing reactions table kinds
const TYPE_TO_KIND: Record<string, string> = {
  "diamond": "like",
  "emerald": "party", 
  "heart": "heart",
  "blaze": "idea",
  "brick": "like",    // fallback to like
  "star": "idea",     // fallback to idea  
  "coin": "party",    // fallback to party
  "gear": "heart"     // fallback to heart
};

const KIND_TO_TYPE: Record<string, string> = {
  "like": "diamond",
  "party": "emerald",
  "heart": "heart", 
  "idea": "star"
};

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
  
  // Insert the like into Supabase using existing reactions table
  console.log("Attempting to insert like:", { postId, type });
  const mappedKind = TYPE_TO_KIND[type] || "like";
  const { error: insertError, data: insertData } = await supabase
    .from("reactions")
    .insert({ 
      target_type: "post", 
      target_id: postId, 
      kind: mappedKind
    })
    .select();
  
  if (insertError) {
    console.error("❌ Error inserting like:", insertError);
    console.error("Post ID:", postId, "Type:", type);
    console.error("Error code:", insertError.code);
    console.error("Error details:", insertError.details);
    const response = NextResponse.json({ 
      error: "Failed to save like", 
      details: insertError.message,
      code: insertError.code 
    }, { status: 500 });
    response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
    return response;
  }
  
  console.log("✅ Successfully inserted like:", insertData);

  // Get updated counts for all reaction types
  console.log("Fetching counts for post:", postId);
  const { data: countsData, error: fetchError } = await supabase
    .from("reactions")
    .select("kind")
    .eq("target_type", "post")
    .eq("target_id", postId);

  if (fetchError) {
    console.error("❌ Error fetching counts:", fetchError);
  } else {
    console.log("✅ Fetched counts data:", countsData);
  }

  const counts: Record<string, number> = {};
  for (const key of REACTION_KEYS) counts[key] = 0;
  
  if (countsData) {
    for (const row of countsData) {
      const mappedType = KIND_TO_TYPE[row.kind] || "diamond";
      if (REACTION_KEYS.includes(mappedType)) {
        counts[mappedType] = (counts[mappedType] || 0) + 1;
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
  
  // Fetch counts from Supabase using existing reactions table
  const { data: countsData } = await supabase
    .from("reactions")
    .select("kind")
    .eq("target_type", "post")
    .eq("target_id", postId);

  const counts: Record<string, number> = {};
  for (const key of REACTION_KEYS) counts[key] = 0;
  
  if (countsData) {
    for (const row of countsData) {
      const mappedType = KIND_TO_TYPE[row.kind] || "diamond";
      if (REACTION_KEYS.includes(mappedType)) {
        counts[mappedType] = (counts[mappedType] || 0) + 1;
      }
    }
  }  if (aggregate === "byType") {
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
