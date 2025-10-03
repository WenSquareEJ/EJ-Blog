import { supabaseServer } from '@/lib/supabaseServer'
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const sb = createServerClient()
  const { error } = await sb.from('posts').update({ status: 'rejected' }).eq('id', params.id)
  if (error) return new Response(error.message, { status: 500 })
  return Response.json({ ok: true })
}
