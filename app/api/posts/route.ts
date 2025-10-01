// app/api/posts/route.ts
import { supabaseServer } from '@/lib/supabaseServer'
import { sendReviewEmail } from '@/lib/email'

type Body = {
  title: string
  content: string
  images?: string[]
  status?: 'draft'|'pending'
  tags?: string[]               // NEW
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const status = url.searchParams.get('status')
  const sb = supabaseServer()
  const q = sb.from('posts').select('*').order('created_at', { ascending: false })
  const { data } = status ? await q.eq('status', status) : await q
  return Response.json({ items: data||[] })
}

export async function POST(req: Request) {
  const sb = supabaseServer()
  const body = (await req.json()) as Body

  // 1) Create the post
  const { data: post, error } = await sb
    .from('posts')
    .insert({ title: body.title, content: body.content, status: body.status || 'draft' })
    .select('id,title,status')
    .single()
  if (error) return new Response(error.message, { status: 500 })

  // 2) Upsert tags + link them
  if (body.tags && body.tags.length) {
    for (const raw of body.tags.slice(0, 10)) {
      const name = String(raw).slice(0, 30) // keep short
      // call the SQL function ensure_tag(name) to get an id
      const { data: tagIdRow, error: tagErr } = await sb.rpc('ensure_tag', { p_name: name })
      if (!tagErr && tagIdRow) {
        await sb.from('post_tags').insert({ post_id: post.id, tag_id: tagIdRow as unknown as string })
      }
    }
  }

  // 3) Notify parents if pending
  if (post.status === 'pending') {
    const { data: parents } = await sb.from('profiles').select('email').eq('role', 'parent')
    const url = `${process.env.NEXT_PUBLIC_SITE_URL || ''}/moderation`
    await sendReviewEmail((parents || []).map(p => p.email), url, post.title)
  }

  return Response.json({ ok: true, id: post.id })
}
