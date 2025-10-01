import { supabaseServer } from '@/lib/supabaseServer'
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const sb = supabaseServer()
  const { error } = await sb.from('posts').update({ status: 'approved', published_at: new Date().toISOString() }).eq('id', params.id)
  if (error) return new Response(error.message, { status: 500 })
  return Response.json({ ok: true })
}
