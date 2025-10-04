// app/api/posts/route.ts
import { NextResponse } from 'next/server'
import type { JSONContent } from '@tiptap/core'
import supabaseServer from "@/lib/supabaseServer";   // uses @supabase/ssr under the hood
import { markdownToHtml, sanitizeRichText } from '@/lib/postContent'
// If you plan to bypass RLS for admin-only actions, you can also use supabaseAdmin.
// import { supabaseAdmin } from '@/lib/supabaseAdmin'

/**
 * GET /api/posts
 * Returns approved posts (paginated)
 * Query params: ?page=1&pageSize=10
 */
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
    .select('*', { count: 'exact' })
    .eq('status', 'approved')
    .order('published_at', { ascending: false })
    .range(from, to)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    page,
    pageSize,
    total: count ?? 0,
    posts: data ?? [],
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

  const sanitizedTags = sanitizeTags(tags);

  const insert = {
    title,
    content: (content_md ?? plain) || '',
    content_html: html || null,
    content_json: content_json ?? null,
    author: userRes.user.id,
    status: 'pending' as const,
    tags: sanitizedTags,
    images,
  }

  const { data, error } = await sb.from('posts').insert(insert).select().single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ post: data }, { status: 201 })
}

function sanitizeTags(input: string[] | null | undefined) {
  if (!Array.isArray(input)) return null;
  const seen = new Set<string>();
  const cleaned: string[] = [];
  for (const raw of input) {
    if (typeof raw !== 'string') continue;
    const normalized = raw.trim().toLowerCase();
    if (!normalized || normalized.length > 20) continue;
    if (seen.has(normalized)) continue;
    cleaned.push(normalized);
    seen.add(normalized);
    if (cleaned.length >= 12) break;
  }
  return cleaned.length ? cleaned : null;
}
