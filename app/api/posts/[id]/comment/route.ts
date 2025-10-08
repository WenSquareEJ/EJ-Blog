// /app/api/posts/[id]/comment/route.ts
import { NextResponse } from "next/server";
import supabaseServer from "@/lib/supabaseServer";

export const runtime = "nodejs"; // ensure Node runtime, not edge

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const postId = String(params?.id || "").trim();

  // Build absolute URLs from the **actual request origin** (works locally & on Vercel)
  const origin = (() => {
    try {
      return new URL(req.url).origin;
    } catch {
      return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    }
  })();

  const to = (path: string) => new URL(path, origin);

  try {
    // 1) Validate post id
    if (!postId || !isUuid(postId)) {
      return NextResponse.redirect(to(`/post/${postId}?err=bad_post`), { status: 302 });
    }

    // 2) Parse form body
    const form = await req.formData();
    const rawContent = form.get("content");
    const rawName = form.get("name");
    const content = (typeof rawContent === "string" ? rawContent : "").trim();
    const name = (typeof rawName === "string" ? rawName : "").trim();

    if (!content) {
      return NextResponse.redirect(to(`/post/${postId}?err=empty`), { status: 302 });
    }
    if (content.length > 2000) {
      return NextResponse.redirect(to(`/post/${postId}?err=toolong`), { status: 302 });
    }
    if (!name) {
      return NextResponse.redirect(to(`/post/${postId}?err=noname`), { status: 302 });
    }
    if (name.length > 50) {
      return NextResponse.redirect(to(`/post/${postId}?err=namelong`), { status: 302 });
    }

    // 3) Insert (RLS must allow pending inserts)
    const sb = supabaseServer();
    const { error: insertError } = await sb
      .from("comments")
      .insert([{ post_id: postId, content, commenter_name: name, status: "pending" }]);

    if (insertError) {
      console.error("[comments] insert failed:", insertError);
      return NextResponse.redirect(to(`/post/${postId}?err=db`), { status: 302 });
    }

    // 4) Success -> back to post
    return NextResponse.redirect(to(`/post/${postId}?ok=1`), { status: 302 });
  } catch (e) {
    console.error("[comments] route crashed:", e);
    return NextResponse.redirect(to(`/post/${postId}?err=server`), { status: 302 });
  }
}