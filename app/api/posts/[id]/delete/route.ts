import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const postId = params.id
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // server-side only
  )

  // Identify caller via auth cookie (best-effort)
  const accessToken = req.headers.get('Authorization')?.replace('Bearer ', '') || null
  let callerId: string | null = null
  if (accessToken) {
    const { data } = await supabase.auth.getUser(accessToken)
    callerId = data?.user?.id ?? null
  }

  // Load post (to check ownership)
  const { data: post, error: postErr } = await supabase.from('posts').select('*').eq('id', postId).maybeSingle()
  if (postErr || !post) return new Response('Post not found', { status: 404 })

  // Load caller role
  let isParent = false
  if (callerId) {
    const { data: prof } = await supabase.from('profiles').select('role').eq('id', callerId).maybeSingle()
    isParent = (prof?.role || '').toLowerCase() === 'parent'
  }
  const isAuthor = callerId && (post as any).author === callerId

  if (!isParent && !isAuthor) return new Response('Not authorized', { status: 403 })

  // Best-effort: delete related rows (ignore if none)
  await supabase.from('reactions').delete().eq('post_id', postId)
  await supabase.from('comments').delete().eq('post_id', postId)

  // Delete the post
  const { error: delErr } = await supabase.from('posts').delete().eq('id', postId)
  if (delErr) return new Response(delErr.message, { status: 500 })

  return Response.json({ ok: true })
}
