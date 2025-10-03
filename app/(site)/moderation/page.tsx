// app/(site)/moderation/page.tsx
import Link from "next/link";
import supabaseServer from "@/lib/supabaseServer";
import type { TablesRow } from "@/lib/database.types";

type ModPost = {
  id: string;
  title: string | null;
  created_at: string | null;
  status: "pending" | "approved" | "rejected";
  author_name: string | null;
};

type ModComment = {
  id: string;
  post_id: string;
  post_title: string | null;
  content: string;
  created_at: string | null;
};

type RawPost = Pick<TablesRow<"posts">, "id" | "title" | "created_at" | "status"> & {
  author: { display_name: string | null } | null;
};

type RawComment = Pick<TablesRow<"comments">, "id" | "post_id" | "content" | "created_at" | "status"> & {
  post: { title: string | null } | null;
};

export default async function ModerationPage() {
  const sb = supabaseServer();

  const { data: postData, error: postError } = await sb
    .from("posts")
    .select("id,title,created_at,status,author:profiles!posts_author_fkey(display_name)")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  const posts: ModPost[] = (postData ?? []).map((post) => {
    const typed = post as RawPost;
    return {
      id: typed.id,
      title: typed.title,
      created_at: typed.created_at,
      status: typed.status as ModPost["status"],
      author_name: typed.author?.display_name ?? null,
    };
  });

  const { data: commentData, error: commentError } = await sb
    .from("comments")
    .select("id,content,created_at,post_id,post:posts(title)")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  const comments: ModComment[] = (commentData ?? []).map((comment) => {
    const typed = comment as RawComment;
    return {
      id: typed.id,
      post_id: typed.post_id,
      content: typed.content,
      created_at: typed.created_at,
      post_title: typed.post?.title ?? null,
    };
  });

  return (
    <main className="space-y-4">
      <h1 className="text-xl font-semibold">Moderation Queue</h1>

      {postError && (
        <p className="text-red-600">
          Failed to load pending posts: {postError.message}
        </p>
      )}

      {posts.length === 0 ? (
        <p>No pending posts.</p>
      ) : (
        <ul className="space-y-2">
          {posts.map((p) => (
            <li key={p.id} className="border p-3 rounded bg-white/70">
              <div className="font-medium">{p.title ?? "(Untitled)"}</div>
              <div className="text-xs opacity-70">
                {p.author_name ?? "Unknown"} ·{" "}
                {p.created_at ? new Date(p.created_at).toLocaleString() : "Unknown time"}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link className="btn-mc" href={`/post/${p.id}`}>
                  View
                </Link>
                <form method="post" action={`/api/posts/${p.id}/approve`}>
                  <button className="btn-mc" type="submit">
                    Approve
                  </button>
                </form>
                <form method="post" action={`/api/posts/${p.id}/reject`}>
                  <button className="btn-mc-secondary" type="submit">
                    Reject
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Pending Comments</h2>

        {commentError && (
          <p className="text-red-600">
            Failed to load pending comments: {commentError.message}
          </p>
        )}

        {comments.length === 0 ? (
          <p>No pending comments.</p>
        ) : (
          <ul className="space-y-2">
            {comments.map((comment) => (
              <li key={comment.id} className="border p-3 rounded bg-white/70 space-y-2">
                <div className="text-xs opacity-70">
                  On post: {comment.post_title ?? comment.post_id}
                </div>
                <p className="text-sm">{comment.content}</p>
                <div className="text-xs opacity-60">
                  {comment.created_at
                    ? new Date(comment.created_at).toLocaleString()
                    : "Unknown time"}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <form method="post" action={`/api/comments/${comment.id}/approve`}>
                    <button className="btn-mc" type="submit">
                      Approve
                    </button>
                  </form>
                  <form method="post" action={`/api/comments/${comment.id}/reject`}>
                    <button className="btn-mc-secondary" type="submit">
                      Reject
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
