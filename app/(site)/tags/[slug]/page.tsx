import PostCard from '@/components/PostCard'
import { createServerClient } from '@/lib/supabaseServer'

export default async function TagPage({ params }: { params: { slug: string } }) {
  const sb = createServerClient()

  // find tag id
  const { data: tag } = await sb.from('tags').select('id, name, slug').eq('slug', params.slug).maybeSingle()
  if (!tag) return <p className="text-gray-600">Tag not found.</p>

  // get posts for that tag
  const { data: pt } = await sb.from('post_tags').select('post_id').eq('tag_id', tag.id)
  const ids = (pt || []).map((r:any)=> r.post_id)
  let posts:any[] = []
  if (ids.length) {
    const { data } = await sb.from('posts').select('*').in('id', ids).eq('status','approved').order('published_at', { ascending: false })
    posts = data || []
    // attach tags to each post (optional – similar to homepage)
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Posts tagged “{tag.name}”</h1>
      <div className="space-y-4">{posts.map(p => <PostCard key={p.id} post={p} />)}</div>
    </div>
  )
}
