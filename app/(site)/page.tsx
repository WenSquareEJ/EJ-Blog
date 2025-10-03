// /app/(site)/page.tsx
import { createServerClient } from "@/lib/createServerClient"
import Link from "next/link"

export default async function HomePage({ searchParams }: { searchParams?: { page?: string } }) {
  const page = parseInt(searchParams?.page || "1", 10)
  const perPage = 3
  const from = (page - 1) * perPage
  const to = from + perPage - 1

  const sb = createServerClient()
  const { data: posts, error } = await sb
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false })
    .range(from, to)

  if (error) {
    console.error(error)
    return <div className="p-4 text-red-500">Error loading posts.</div>
  }

  return (
    <div className="space-y-4">
      <h1 className="font-mc text-lg md:text-xl mb-4">Recent Posts</h1>

      {posts?.length ? (
        posts.map((post) => (
          <div key={post.id} className="card-block">
            <h2 className="font-mc text-base mb-2">{post.title}</h2>
            <p className="text-sm mb-2 line-clamp-3">{post.content}</p>
            <Link href={`/post/${post.id}`} className="btn-mc">Read More</Link>
          </div>
        ))
      ) : (
        <p>No posts yet.</p>
      )}

      {/* Pagination */}
      <div className="flex gap-2 mt-4">
        {page > 1 && (
          <Link href={`/?page=${page - 1}`} className="btn-mc-secondary">Previous</Link>
        )}
        {posts?.length === perPage && (
          <Link href={`/?page=${page + 1}`} className="btn-mc-secondary">Next</Link>
        )}
      </div>
    </div>
  )
}
