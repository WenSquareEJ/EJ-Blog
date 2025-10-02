// /app/(site)/post/[id]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";

type Params = { params: { id: string } };

export default async function PostPage({ params }: Params) {
  const sb = supabaseServer();
  const { data, error } = await sb
    .from("posts")
    .select("id,title,content,created_at,published_at")
    .eq("id", params.id)
    .single();

  if (error || !data) return notFound();

  const date = new Date(data.published_at || data.created_at).toLocaleString();

  return (
    <article className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="font-mc text-xl">{data.title}</h1>
        <span className="text-xs text-gray-500">{date}</span>
      </div>

      <div className="card-block">
        <div className="post-body whitespace-pre-wrap">{data.content}</div>
      </div>

      <div>
        <Link className="btn-mc" href="/">← Back</Link>
      </div>
    </article>
  );
}
