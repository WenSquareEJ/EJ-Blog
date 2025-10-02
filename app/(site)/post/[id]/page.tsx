import { supabaseServer } from '@/lib/supabaseServer'
import DOMPurify from 'isomorphic-dompurify'
import CommentList from '@/components/CommentList'
import CommentForm from '@/components/CommentForm'
import ReactionBar from '@/components/ReactionBar'
import DeletePostButton from '@/components/DeletePostButton'

export default async function PostPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams?: { debug?: string }
}) {
  const postId = params.id
  const debug = searchParams?.debug === '1'
  const sb = supabaseServer()

  // Load post
  const { data: posts, error: postErr } = await sb
    .from('posts')
    .select('*')
    .eq('id', postId)
    .limit(1)

  if (postErr) return <p>Error loading post.</p>
  const post = posts?.[0]
  if (!post) return <p>Not found</p>

  // Who is viewing?
  const { data: ures } = await sb.auth.getUser()
  const viewerId = ures?.user?.id ?? null

  let viewerRole: 'parent' | 'child' | null = null
  if (viewerId) {
    const { data: prof } = await sb
      .from('profiles')
      .select('role')
      .eq('id', viewerId)
      .maybeSingle()
    viewerRole = (prof?.role as any) ?? null
  }

  const isParent = viewerRole === 'parent'
  const isAuthor = !!viewerId && post.author === viewerId
  const canDelete = isParent || isAuthor

  // Comments (approved only)
  const { data: comments } = await sb
    .from('comments')
    .select('*')
    .eq('post_id', postId)
    .eq('status', 'approved')
    .order('created_at', { ascending: true })

  // Render rich HTML
  const safeHtml = DOMPurify.sanitize(post.content || '', {
    USE_PROFILES: { html: true },
  })

  return (
    <article className="prose max-w-none">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate">{post.title}</h1>
          <p className="text-sm text-mc-stone">
            {new Date(post.published_at || post.created_at).toLocaleString()}
          </p>
        </div>
        {canDelete && <DeletePostButton postId={postId} />}
      </div>

      {/* Debug – add ?debug=1 to the URL if needed */}
      {debug && (
        <pre className="text-xs p-2 rounded bg-yellow-50 border border-yellow-200">
{`DEBUG:
viewerId:  ${viewerId}
viewerRole: ${viewerRole}
author:    ${post.author}
canDelete: ${String(canDelete)}`}
        </pre>
      )}

      <div dangerouslySetInnerHTML={{ __html: safeHtml }} />

      <div className="my-4">
        <ReactionBar targetType="post" targetId={postId} />
      </div>

      <CommentList comments={comments || []} />
      <CommentForm postId={postId} />
    </article>
  )
}
