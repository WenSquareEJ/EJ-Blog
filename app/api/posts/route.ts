import { supabaseServer } from '@/lib/supabaseServer'
import { sendReviewEmail } from '@/lib/email'

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
  const body = await req.json()
  const { data, error } = await sb.from('posts').insert({ title: body.title, content: body.content, status: body.status||'draft' }).select('id,title,status').single()
  if (error) return new Response(error.message, { status: 500 })
  if (data.status === 'pending') {
    const { data: parents } = await sb.from('profiles').select('email').eq('role','parent')
    const url = `${process.env.NEXT_PUBLIC_SITE_URL}/moderation`
    await sendReviewEmail((parents||[]).map(p=>p.email), url, data.title)
  }
  return Response.json({ ok: true, id: data.id })
}
