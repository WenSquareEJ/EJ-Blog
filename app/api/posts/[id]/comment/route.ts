// /app/api/posts/[id]/comment/route.ts
import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import supabaseServer from "@/lib/supabaseServer";

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const postId = params.id;
  // Cast the client to "any" once so TS stops treating table types as "never"
  const sb = supabaseServer() as unknown as SupabaseClient<any>;

  // Read form data
  const form = await req.formData();
  const raw = form.get("content");
  const content = typeof raw === "string" ? raw.trim() : "";

  // Basic validation
  if (!postId || !content) {
    // Always redirect back to the post page with an error
    return NextResponse.redirect(new URL(`/post/${postId}?err=empty_comment`, siteUrl()));
  }
  if (content.length > 2000) {
    return NextResponse.redirect(new URL(`/post/${postId}?err=too_long`, siteUrl()));
  }

  try {
    // Insert comment as pending review (bypass TS generics here too)
    await (sb.from("comments") as any).insert([
      { post_id: postId, content, status: "pending" } as any,
    ]);
  } catch (e: any) {
    // Redirect back with a generic error
    return NextResponse.redirect(new URL(`/post/${postId}?err=insert_failed`, siteUrl()));
  }

  // Success → redirect back to post
  return NextResponse.redirect(new URL(`/post/${postId}?ok=1`, siteUrl()));
}

// Optional: guard against accidental GET navigations (never show raw JSON)
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  return NextResponse.redirect(new URL(`/post/${params.id}`, siteUrl()));
}