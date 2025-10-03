// app/(site)/moderation/page.tsx
import Link from "next/link";
import supabaseServer from "@/lib/supabaseServer";

export default async function ModerationPage() {
  const sb = supabaseServer();

  const { data: posts = [] } = await sb
    .from("posts")
    .select("id,title,created_at,status,author_name")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  return (
    <main className="space-y-4">
      <h1 className="text-xl font-semibold">Moderation Queue</h1>

      {posts.length === 0 ? (
        <p>No pending posts.</p>
      ) : (
        <ul className="space-y-2">
          {posts.map((p: any) => (
            <li key={p.id} className="border p-3 rounded bg-white/70">
              <div className="font-medium">{p.title}</div>
              <div className="text-xs opacity-70">
                {p.author_name ?? "Unknown"} · {new Date(p.created_at).toLocaleString()}
              </div>
              <div className="mt-2">
                <Link className="btn-mc" href={`/post/${p.id}`}>View</Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}