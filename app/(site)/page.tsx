export const dynamic = 'force-dynamic'

import Link from 'next/link'
import PostCard from '@/components/PostCard'
import { supabaseServer } from '@/lib/supabaseServer'
import Hero from '@/components/Hero'

const PAGE_SIZE = 3

export default async function HomePage({
  searchParams,
}: { searchParams?: { page?: string } }) {
  const page = Math.max(1, Number(searchParams?.page || 1))
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE

  const sb = supabaseServer()

  // Get all approved posts (count included)
  const { data: all, count } = await sb
    .from('posts')
    .select('*', { count: 'exact' })
    .eq('status', 'approved')

  const list = (all || [])
    // coalesce: published_at when present, else created_at
    .sort((a: any, b: any) => {
      const ta = new Date(a.published_at || a.created_at).getTime()
      const tb = new Date(b.published_at || b.created_at).getTime()
      return tb - ta // newest first
    })

  const pageItems = list.slice(from, to)
  const total = count ?? list.length
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div>
      <Hero />

      <div className="space-y-4">
        {pageItems.map((p: any) => <PostCard key={p.id} post={p} />)}
        {pageItems.length === 0 && (
          <p className="text-sm text-mc-stone">No posts yet.</p>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-6">
        {page > 1 ? (
          <Link href={`/?page=${page - 1}`} className="px-3 py-2 rounded-block border hover:bg-gray-50">
            ← Newer
          </Link>
        ) : <span />}

        <span className="text-sm text-mc-stone">Page {page} of {totalPages}</span>

        {page < totalPages ? (
          <Link href={`/?page=${page + 1}`} className="px-3 py-2 rounded-block border hover:bg-gray-50">
            Older →
          </Link>
        ) : <span />}
      </div>
    </div>
  )
}
