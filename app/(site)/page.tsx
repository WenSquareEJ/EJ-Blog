export const dynamic = 'force-dynamic'

import PostCard from '@/components/PostCard'
import { supabaseServer } from '@/lib/supabaseServer'

export default async function HomePage() {
  const sb = supabaseServer()
  const { data: posts } = await sb
    .from('posts')
    .select('*')
    .eq('status','approved')
    .order('published_at', { ascending: false })
    .limit(20)

  // join tags for each post
  const postsWithTags = []
  for (const p of posts || []) {
    const { data: pt } = await sb
      .from('post_tags')
      .select('tag_id, tags(name, slug)')
      .eq('post_id', p.id)
      .returns<any[]>()
      .maybeSingle()

    const list = Array.isArray(pt) ? pt : (pt ? [pt] : [])
    p.tags = list
      .map((row:any) => row.tags)
      .filter(Boolean)
    postsWithTags.push(p)
  }

  return <div className="space-y-4">{postsWithTags.map(p=> <PostCard key={p.id} post={p} />)}</div>
}
