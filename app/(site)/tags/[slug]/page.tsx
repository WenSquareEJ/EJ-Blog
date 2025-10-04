import Link from "next/link";
import PostCard from "@/components/PostCard";
import supabaseServer from "@/lib/supabaseServer";
import { buildExcerpt, extractPostContent } from "@/lib/postContent";

type SearchParams = {
  page?: string;
};

type TagSummary = {
  id: string;
  name: string;
  slug: string;
};

type PostRow = {
  id: string;
  title: string | null;
  content: string | null;
  content_html: string | null;
  created_at: string | null;
  post_tags?: { tags: TagSummary | null }[] | null;
};

export default async function TagPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams?: SearchParams;
}) {
  const sb = supabaseServer();

  const { data: tag } = await sb
    .from("tags")
    .select("id, name, slug")
    .eq("slug", params.slug)
    .maybeSingle();
  if (!tag) return <p className="text-gray-600">Tag not found.</p>;

  const page = Math.max(parseInt(searchParams?.page ?? "1", 10) || 1, 1);
  const pageSize = 5;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data: postsData, count } = await sb
    .from("posts")
    .select(
      `
        id,
        title,
        content,
        content_html,
        created_at,
        post_tags:post_tags!inner(tags(id, name, slug))
      `,
      { count: "exact" }
    )
    .eq("status", "approved")
    .eq("post_tags.tag_id", tag.id)
    .order("published_at", { ascending: false })
    .range(from, to);

  const total = count ?? 0;
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);
  const posts = ((postsData ?? []) as PostRow[]).map((post) => {
    const tagList = (post.post_tags ?? [])
      .map((entry) => entry.tags)
      .filter((link): link is TagSummary => Boolean(link));

    const { text } = extractPostContent({
      content_html: post.content_html,
      content: post.content,
    });

    return {
      id: post.id,
      title: post.title ?? "Untitled",
      excerpt: buildExcerpt(text),
      tags: tagList,
    };
  });

  const prevPage = page > 1 ? page - 1 : null;
  const nextPage = page < totalPages ? page + 1 : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Posts tagged “{tag.name}”</h1>
        <p className="text-sm text-mc-stone">
          Page {page} of {totalPages}
        </p>
      </div>
      <div className="space-y-4">
        {posts.length === 0 ? (
          <p className="text-sm text-mc-stone">No posts yet for this tag.</p>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              id={post.id}
              title={post.title}
              excerpt={post.excerpt}
              tags={post.tags}
            />
          ))
        )}
      </div>
      <div className="flex gap-2">
        {prevPage && (
          <Link href={`/tags/${tag.slug}?page=${prevPage}`} className="btn-mc-secondary">
            Previous
          </Link>
        )}
        {nextPage && (
          <Link href={`/tags/${tag.slug}?page=${nextPage}`} className="btn-mc-secondary">
            Next
          </Link>
        )}
      </div>
    </div>
  );
}
