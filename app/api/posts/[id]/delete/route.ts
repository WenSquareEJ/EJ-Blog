// app/api/posts/[id]/delete/route.ts
import { supabaseServer } from '@/lib/supabaseServer'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const postId = params.id
  const userSb = supabaseServer()

  // Who is calling?
  const { data: ures, error: uerr } = await userSb.auth.getUser()
  if (uerr || !ures?.user) {
    return new Response('Unauthorized', { status: 401 })
  }
  const userId = ures.user.id

  // Load caller role and the post author
  const [{ data: prof }, { data: post }] = await Promise.all([
    userSb.from('profiles').select('role').eq('id', userId).maybeSingle(),
    userSb.from('posts').select('id, author, title').eq('id', postId).maybeSingle(),
  ])

  if (!post) return new Response('Not found', { status: 404 })

  const isParent = prof?.role === 'parent'
  const isAuthor = post.author === userId
  if (!isParent && !isAuthor) {
    return new Response('Forbidden', { status: 403 })
  }

  // Fetch image rows to remove files from storage
  const { data: imgs } = await userSb
    .from('images')
    .select('id, path')
    .eq('post_id', postId)

  // Use admin client to delete files (bypasses RLS safely)
  const admin = supabaseAdmin()
  const keys = (imgs || []).map((i) =>
    i.path.startsWith('images/') ? i.path.slice('images/'.length) : i.path
  )
  if (keys.length) {
    // Remove from storage bucket 'images'
    const { error: rmErr } = await admin.storage.from('images').remove(keys)
    if (rmErr) {
      // Not fatal, but we return 500 so you know to retry
      return new Response(`Failed to delete files: ${rmErr.message}`, { status: 500 })
    }
  }

  // Clean up DB (images, comments, reactions, post)
  // Using admin client to avoid RLS edge cases.
  const { error: imgDelErr } = await admin.from('images').delete().eq('post_id', postId)
  if (imgDelErr) return new Response(imgDelErr.message, { status: 500 })

await admin.from('reactions').delete().eq('post_id', postId)
await admin.from('comments').delete().eq('post_id', postId)

  const { error: postDelErr } = await admin.from('posts').delete().eq('id', postId)
  if (postDelErr) return new Response(postDelErr.message, { status: 500 })

  return Response.json({ ok: true })
}
