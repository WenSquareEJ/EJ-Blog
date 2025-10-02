import { supabaseServer } from '@/lib/supabaseServer'
import DOMPurify from 'isomorphic-dompurify'
import CommentList from '@/components/CommentList'
import CommentForm from '@/components/CommentForm'
import ReactionBar from '@/components/ReactionBar'
import DeletePostButton from '@/components/DeletePostButton'

export default async function PostPage({ params }: { params: { id: string } }) {
  const postId = params.id
  const sb = supabaseServer()

  // 1) Load post (allow for both author / author_id shapes)
  const { data: posts, error: postErr } = await sb
    .from('posts')
    .select('*')
    .eq('id', postId)
    .limit(1)

  if (postErr) {
    return (
      <pre className="text-xs p-2 rounded bg-red-50 border border-red-200 whitespace-pre-wrap">
        Post load error: {postErr.message}
      </pre>
    )
  }
  const post = posts?.[0]
  if (!post) return <p>Not found</p>

  // 2) Who is viewing?
  const { data: ures } = await sb.auth.getUser()
  const viewerId = ures?.user?.id ?? null

  // Read role via profiles (RLS policy above allows this)
  let viewerRole: 'parent' | 'child' | null = null
  if (viewerId) {
    const { data: prof } = await sb
      .from('profiles')
      .select('role')
      .eq('id', viewerId)
      .maybeSingle()

    const raw = (prof?.role ?? '') as string
    const normalized = raw.trim().toLowerCase()
    viewerRole =
      normalized === 'parent' || normalized === 'guardian'
        ? 'parent'
        : normalized === 'child'
        ? 'child'
        : null
  }

  // Support either column name
  const postAuthorId: string | null =
    (post as any).author_id ?? (post as any).author ?? null

  const isParent = viewerRole === 'parent'
  const isAuthor = !!viewerId && !!postAuthorId && viewerId === postAuthorId
  const canDelete = isParent || isAuthor

  // 3) Approved comments
  const { data: comments } = await sb
    .from('comments')
    .select('*')
    .eq('post_id', postId)
    .eq('status', 'approved')
    .order('created_at', { ascending: true })

  // 4) Render the rich content
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

      {/* TEMP debug — remove after confirming */}
      <pre className="text-[10px] mt-2 p-2 rounded bg-yellow-50 border border-yellow-200 whitespace-pre-wrap">
{`DEBUG:
viewerId:   ${viewerId}
viewerRole: ${viewerRole}
postAuthor: ${postAuthorId}
canDelete:  ${String(canDelete)}`}
      </pre>

      <div dangerouslySetInnerHTML={{ __html: safeHtml }} />

      <div className="my-4">
        <ReactionBar targetType="post" targetId={postId} />
      </div>

      <CommentList comments={comments || []} />
      <CommentForm postId={postId} />
    </article>
  )
}
