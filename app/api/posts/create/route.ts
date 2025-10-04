// /app/api/posts/create/route.ts
import { NextResponse } from "next/server";
import type { JSONContent } from "@tiptap/core";
import supabaseServer from "@/lib/supabaseServer";
import { markdownToHtml, sanitizeRichText } from "@/lib/postContent";
import { attachTagsToPost, sanitizeTagNames } from "@/lib/tagHelpers";
import { checkAndAwardBadgesForUser } from "@/lib/badges/checkAndAwardForUser";

type CreatePostPayload = {
  id?: string | null;
  title?: string | null;
  content_html?: string | null;
  content_json?: JSONContent | null;
  content_text?: string | null;
  content?: string | null;
  image_url?: string | null;
  tags?: string[] | null;
};

export async function POST(req: Request) {
  const sb = supabaseServer();
  const { data: auth } = await sb.auth.getUser();
  if (!auth?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentType = req.headers.get("content-type") ?? "";
  let payload: CreatePostPayload = {};

  if (contentType.includes("application/json")) {
    payload = (await req.json().catch(() => ({}))) as CreatePostPayload;
  } else {
    const form = await req.formData();
    payload = {
      title: form.get("title")?.toString() ?? null,
      content_html: form.get("content_html")?.toString() ?? null,
      content_json: parseJsonSafely(form.get("content_json")?.toString()),
      content_text: form.get("content_text")?.toString() ?? null,
      content: form.get("content")?.toString() ?? null,
      image_url: form.get("image_url")?.toString() ?? null,
    };
  }

  const title = payload.title?.trim();
  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const rawPlain = payload.content_text?.trim() ?? payload.content?.trim() ?? "";
  let contentHtml = payload.content_html?.trim() ?? "";

  if (contentHtml) {
    contentHtml = sanitizeRichText(contentHtml);
  } else if (payload.content && payload.content.trim()) {
    contentHtml = markdownToHtml(payload.content);
  } else if (rawPlain) {
    contentHtml = markdownToHtml(rawPlain);
  }

  const tags = sanitizeTagNames(payload.tags);

  const insertData = {
    id: payload.id ?? undefined,
    title,
    author: auth.user.id,
    image_url: payload.image_url ?? null,
    content: (payload.content ?? rawPlain) || "",
    content_html: contentHtml || null,
    content_json: payload.content_json ?? null,
    status: "pending" as const,
  };

  const { data: insertedPost, error: insertError } = await sb
    .from("posts")
    .insert(insertData)
    .select("id")
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 400 });
  }

  if (insertedPost?.id) {
    const tagResult = await attachTagsToPost(sb, insertedPost.id, tags, {
      authorId: auth.user.id,
    });
    if (tagResult.error) {
      return NextResponse.json({ error: tagResult.error }, { status: 500 });
    }
  }

  try {
    await checkAndAwardBadgesForUser({ userId: auth.user.id, reader: sb });
  } catch (error) {
    console.error('[badges/check-award] Post creation follow-up failed', {
      userId: auth.user.id,
      error,
    });
  }

  // For JSON callers return 201, otherwise redirect to homepage.
  if (contentType.includes("application/json")) {
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  return NextResponse.redirect(new URL("/", req.url));
}

function parseJsonSafely(value: string | null | undefined) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch (error) {
    return null;
  }
}
