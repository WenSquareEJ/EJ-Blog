// app/api/posts/route.ts
import { supabaseServer } from '@/lib/supabaseServer'
import { sendReviewEmail } from '@/lib/email'
import DOMPurify from 'isomorphic-dompurify'

type Body = {
  title: string
  content: string            // HTML from the rich editor
  images?: string[]          // not needed anymore; we’ll extract from HTML
  status?: 'draft' | 'pending'
  tags?: string[]
}

function extractImageKeysFromHtml(html: string, baseUrl: string) {
  // Accept images hosted in our Supabase public bucket, extract the storage key (after /images/)
  const keys: string[] = []
  const re = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html))) {
    const src = m[1]
    // expected: https://<project>.supabase.co/storage/v1/object/public/images/<key>
    const marker = `${baseUrl}/storage/v1/object/public/images/`
    if (src.startsWith(marker)) {
      const key = src.slice(marker.length)
      if (key && !keys.includes(key)) keys.push(key)
    }
  }
  return keys
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const status = url.searchParams.get('status') as
    | 'draft' | 'pending' | 'approved' | 'rejected' | null

  const sb = supabaseServer()
  let q = sb.from('posts').select('*').order('created_at', { ascending: false })
  if (status) q = q.eq('status', status)
  const { data, error } = await q
  if (error) return new Response(error.message, { status: 500 })
  return Response.json({ items: data || [] })
}

export async function POST(req: Request) {
  const sb = supabaseServer()
  const body = (await req.json()) as Body

  // sanitize HTML to avoid any script tags, etc.
  const safeHtml = DOMPurify.sanitize(body.content || '', { USE_PROFILES: { html: true } })

  // current user (author) if logged in
  const { data: udata } = await sb.auth.getUser()
  const author = udata?.user?.id ?? null

  // 1) Create post
  const { data: post, error: postErr } = await sb
    .from('posts')
    .insert({
      author,
      title: body.title,
      content: safeHtml,               // store sanitized HTML
      status: body.status ?? 'draft',
    })
    .select('id,title,status')
    .single()

  if (postErr || !post) {
    return new Response(postErr?.message || 'Failed to create post', { status: 500 })
  }

  // 2) Extract inline <img src="..."> URLs and save image rows
  try {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const imageKeys = extractImageKeysFromHtml(safeHtml, base)
    if (imageKeys.length) {
      const rows = imageKeys.slice(0, 24).map((key) => ({
        post_id: post.id,
        path: key,
        faces_blurred: true,
      }))
      await sb.from('images').insert(rows)
    }
  } catch (e) {
    console.warn('Could not extract/insert image rows:', e)
  }

  // 3) (Optional) Tags (silently skip if not configured)
  if (Array.isArray(body.tags) && body.tags.length) {
    try {
      const tagIds: string[] = []
      for (const raw of body.tags.slice(0, 10)) {
        const name = (raw || '').trim()
        if (!name) continue
        // @ts-ignore
        const { data: rpc } = await sb.rpc('ensure_tag', { p_name: name })
        if (rpc) tagIds.push(rpc as unknown as string)
      }
      if (tagIds.length) {
        await sb.from('post_tags').insert(tagIds.map((tid) => ({ post_id: post.id, tag_id: tid })))
      }
    } catch {}
  }

  // 4) Notify parents if pending
  if (post.status === 'pending') {
    const { data: parents } = await sb.from('profiles').select('email').eq('role', 'parent')
    if (parents?.length) {
      const base =
        process.env.NEXT_PUBLIC_SITE_URL ||
        process.env.NEXT_PUBLIC_VERCEL_URL ||
        ''
      const reviewUrl = `${base}/moderation`
      try { await sendReviewEmail(parents.map((p)=>p.email), reviewUrl, post.title) } catch {}
    }
  }

  return Response.json({ ok: true, id: post.id })
}
