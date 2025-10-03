// /app/(site)/tags/page.tsx
import { createServerClient } from "@/lib/supabaseServer"
import Link from "next/link"

export default async function TagsPage() {
  const sb = supabaseServer()
  const { data: tags } = await sb.from("tags").select("id, name")

  return (
    <div>
      <h1 className="font-mc text-lg mb-4">Tags</h1>
      <ul className="flex flex-wrap gap-2">
        {tags?.map((tag) => (
          <li key={tag.id}>
            <Link href={`/tags/${tag.id}`} className="btn-mc-secondary">{tag.name}</Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
