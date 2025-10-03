// /app/(site)/post/[id]/page.tsx
import supabaseServer from "@/lib/supabaseServer";
import Link from "next/link";
import { extractPostContent, markdownToHtml } from "@/lib/postContent";

export default async function PostPage({ params }: { params: { id: string } }) {
  const sb = supabaseServer()
  const { data: post } = await sb
    .from("posts")
    .select("id, title, content, content_html, content_json, image_url, created_at")
    .eq("id", params.id)
    .single()
  const { data: comments } = await sb.from("comments").select("*").eq("post_id", params.id)

  if (!post) return <div className="p-4">Post not found.</div>

  const { html, text } = extractPostContent({
    content_html: post.content_html,
    content: post.content,
  });
  const safeHtml = html || (text ? markdownToHtml(text) : "<p></p>");

  return (
    <div className="space-y-4">
      <h1 className="font-mc text-lg">{post.title}</h1>
      <article
        className="prose prose-sm sm:prose-base max-w-none text-mc-dirt"
        dangerouslySetInnerHTML={{ __html: safeHtml }}
      />

      {/* Likes */}
      <form action={`/api/posts/${post.id}/like`} method="post">
        <button className="btn-mc mt-3">❤️ Like</button>
      </form>

      {/* Comments */}
      <section>
        <h2 className="font-mc text-base mb-2">Comments</h2>
        {comments?.length ? (
          comments.map((c) => (
            <div key={c.id} className="card-block mb-2">
              <p className="text-xs">{c.content}</p>
            </div>
          ))
        ) : (
          <p>No comments yet.</p>
        )}

        <form action={`/api/posts/${post.id}/comment`} method="post" className="mt-2 space-y-2">
          <textarea
            name="content"
            placeholder="Write a comment..."
            className="w-full rounded border p-2 text-xs"
          />
          <button type="submit" className="btn-mc">Add Comment</button>
        </form>
      </section>

      <Link href="/" className="btn-mc-secondary mt-4">← Back to Home</Link>
    </div>
  )
}
