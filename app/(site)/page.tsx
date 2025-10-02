import Link from "next/link"
import { supabaseServer } from "@/lib/supabaseServer"

// Simple HTML → text preview (no extra deps)
function toTextPreview(html: string, max = 160) {
  const text = (html || "").replace(/<[^>]+>/g, "").trim()
  return text.length > max ? text.slice(0, max) + "…" : text
}

type Post = {
  id: string
  title: string | null
  content: string | null
  author?: string | null
  created_at?: string | null
  published_at?: string | null
}

async function getPosts() {
  const sb = supabaseServer()
  const { data, error } = await sb
    .from("posts")
    .select("id,title,content,author,created_at,published_at")
    .order("created_at", { ascending: false })

  if (error) {
    // Surface a tiny hint on-screen but don't crash the page
    return { posts: [] as Post[], error: error.message }
  }
  return { posts: (data ?? []) as Post[], error: null as string | null }
}

export default async function HomePage() {
  const { posts, error } = await getPosts()

  return (
    <main className="mx-auto max-w-3xl p-4">
      {/* Tiny debug hint if something went wrong fetching posts */}
      {error && (
        <div className="mb-4 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          Failed to load posts: {error}
        </div>
      )}

      <h1 className="mb-6 text-2xl font-semibold">Latest Posts</h1>

      <div className="space-y-5">
        {posts.length === 0 && (
          <p className="text-sm text-neutral-500">
            No posts yet. Try creating one from <Link className="underline" href="/post/new">New Post</Link>.
          </p>
        )}

        {posts.map((post) => {
          const when = post.published_at || post.created_at
          return (
            <article
              key={post.id}
              className="rounded-lg border bg-white p-4 shadow-sm transition hover:shadow-md"
            >
              <header className="mb-2 flex items-center justify-between gap-2">
                <h2 className="text-lg font-medium">
                  <Link href={`/post/${post.id}`} className="hover:underline">
                    {post.title || "(untitled)"}
                  </Link>
                </h2>
                {when && (
                  <time
                    className="shrink-0 text-xs text-neutral-500"
                    dateTime={new Date(when).toISOString()}
                  >
                    {new Date(when).toLocaleString()}
                  </time>
                )}
              </header>
              <p className="text-sm text-neutral-700">
                {toTextPreview(post.content || "")}
              </p>
              <div className="mt-3">
                <Link
                  href={`/post/${post.id}`}
                  className="text-sm font-medium underline"
                >
                  Read more →
                </Link>
              </div>
            </article>
          )
        })}
      </div>
    </main>
  )
}
