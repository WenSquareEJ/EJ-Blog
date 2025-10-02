// app/(site)/post/[id]/page.tsx
import { supabaseServer } from '@/lib/supabaseServer'
import DOMPurify from 'isomorphic-dompurify'
import CommentList from '@/components/CommentList'
import CommentForm from '@/components/CommentForm'
import ReactionBar from '@/components/ReactionBar'
import DeletePostButton from '@/components/DeletePostButton'

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const dynamicParams = true;

type PageProps = {
  params: { id: string }
  searchParams?: Record<string, string | string[] | undefined>
}

export default async function PostPage({ params, searchParams }: PageProps) {
  const postId = params.id
  const sb = supabaseServer()

  // Load the post
  const { data: posts, error: postErr } = await sb
    .from('posts')
    .select('*')
    .eq('id', postId)
    .limit(1)

  if (postErr) {
    return <p>Error loading post.</p>
  }
  const post = posts?.[0]
  if (!post) return <p>Not found</p>

  // ---- Who is viewing? ----
  // Correct way to read the user with @supabase/auth-helpers-nextjs
  const {
    data: { user },
  } = await sb.auth.getUser()
  const viewerId = user?.id ?? null

  // Look up the viewer's role (parent/child) from profiles
  let viewerRole: 'parent' | 'child' | null = null
  if (viewerId) {
    const { data: prof } = await sb
      .from('profiles')
      .select('role')
      .eq('id', viewerId)
      .maybeSingle()
    viewerRole = (prof?.role as 'parent' | 'child' | null) ?? null
  }

  const isAuthor = !!viewerId && post.author === viewerId
  const canDelete = isAuthor || viewerRole === 'parent'

  // Approved comments for this post
  const { data: comments } = await sb
    .from('comments')
    .select('*')
    .eq('post_id', postId)
    .eq('status', 'approved')
    .order('created_at', { ascending: true })

  // Safe HTML render for rich content
  const safeHtml = DOMPurify.sanitize(post.content || '', {
    USE_PROFILES: { html: true },
  })

  const showDebug =
    typeof searchParams?.debug === 'string' && searchParams?.debug === '1'

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

      {showDebug && (
        <pre className="bg-yellow-50 border border-yellow-300 p-3 rounded mb-4 text-xs">
{`DEBUG:
viewerId: ${viewerId ?? 'null'}
viewerRole: ${viewerRole ?? 'null'}
postAuthor: ${post.author ?? 'null'}
canDelete: ${String(canDelete)}`}
        </pre>
      )}

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
