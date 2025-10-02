import Link from 'next/link'
import { supabaseServer } from '@/lib/supabaseServer'
import DOMPurify from 'isomorphic-dompurify'

const PAGE_SIZE = 3

export default async function Home({
  searchParams,
}: {
  searchParams?: { page?: string }
}) {
  const page = Math.max(1, Number(searchParams?.page || 1))
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const sb = supabaseServer()

  // newest first
  const { data: posts, count } = await sb
    .from('posts')
    .select('*', { count: 'exact' })
    .eq('status', 'approved')
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .range(from, to)

  const list = posts ?? [] // <- avoid null
  const totalPages = Math.max(1, Math.ceil((count || 0) / PAGE_SIZE))

  return (
    <main className="max-w-3xl mx-auto px-4 pb-12">
      {/* intro card */}
      <section className="card-block p-6 mb-6">
        <h2 className="text-2xl font-bold mb-2">Welcome to EJ’s Blog 👋</h2>
        <p className="text-sm opacity-80">
          Stories, builds, drawings, and adventures – all family-friendly and parent-approved.
        </p>
      </section>

      {/* posts */}
      <div className="space-y-5">
        {list.map((post) => {
          // HTML preview: keep basic formatting, strip media tags
          const safePreview = DOMPurify.sanitize(post.content || '', {
            USE_PROFILES: { html: true },
            FORBID_TAGS: ['img', 'video', 'iframe', 'audio'],
          })

          return (
            <article key={post.id} className="card-block p-5">
              <Link href={`/post/${post.id}`} className="no-underline">
                <h3 className="text-xl font-bold mb-1">{post.title}</h3>
              </Link>
              <p className="text-xs text-mc-stone mb-3">
                {new Date(post.published_at || post.created_at).toLocaleString()}
              </p>

              <div
                className="prose max-w-none overflow-hidden"
                style={{ maxHeight: 220 }}
                dangerouslySetInnerHTML={{ __html: safePreview }}
              />

              <div className="mt-4">
                <Link href={`/post/${post.id}`} className="btn-block inline-flex">
                  Read more
                </Link>
              </div>
            </article>
          )
        })}
      </div>

      {/* pagination */}
      <div className="flex items-center justify-center gap-3 mt-8 text-sm">
        <Link
          href={page > 1 ? `/?page=${page - 1}` : '#'}
          aria-disabled={page <= 1}
          className="btn-block secondary disabled:opacity-50"
        >
          ← Newer
        </Link>
        <span className="px-2">Page {page} of {totalPages}</span>
        <Link
          href={page < totalPages ? `/?page=${page + 1}` : '#'}
          aria-disabled={page >= totalPages}
          className="btn-block secondary disabled:opacity-50"
        >
          Older →
        </Link>
      </div>
    </main>
  )
}
