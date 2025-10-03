// /app/(site)/scratch-board/page.tsx
import Link from "next/link";
import supabaseServer from "@/lib/supabaseServer";

const PAGE_SIZE = 3;

export default async function ScratchBoardPage({
  searchParams,
}: {
  searchParams?: { page?: string };
}) {
  const sb = supabaseServer();
  const page = Number(searchParams?.page ?? 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  // fetch scratch-tagged posts
  const { data: posts, error } = await sb
    .from("posts")
    .select("id, title, slug, excerpt, scratch_id, created_at")
    .contains("tags", ["scratch"])
    .order("created_at", { ascending: false })
    .range(from, to);

  const { count } = await sb
    .from("posts")
    .select("*", { count: "exact", head: true })
    .contains("tags", ["scratch"]);

  const totalPages = count ? Math.ceil(count / PAGE_SIZE) : 1;

  return (
    <div className="space-y-6">
      <h1 className="font-mc text-2xl">Scratch Board</h1>
      <p className="opacity-80">
        A gallery of Erik’s Scratch projects and coding experiments.
      </p>

      {/* Post cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {error && <p className="text-red-600">Error: {error.message}</p>}

        {posts && posts.length > 0 ? (
          posts.map((post) => (
            <div key={post.id} className="card-block">
              <h2 className="font-mc text-lg">{post.title}</h2>
              <p className="text-sm opacity-80">{post.excerpt}</p>

              {/* If post has a scratch_id, embed it */}
              {post.scratch_id && (
                <iframe
                  src={`https://scratch.mit.edu/projects/${post.scratch_id}/embed`}
                  allowTransparency
                  width="100%"
                  height="300"
                  frameBorder="0"
                  scrolling="no"
                  allowFullScreen
                  className="mt-2 border"
                ></iframe>
              )}

              <Link href={`/post/${post.slug}`} className="btn-mc mt-2 inline-block">
                Read More
              </Link>
            </div>
          ))
        ) : (
          <p className="text-sm opacity-70">No Scratch projects yet — coming soon!</p>
        )}
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        {page > 1 ? (
          <Link href={`/scratch-board?page=${page - 1}`} className="btn-mc">
            ← Previous
          </Link>
        ) : <span />}

        {page < totalPages ? (
          <Link href={`/scratch-board?page=${page + 1}`} className="btn-mc">
            Next →
          </Link>
        ) : <span />}
      </div>
    </div>
  );
}