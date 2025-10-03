import supabaseServer from "@/lib/supabaseServer";
export async function POST(req: Request) {
  const body = await req.json()
  const sb = supabaseServer()
  const { error } = await sb.from('reactions').insert({ target_type: body.targetType, target_id: body.targetId, kind: body.kind })
  if (error) return new Response(error.message, { status: 500 })
  return Response.json({ ok: true })
}
