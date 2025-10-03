// /app/(site)/post/[id]/page.tsx
import supabaseServer from "@/lib/supabaseServer";
import Link from "next/link";
import { extractPostContent, markdownToHtml } from "@/lib/postContent";

type CommentRow = {
  id: string;
  content: string;
  created_at: string | null;
  author: { display_name: string | null } | null;
  status: "pending" | "approved" | "rejected";
};

export default async function PostPage({ params }: { params: { id: string } }) {
  const sb = supabaseServer();
  const { data: post } = await sb
    .from("posts")
    .select("id, title, content, content_html, content_json, image_url, created_at")
    .eq("id", params.id)
    .single();
  const { data: commentsData } = await sb
    .from("comments")
    .select("id, content, created_at, status, author:profiles(display_name)")
    .eq("post_id", params.id)
    .eq("status", "approved");
  const comments = (commentsData ?? []) as CommentRow[];

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
        {comments.length ? (
          comments.map((comment) => (
            <div key={comment.id} className="card-block mb-2 space-y-1">
              <p className="text-xs">{comment.content}</p>
              <div className="text-[10px] opacity-70">
                {(comment.author?.display_name ?? "Guest") +
                  " • " +
                  (comment.created_at
                    ? new Date(comment.created_at).toLocaleString()
                    : "Unknown time")}
              </div>
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
          <button type="submit" className="btn-mc">Submit for approval</button>
        </form>
      </section>

      <Link href="/" className="btn-mc-secondary mt-4">← Back to Home</Link>
    </div>
  )
}
