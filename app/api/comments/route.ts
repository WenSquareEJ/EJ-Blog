import { createServerClient } from '@/lib/supabaseServer'
export async function GET(req: Request) {
  const url = new URL(req.url)
  const status = url.searchParams.get('status')
  const sb = supabaseServer()
  const q = sb.from('comments').select('*').order('created_at', { ascending: true })
  const { data } = status ? await q.eq('status', status) : await q
  return Response.json({ items: data||[] })
}
export async function POST(req: Request) {
  const body = await req.json()
  const sb = supabaseServer()
  const { error } = await sb.from('comments').insert({ post_id: body.postId, content: body.content, status: 'pending' })
  if (error) return new Response(error.message, { status: 500 })
  return Response.json({ ok: true })
}
