export const dynamic = 'force-dynamic'

import Link from 'next/link'
import PostCard from '@/components/PostCard'
import { supabaseServer } from '@/lib/supabaseServer'
import Hero from '@/components/Hero'

const PAGE_SIZE = 3

export default async function HomePage({
  searchParams,
}: {
  searchParams?: { page?: string }
}) {
  const page = Math.max(1, Number(searchParams?.page || 1))
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const sb = supabaseServer()

  // Only approved posts; newest first
  const { data: posts, count } = await sb
    .from('posts')
    .select('*', { count: 'exact' })
    .eq('status', 'approved')
    .order('published_at', { ascending: false })
    .range(from, to)

  const total = count || 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div>
      <Hero />

      <div className="space-y-4">
        {(posts || []).map((p: any) => <PostCard key={p.id} post={p} />)}
        {(!posts || posts.length === 0) && (
          <p className="text-sm text-mc-stone">No posts yet.</p>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-6">
        {page > 1 ? (
          <Link
            href={`/?page=${page - 1}`}
            className="px-3 py-2 rounded-block border hover:bg-gray-50"
          >
            ← Newer
          </Link>
        ) : <span />}

        <span className="text-sm text-mc-stone">
          Page {page} of {totalPages}
        </span>

        {page < totalPages ? (
          <Link
            href={`/?page=${page + 1}`}
            className="px-3 py-2 rounded-block border hover:bg-gray-50"
          >
            Older →
          </Link>
        ) : <span />}
      </div>
    </div>
  )
}
