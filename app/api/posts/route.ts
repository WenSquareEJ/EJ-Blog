// app/api/posts/route.ts
import { NextResponse } from 'next/server'
import type { JSONContent } from '@tiptap/core'
import supabaseServer from "@/lib/supabaseServer";   // uses @supabase/ssr under the hood
import { markdownToHtml, sanitizeRichText } from '@/lib/postContent'
import { attachTagsToPost, sanitizeTagNames, type TagRecord } from "@/lib/tagHelpers";
import type { TablesRow } from "@/lib/database.types";
// If you plan to bypass RLS for admin-only actions, you can also use supabaseAdmin.
// import { supabaseAdmin } from '@/lib/supabaseAdmin'

/**
 * GET /api/posts
 * Returns approved posts (paginated)
 * Query params: ?page=1&pageSize=10
 */
type PostJoinRow = TablesRow<'posts'> & {
  post_tags: { tags: TagRecord | null }[] | null;
};

export async function GET(request: Request) {
  const url = new URL(request.url)
  const page = Math.max(parseInt(url.searchParams.get('page') || '1', 10), 1)
  const pageSize = Math.min(
    Math.max(parseInt(url.searchParams.get('pageSize') || '10', 10), 1),
    50
  )
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const sb = supabaseServer()
  const { data, error, count } = await sb
    .from('posts')
    .select(
      `
        id,
        title,
        content,
        content_html,
        content_json,
        image_url,
        status,
        created_at,
        published_at,
        author,
        post_tags:post_tags(
          tags:tags(id, name, slug)
        )
      `,
      { count: 'exact' }
    )
    .eq('status', 'approved')
    .order('published_at', { ascending: false })
    .range(from, to)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const posts = (data ?? []).map((post) => {
    const { post_tags, ...rest } = post as PostJoinRow;

    const tagList = (post_tags ?? [])
      .map((entry) => entry.tags)
      .filter((tag): tag is TagRecord => Boolean(tag));

    return { ...rest, tags: tagList };
  });

  return NextResponse.json({
    page,
    pageSize,
    total: count ?? 0,
    posts,
  })
}

/**
 * POST /api/posts
 * Creates a new post as PENDING for moderation.
 * Body: { title: string, content_md: string, tags?: string[], images?: string[] }
 * Requires logged-in user.
 */
export async function POST(request: Request) {
  const sb = supabaseServer()
  const { data: userRes, error: userErr } = await sb.auth.getUser()
  if (userErr || !userRes?.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const {
    title,
    content_md,
    content_html,
    content_json,
    content_text,
    tags = [],
    images = [],
  } = body as {
    title?: string
    content_md?: string
    content_html?: string
    content_json?: JSONContent
    content_text?: string
    tags?: string[]
    images?: string[]
  }

  if (!title || !(content_md || content_html || content_text)) {
    return NextResponse.json(
      { error: 'Missing title or content' },
      { status: 400 }
    )
  }

  const plain = content_text?.trim() ?? content_md?.trim() ?? ''
  let html = content_html?.trim() ?? ''
  if (html) {
    html = sanitizeRichText(html)
  } else if (content_md) {
    html = markdownToHtml(content_md)
  } else if (plain) {
    html = markdownToHtml(plain)
  }

  const sanitizedTags = sanitizeTagNames(tags);

  const insert = {
    title,
    content: (content_md ?? plain) || '',
    content_html: html || null,
    content_json: content_json ?? null,
    author: userRes.user.id,
    status: 'pending' as const,
    images,
  }

  const { data: insertedPost, error } = await sb
    .from('posts')
    .insert(insert)
    .select('id, title, content, content_html, content_json, image_url, status, created_at, author')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let attachedTags: { id: string; name: string; slug: string }[] = []
  if (insertedPost?.id) {
    const tagResult = await attachTagsToPost(sb, insertedPost.id, sanitizedTags)
    if (tagResult.error) {
      return NextResponse.json({ error: tagResult.error }, { status: 500 })
    }
    attachedTags = tagResult.tags
  }

  return NextResponse.json(
    { post: { ...insertedPost, tags: attachedTags } },
    { status: 201 }
  )
}
