import Link from "next/link";
import supabaseServer from "@/lib/supabaseServer";

type TagRow = {
  id: string;
  name: string | null;
  slug: string | null;
  post_tags: { count: number | null }[] | null;
};

const MAX_TAGS = 12;

export default async function TagsWidget() {
  const sb = supabaseServer();
  const { data, error } = await sb
    .from("tags")
    .select("id, name, slug, post_tags(count)")
    .order("name", { ascending: true })
    .limit(50);

  if (error) {
    console.error("[blog/tags] failed to load tags", error);
  }

  const tags = ((data ?? []) as TagRow[])
    .map((tag) => {
      const count = Array.isArray(tag.post_tags) && tag.post_tags.length > 0
        ? tag.post_tags[0]?.count ?? 0
        : 0;
      return {
        id: tag.id,
        name: tag.name ?? "(untitled)",
        slug: tag.slug ?? "",
        count: count ?? 0,
      };
    })
    .filter((tag) => tag.slug)
    .slice(0, MAX_TAGS);

  return (
    <section className="card-block space-y-4">
      <div>
        <h2 className="font-mc text-lg">Browse Tags</h2>
        <p className="text-xs text-mc-stone">Jump into popular topics.</p>
      </div>
      {tags.length === 0 ? (
        <p className="text-xs text-mc-stone">No tags to show yet.</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <li key={tag.id}>
              <Link href={`/tags/${tag.slug}`} className="btn-mc-secondary">
                {tag.name}
                <span className="ml-2 rounded-full bg-mc-wood-dark px-2 py-[2px] text-[0.62rem] text-mc-parchment">
                  {tag.count}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
