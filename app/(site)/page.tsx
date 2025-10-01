import PostCard from '@/components/PostCard'
import { supabaseServer } from '@/lib/supabaseServer'

export default async function HomePage() {
  const sb = supabaseServer()
  const { data } = await sb.from('posts').select('*').eq('status','approved').order('published_at', { ascending: false }).limit(20)
  return <div className="space-y-4">{(data||[]).map(p=> <PostCard key={p.id} post={p} />)}</div>
}
