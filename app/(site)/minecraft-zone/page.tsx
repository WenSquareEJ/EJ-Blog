// /app/(site)/minecraft-zone/page.tsx
import Link from "next/link";
import supabaseServer from "@/lib/supabaseServer";
import { buildExcerpt, extractPostContent } from "@/lib/postContent";
import type { TablesRow } from "@/lib/database.types";
import { normalizeTagSlug, resolveTagSlugVariants } from "@/lib/tagHelpers";

const PAGE_SIZE = 3;
const DEFAULT_TAG_SLUG = "minecraft";

type SearchParams = {
  page?: string;
  tag?: string;
};

type PostRow = Pick<
  TablesRow<"posts">,
  | "id"
  | "title"
  | "content"
  | "content_html"
  | "image_url"
  | "published_at"
  | "created_at"
> & {
  post_tags?: { tags: { slug: string | null } | null }[] | null;
};

function parsePageParam(raw?: string): number {
  const parsed = Number.parseInt(raw ?? "1", 10);
  if (Number.isNaN(parsed) || parsed < 1) {
    return 1;
  }
  return parsed;
}

function buildPageHref(
  targetPage: number,
  options: { includeTagParam: boolean; tagSlug: string }
): string {
  const params = new URLSearchParams();
  if (targetPage > 1) {
    params.set("page", String(targetPage));
  }
  if (options.includeTagParam && options.tagSlug) {
    params.set("tag", options.tagSlug);
  }
  const query = params.toString();
  return query ? `/minecraft-zone?${query}` : "/minecraft-zone";
}

export default async function MinecraftZonePage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const sb = supabaseServer();

  const page = parsePageParam(searchParams?.page);
  const normalizedSlug = normalizeTagSlug(searchParams?.tag, {
    defaultSlug: DEFAULT_TAG_SLUG,
  });
  const slugVariants = resolveTagSlugVariants(normalizedSlug, {
    defaultSlug: DEFAULT_TAG_SLUG,
  });
  const slugFilter = slugVariants.length > 0 ? slugVariants : [DEFAULT_TAG_SLUG];
  const includeTagParam = Boolean(searchParams?.tag?.trim());

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data: postsData, error: postsError, count } = await sb
    .from("posts")
    .select(
      `
        id,
        title,
        content,
        content_html,
        image_url,
        published_at,
        created_at,
        post_tags:post_tags!inner(tags(slug))
      `,
      { count: "exact" }
    )
    .eq("status", "approved")
    .in("post_tags.tags.slug", slugFilter)
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (postsError) {
    console.error("[minecraft-zone] failed to load posts", {
      error: postsError,
      slug: normalizedSlug,
      variants: slugVariants,
      page,
    });
  }

  const typedRows = (postsData ?? []) as PostRow[];

  if (!postsError) {
    console.log("[minecraft-zone] loaded posts", {
      slug: normalizedSlug,
      variants: slugFilter,
      page,
      count,
      sample: typedRows.slice(0, 5).map((row) => row.id),
    });
  }

  const posts = typedRows.map((post) => {
    const { text } = extractPostContent({
      content_html: post.content_html,
      content: post.content,
    });
    return {
      id: post.id,
      title: post.title ?? "Untitled",
      excerpt: buildExcerpt(text, 120),
    } satisfies {
      id: string;
      title: string;
      excerpt: string;
    };
  });

  const total = count ?? 0;
  const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);
  const prevPage = page > 1 ? page - 1 : null;
  const nextPage = page < totalPages ? page + 1 : null;
  const tagHrefOptions = { includeTagParam, tagSlug: normalizedSlug };

  return (
    <div className="space-y-6">
      <h1 className="font-mc text-2xl">⛏️ Minecraft Zone</h1>
      <p className="opacity-80">
        Erik’s space for Minecraft builds, stories, and fun.
      </p>

      <div className="space-y-4">
        {posts.length ? (
          posts.map((post) => (
            <div key={post.id} className="card-block hover:shadow-lg transition">
              <h2 className="font-mc text-lg">{post.title}</h2>
              <p className="text-sm opacity-90">{post.excerpt}</p>
              <Link
                href={`/post/${post.id}`}
                className="text-blue-600 underline text-xs"
              >
                Read more
              </Link>
            </div>
          ))
        ) : (
          <div className="rounded-md border border-mc-stone/40 bg-white/60 p-4 text-sm text-mc-stone">
            <p className="mb-2">No Minecraft posts yet — stay tuned!</p>
            <Link href="/blog" className="text-blue-600 underline">
              Check out all posts
            </Link>
          </div>
        )}
      </div>

      <div className="flex justify-between gap-2">
        {prevPage ? (
          <Link href={buildPageHref(prevPage, tagHrefOptions)} className="btn-mc-secondary">
            ← Newer
          </Link>
        ) : (
          <span />
        )}
        {nextPage && (
          <Link href={buildPageHref(nextPage, tagHrefOptions)} className="btn-mc">
            Older →
          </Link>
        )}
      </div>

      <div className="text-right">
        <Link href="/tags/minecraft" className="btn-mc">
          View all Minecraft posts →
        </Link>
      </div>

      <div className="mt-8 text-center">
        <h2 className="font-mc text-xl mb-2">🎮 Play a Game!</h2>
        <Link href="/minecraft-zone/game" className="btn-mc">
          🐍 Play Snake
        </Link>
      </div>
    </div>
  );
}
