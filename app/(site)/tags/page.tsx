// /app/(site)/tags/page.tsx
import supabaseServer from "@/lib/supabaseServer";
import Link from "next/link";

export default async function TagsPage() {
  const sb = supabaseServer()
  const { data: tagsData } = await sb
    .from("tags")
    .select("id, name, slug, post_tags(count)")
    .order("name", { ascending: true });

  const tags = (tagsData ?? []).map((tag) => {
    const count = Array.isArray(tag.post_tags) && tag.post_tags.length
      ? (tag.post_tags[0]?.count as number | null) ?? 0
      : 0;
    return {
      id: tag.id as string,
      name: tag.name as string,
      slug: tag.slug as string,
      count,
    };
  });

  return (
    <div>
      <h1 className="font-mc section-title text-lg mb-4">Tags</h1>
      <ul className="flex flex-wrap gap-2">
        {tags?.map((tag) => (
          <li key={tag.id}>
            <Link href={`/tags/${tag.slug}`} className="btn-mc-secondary section-label">
              {tag.name}
              <span className="ml-1 rounded-full bg-mc-wood-dark px-2 py-[2px] text-[0.65rem] section-label">
                {tag.count}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
