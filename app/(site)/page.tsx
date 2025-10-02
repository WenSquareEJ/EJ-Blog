export const dynamic = 'force-dynamic'

import PostCard from '@/components/PostCard'
import { supabaseServer } from '@/lib/supabaseServer'
import Hero from '@/components/Hero'

export default async function HomePage() {
  const sb = supabaseServer()
  const { data } = await sb
    .from('posts')
    .select('*')
    .eq('status', 'approved')

  // Sort newest first by published_at || created_at
  const posts = (data || []).sort((a: any, b: any) => {
    const da = new Date(a.published_at || a.created_at).getTime()
    const db = new Date(b.published_at || b.created_at).getTime()
    return db - da
  })

  return (
    <div>
      <Hero />
      <div className="space-y-4">
        {posts.map((p:any) => <PostCard key={p.id} post={p} />)}
      </div>
    </div>
  )
}
