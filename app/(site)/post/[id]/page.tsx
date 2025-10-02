import { supabaseServer } from '@/lib/supabaseServer'
import DOMPurify from 'isomorphic-dompurify'
import CommentList from '@/components/CommentList'
import CommentForm from '@/components/CommentForm'
import ReactionBar from '@/components/ReactionBar'

export default async function PostPage({ params }: { params: { id: string } }) {
  const sb = supabaseServer()
  const { data: posts } = await sb.from('posts').select('*').eq('id', params.id).limit(1)
  const post = posts?.[0]
  if (!post) return <p>Not found</p>

  const { data: comments } = await sb
    .from('comments')
    .select('*')
    .eq('post_id', params.id)
    .eq('status','approved')
    .order('created_at', { ascending: true })

  const safeHtml = DOMPurify.sanitize(post.content || '', { USE_PROFILES: { html: true } })

  return (
    <article className="prose max-w-none">
      <h1>{post.title}</h1>
      <p className="text-sm text-mc-stone">
        {new Date(post.published_at || post.created_at).toLocaleString()}
      </p>

      {/* Render HTML content, including inline images */}
      <div dangerouslySetInnerHTML={{ __html: safeHtml }} />

      <div className="my-4">
        <ReactionBar targetType="post" targetId={params.id} />
      </div>

      <CommentList comments={comments || []} />
      <CommentForm postId={params.id} />
    </article>
  )
}
