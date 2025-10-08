// /app/(site)/post/[id]/page.tsx
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
// ...existing code...
import ReactionsBar from "@/components/ReactionsBar";
import supabaseServer from "@/lib/supabaseServer";
import { extractPostContent, markdownToHtml } from "@/lib/postContent";
import type { TablesRow } from "@/lib/database.types";
import AdminDeletePostButton from "@/components/AdminDeletePostButton";

export const dynamic = "force-dynamic";

type PostRow = Pick<
  TablesRow<"posts">,
  | "id"
  | "author"
  | "title"
  | "content"
  | "content_html"
  | "content_json"
  | "image_url"
  | "created_at"
  | "status"
> & {
  post_tags?: { tags: { id: string; name: string; slug: string } | null }[] | null;
};

type CommentRow = {
  id: string;
  content: string;
  created_at: string | null;
  commenter_name: string | null;
  author: { display_name: string | null } | null;
  status: "pending" | "approved" | "rejected";
};

export default async function PostPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { ok?: string; err?: string };
}) {
  const postId = params.id;
  const sb = supabaseServer();
  const { data: authRes } = await sb.auth.getUser();
  const user = authRes?.user ?? null;
  const adminEmail =
    process.env.NEXT_PUBLIC_ADMIN_EMAIL?.toLowerCase() ?? "wenyu.yan@gmail.com";
  const isAdmin = Boolean(
    user?.email && user.email.toLowerCase() === adminEmail,
  );
  const {
    data: post,
    error: postError,
  } = await sb
    .from("posts")
    .select(
      `
        id,
        author,
        title,
        content,
        content_html,
        content_json,
        image_url,
        created_at,
        status,
        post_tags:post_tags(tags(id, name, slug))
      `
    )
    .eq("id", postId)
    .maybeSingle<PostRow>();

  if (postError) {
    console.error(`[post/${postId}] failed to load post`, postError);
  }

  if (!post) {
    console.warn(`[post/${postId}] post not found or blocked by RLS`);
    return <div className="p-4">Post not found.</div>;
  }

  if (post.status === "deleted") {
    console.warn(`[post/${postId}] post marked as deleted`);
    return <div className="p-4">Post not found.</div>;
  }

  const isAuthor = user?.id === post.author;
  const isApproved = post.status === "approved";

  if (!isApproved && !isAuthor) {
    console.warn(`[post/${postId}] post status '${post.status}' not visible to viewer`);
    return <div className="p-4">Post not found.</div>;
  }

  const { data: commentsData, error: commentsError } = await sb
    .from("comments")
    .select("id, content, created_at, status, commenter_name, author:profiles(display_name)")
    .eq("post_id", postId)
    .eq("status", "approved");
  if (commentsError) {
    console.error(`[post/${postId}] failed to load comments`, commentsError);
  }
  const comments = (commentsData ?? []) as CommentRow[];

  const { html, text } = extractPostContent({
    content_html: post.content_html,
    content: post.content,
  });
  const safeHtml = html || (text ? markdownToHtml(text) : "<p></p>");
  const tags = (post.post_tags ?? [])
    .map((entry) => entry.tags)
    .filter((tag): tag is { id: string; name: string; slug: string } => Boolean(tag));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h1 className="font-mc text-lg">{post.title}</h1>
        {isAdmin && (
          <AdminDeletePostButton
            postId={post.id}
            behavior="redirect"
            successMessage="Post deleted"
            confirmMessage="Type DELETE to permanently hide this post."
          />
        )}
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.14em] text-mc-stone">
          {tags.map((tag) => (
            <Link
              key={tag.id}
              href={`/tags/${tag.slug}`}
              className="rounded-full border border-mc-wood-dark bg-mc-sand px-2 py-1 text-mc-dirt"
            >
              #{tag.name}
            </Link>
          ))}
        </div>
      )}
      {post.image_url && (
        <div className="overflow-hidden rounded-lg border-2 border-mc-wood-dark">
          <img
            src={post.image_url}
            alt={post.title ? `${post.title} featured image` : "Featured post image"}
            className="block h-auto w-full object-cover"
            loading="lazy"
          />
        </div>
      )}

      <article
        className="prose prose-sm sm:prose-base max-w-none text-mc-dirt prose-img:mx-auto prose-img:block prose-img:h-auto prose-img:max-w-full"
        dangerouslySetInnerHTML={{ __html: safeHtml }}
      />

  {/* Likes */}
  {/* <LikeButton postId={post.id} /> */}
  <ReactionsBar postId={post.id} />

      {/* Comments */}
      <section>
        <h2 className="font-mc text-base mb-2">Comments</h2>
        {searchParams?.ok === "1" && (
          <div className="text-green-600 text-xs mb-2">✅ Comment submitted for approval!</div>
        )}
        {searchParams?.err === "empty" && (
          <div className="text-red-600 text-xs mb-2">⚠️ Please write a comment before submitting.</div>
        )}
        {searchParams?.err === "noname" && (
          <div className="text-red-600 text-xs mb-2">⚠️ Please provide your name.</div>
        )}
        {searchParams?.err === "namelong" && (
          <div className="text-red-600 text-xs mb-2">⚠️ Name must be 50 characters or less.</div>
        )}
        {searchParams?.err === "toolong" && (
          <div className="text-red-600 text-xs mb-2">⚠️ Comment is too long (max 2000 characters).</div>
        )}
        {searchParams?.err && !["empty", "noname", "namelong", "toolong"].includes(searchParams.err) && (
          <div className="text-red-600 text-xs mb-2">⚠️ Something went wrong. Please try again.</div>
        )}
        {comments.length ? (
          comments.map((comment) => (
            <div key={comment.id} className="card-block mb-2 space-y-1">
              <p className="text-xs">{comment.content}</p>
              <div className="text-[10px] opacity-70">
                {(comment.author?.display_name ?? comment.commenter_name ?? "Anonymous") +
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
          <input
            name="name"
            type="text"
            placeholder="Your name..."
            className="w-full rounded border p-2 text-xs"
            required
            maxLength={50}
          />
          <textarea
            name="content"
            placeholder="Write a comment..."
            className="w-full rounded border p-2 text-xs"
            required
          />
          <button type="submit" className="btn-mc">Submit for approval</button>
        </form>
      </section>

      <Link href="/" className="btn-mc-secondary mt-4">← Back to Home</Link>
    </div>
  );
}
