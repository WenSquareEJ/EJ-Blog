import { supabaseServer } from '@/lib/supabaseServer'
import DOMPurify from 'isomorphic-dompurify'
import CommentList from '@/components/CommentList'
import CommentForm from '@/components/CommentForm'
import ReactionBar from '@/components/ReactionBar'
import DeletePostButton from '@/components/DeletePostButton'

export default async function PostPage({ params }: { params: { id: string } }) {
  const postId = params.id
  const sb = supabaseServer()

  // 1) Load the post
  const { data: posts, error: postErr } = await sb
    .from('posts')
    .select('*')
    .eq('id', postId)
    .limit(1)

  if (postErr) return <p>Error loading post.</p>
  const post = posts?.[0]
  if (!post) return <p>Not found</p>

  // 2) Who is viewing?
  const { data: ures } = await sb.auth.getUser()
  const userId = ures?.user?.id ?? null

  let isParent = false
  if (userId) {
    const { data: prof } = await sb
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle()
    isParent = prof?.role === 'parent'
  }
  const isAuthor = !!userId && post.author === userId
  const canDelete = isParent || isAuthor

  // 3) Comments (approved only)
  const { data: comments } = await sb
    .from('comments')
    .select('*')
    .eq('post_id', postId)
    .eq('status', 'approved')
    .order('created_at', { ascending: true })

  // 4) Safe HTML render for rich content
  const safeHtml = DOMPurify.sanitize(post.content || '', {
    USE_PROFILES: { html: true },
  })

  return (
    <article className="prose max-w-none">
      <div className="flex items-center justify-between">
        <div>
          <h1>{post.title}</h1>
          <p className="text-sm text-mc-stone">
            {new Date(post.published_at || post.created_at).toLocaleString()}
          </p>
        </div>
        {canDelete && <DeletePostButton postId={postId} />}
      </div>

      {/* Render HTML content, including inline images */}
      <div dangerouslySetInnerHTML={{ __html: safeHtml }} />

      <div className="my-4">
        <ReactionBar targetType="post" targetId={postId} />
      </div>

      <CommentList comments={comments || []} />
      <CommentForm postId={postId} />
    </article>
  )
}
