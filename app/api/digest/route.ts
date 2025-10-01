import { supabaseServer } from '@/lib/supabaseServer'
import { sendDailyDigest } from '@/lib/email'

export async function POST() {
  const sb = supabaseServer()
  const { data: parents } = await sb.from('profiles').select('email').eq('role','parent')
  const since = new Date(Date.now()-24*3600*1000).toISOString()
  const [{ data: rc }, { data: cm }] = await Promise.all([
    sb.from('reactions').select('id').gte('created_at', since),
    sb.from('comments').select('id').gte('created_at', since).eq('status','pending')
  ])
  const html = `<p>New reactions: ${rc?.length||0}</p><p>Comments awaiting review: ${cm?.length||0}</p>`
  await sendDailyDigest((parents||[]).map(p=>p.email), html)
  return Response.json({ ok: true })
}
