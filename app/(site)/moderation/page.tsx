// /app/(site)/moderation/page.tsx
import { createServerClient } from "@/lib/supabaseServer"

export default async function ModerationPage() {
  const sb = createServerClient()
  const { data: posts } = await sb.from("posts").select("*").eq("status", "pending")

  return (
    <div>
      <h1 className="font-mc text-lg mb-4">Moderation Dashboard</h1>
      {posts?.length ? (
        posts.map((p) => (
          <div key={p.id} className="card-block">
            <h2 className="font-mc">{p.title}</h2>
            <p>{p.content}</p>
            {/* moderation actions */}
            <form action={`/api/posts/${p.id}/approve`} method="post">
              <button className="btn-mc mr-2">Approve</button>
            </form>
            <form action={`/api/posts/${p.id}/delete`} method="post">
              <button className="btn-mc-secondary">Delete</button>
            </form>
          </div>
        ))
      ) : (
        <p>No pending posts.</p>
      )}
    </div>
  )
}
