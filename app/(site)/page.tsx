export const dynamic = 'force-dynamic'

import PostCard from '@/components/PostCard'
import { supabaseServer } from '@/lib/supabaseServer'
import Hero from '@/components/Hero'

export default async function HomePage() {
  const sb = supabaseServer()
  const { data: posts } = await sb
    .from('posts')
    .select('*')
    .eq('status','approved')
    .order('published_at', { ascending: false })
    .limit(20)

  return (
    <div>
      <Hero />
      <div className="space-y-4">
        {(posts||[]).map(p => <PostCard key={p.id} post={p} />)}
      </div>
    </div>
  )
}
