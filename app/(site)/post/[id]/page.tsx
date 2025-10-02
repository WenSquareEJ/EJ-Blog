// app/(site)/post/[id]/page.tsx
export const dynamic = "force-dynamic"; // ensure this route is rendered at request time

import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";
import DOMPurify from "isomorphic-dompurify";

import CommentList from "@/components/CommentList";
import CommentForm from "@/components/CommentForm";
import ReactionBar from "@/components/ReactionBar";
import DeletePostButton from "../DeletePostButton"; // file at app/(site)/post/DeletePostButton.tsx

type PageProps = { params: { id: string } };

export default async function PostPage({ params }: PageProps) {
  const postId = params.id;
  const sb = supabaseServer();

  // 1) Load the post
  const { data: post, error: postErr } = await sb
    .from("posts")
    .select("*")
    .eq("id", postId)
    .maybeSingle();

  if (postErr) {
    // If the query failed, show a basic error (you can customize)
    return <div className="p-4 text-red-600">Error loading post.</div>;
  }
  if (!post) {
    // If not found, render the 404 page
    notFound();
  }

  // 2) Who is viewing?
  const { data: ures } = await sb.auth.getUser();
  const viewerId = ures?.user?.id ?? null;

  // 3) Determine role (parent / child) and author match
  let viewerRole: "parent" | "child" | null = null;
  if (viewerId) {
    const { data: prof } = await sb
      .from("profiles")
      .select("role")
      .eq("id", viewerId)
      .maybeSingle();
    viewerRole = (prof?.role as "parent" | "child") ?? null;
  }

  const isAuthor = !!viewerId && post.author === viewerId;
  const canDelete = viewerRole === "parent" || isAuthor;

  // 4) Load approved comments
  const { data: comments } = await sb
    .from("comments")
    .select("*")
    .eq("post_id", postId)
    .eq("status", "approved")
    .order("created_at", { ascending: true });

  // 5) Safe HTML render (for rich editor content)
  const safeHtml = DOMPurify.sanitize(post.content || "", {
    USE_PROFILES: { html: true },
  });

  // 6) Render
  return (
    <main className="mx-auto max-w-3xl p-4">
      <article className="prose max-w-none">
        <header className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="mb-1">{post.title || "(untitled)"}</h1>
            <p className="text-sm text-neutral-500">
              {new Date(post.published_at || post.created_at).toLocaleString()}
            </p>
          </div>

          {/* Delete button only for parent or author */}
          {canDelete && <DeletePostButton postId={postId} />}
        </header>

        {/* Rich content from editor */}
        <div dangerouslySetInnerHTML={{ __html: safeHtml }} />

        <div className="my-4">
          <ReactionBar targetType="post" targetId={postId} />
        </div>

        <section className="mt-8">
          <h2 className="mb-3 text-xl font-semibold">Comments</h2>
          <CommentList comments={comments || []} />
          <div className="mt-4">
            <CommentForm postId={postId} />
          </div>
        </section>
      </article>
    </main>
  );
}
