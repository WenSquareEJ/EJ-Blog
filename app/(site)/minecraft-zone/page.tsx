// /app/(site)/minecraft-zone/page.tsx
import Image from "next/image";
import Link from "next/link";
import supabaseServer from "@/lib/supabaseServer";
import { buildExcerpt, extractPostContent } from "@/lib/postContent";
import type { TablesRow } from "@/lib/database.types";

const PAGE_SIZE = 3;
const TAG_SLUG = "minecraft" as const;

type SearchParams = {
  page?: string;
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
  images?: { path: string | null; alt_text: string | null }[] | null;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
let warnedMissingSupabaseUrl = false;

function buildPublicStorageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  const trimmed = path.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  if (!SUPABASE_URL) {
    if (!warnedMissingSupabaseUrl) {
      console.warn(
        "[minecraft-zone] Missing NEXT_PUBLIC_SUPABASE_URL, cannot resolve storage path"
      );
      warnedMissingSupabaseUrl = true;
    }
    return null;
  }
  const base = SUPABASE_URL.replace(/\/?$/, "");
  const normalizedPath = trimmed.replace(/^\/+/, "");
  return `${base}/storage/v1/object/public/${normalizedPath}`;
}

function pickFirstImage(images: PostRow["images"]): { url: string | null; alt: string | null } | null {
  if (!images) return null;
  for (const image of images) {
    if (!image) continue;
    const resolved = buildPublicStorageUrl(image.path);
    if (resolved) {
      return { url: resolved, alt: image.alt_text };
    }
  }
  return null;
}

function parsePageParam(raw?: string): number {
  const parsed = Number.parseInt(raw ?? "1", 10);
  if (Number.isNaN(parsed) || parsed < 1) {
    return 1;
  }
  return parsed;
}

function buildPageHref(targetPage: number): string {
  const params = new URLSearchParams();
  if (targetPage > 1) {
    params.set("page", String(targetPage));
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
        images:images(path, alt_text),
        post_tags:post_tags!inner(tags(slug))
      `,
      { count: "exact" }
    )
    .eq("status", "approved")
    .eq("post_tags.tags.slug", TAG_SLUG)
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (postsError) {
    console.error("[minecraft-zone] failed to load posts", {
      error: postsError,
      page,
    });
  }

  const typedRows = (postsData ?? []) as PostRow[];

  if (!postsError) {
    console.log("[minecraft-zone] loaded posts", {
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
    const directImage = post.image_url?.trim() ?? "";
    const relationImage = pickFirstImage(post.images ?? null);
    const featuredImage = directImage || relationImage?.url || null;
    const hasFeaturedImage = Boolean(featuredImage);
    const featuredImageAlt =
      (relationImage?.alt ?? "").trim() ||
      (post.title ? `${post.title} image` : "Minecraft Zone post image");
    return {
      id: post.id,
      title: post.title ?? "Untitled",
      excerpt: buildExcerpt(text, 120),
      featuredImage,
      hasFeaturedImage,
      featuredImageAlt,
    } satisfies {
      id: string;
      title: string;
      excerpt: string;
      featuredImage: string | null;
      hasFeaturedImage: boolean;
      featuredImageAlt: string;
    };
  });

  const total = count ?? 0;
  const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);
  const prevPage = page > 1 ? page - 1 : null;
  const nextPage = page < totalPages ? page + 1 : null;

  return (
    <div className="space-y-6">
      <h1 className="font-mc text-2xl">⛏️ Minecraft Zone</h1>
      <p className="opacity-80">
        Erik’s space for Minecraft builds, stories, and fun.
      </p>

      <div className="space-y-4">
        {posts.length ? (
          posts.map((post) => (
            <div
              key={post.id}
              className="card-block space-y-3 transition hover:shadow-lg"
            >
              <div className="relative overflow-hidden rounded-md border border-mc-wood-dark bg-white/70">
                {post.hasFeaturedImage && post.featuredImage ? (
                  <div className="relative w-full" style={{ aspectRatio: "16 / 9" }}>
                    <Image
                      src={post.featuredImage}
                      alt={post.featuredImageAlt}
                      fill
                      className="h-full w-full object-cover"
                      sizes="(min-width: 768px) 33vw, 100vw"
                      loading="lazy"
                    />
                    <span className="absolute left-2 top-2 rounded-full bg-white/80 px-2 py-[1px] text-xs">
                      📷
                    </span>
                  </div>
                ) : (
                  <div
                    className="relative flex w-full items-center justify-center text-xs uppercase tracking-[0.18em] text-mc-stone"
                    style={{
                      aspectRatio: "16 / 9",
                      backgroundImage: "url('/assets/ej-minecraft-bg.jpg')",
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                    aria-hidden="true"
                  >
                    <span className="rounded-md bg-white/80 px-3 py-1 shadow-sm">
                      No image yet
                    </span>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <h2 className="font-mc text-lg">{post.title}</h2>
                <p className="text-sm opacity-90">{post.excerpt}</p>
              </div>
              <Link
                href={`/post/${post.id}`}
                className="text-xs text-blue-600 underline"
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
          <Link href={buildPageHref(prevPage)} className="btn-mc-secondary">
            ← Newer
          </Link>
        ) : (
          <span />
        )}
        {nextPage && (
          <Link href={buildPageHref(nextPage)} className="btn-mc">
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
