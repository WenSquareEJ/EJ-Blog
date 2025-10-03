// app/(site)/moderation/page.tsx
import Link from "next/link";
import supabaseServer from "@/lib/supabaseServer";

type ModPost = {
  id: string;
  title: string | null;
  created_at: string;
  status: "pending" | "approved" | "rejected";
  author_name: string | null;
};

export default async function ModerationPage() {
  const sb = supabaseServer();

  const { data, error } = await sb
    .from("posts")
    .select("id,title,created_at,status,author(name)")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  const posts: ModPost[] = (data ?? []).map((post) => ({
    id: post.id,
    title: post.title,
    created_at: post.created_at,
    status: post.status,
    author_name: (post.author as { name?: string } | null)?.name ?? null,
  }));

  return (
    <main className="space-y-4">
      <h1 className="text-xl font-semibold">Moderation Queue</h1>

      {error && (
        <p className="text-red-600">
          Failed to load pending posts: {error.message}
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
                {new Date(p.created_at).toLocaleString()}
              </div>
              <div className="mt-2">
                <Link className="btn-mc" href={`/post/${p.id}`}>
                  View
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
