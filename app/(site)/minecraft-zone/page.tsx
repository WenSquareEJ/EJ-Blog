// /app/(site)/minecraft-zone/page.tsx
import Link from "next/link";
import supabaseServer from "@/lib/supabaseServer";

// helper for pagination
const PAGE_SIZE = 3;

export default async function MinecraftZonePage({
  searchParams,
}: {
  searchParams?: { page?: string };
}) {
  const sb = supabaseServer();

  // current page (default 1)
  const page = Number(searchParams?.page ?? 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  // query posts with "minecraft" tag
  const { data: posts, error } = await sb
    .from("posts")
    .select("id, title, slug, excerpt, created_at")
    .contains("tags", ["minecraft"])
    .order("created_at", { ascending: false })
    .range(from, to);

  // get total count for pagination
  const { count } = await sb
    .from("posts")
    .select("*", { count: "exact", head: true })
    .contains("tags", ["minecraft"]);

  const totalPages = count ? Math.ceil(count / PAGE_SIZE) : 1;

  return (
    <div className="space-y-6">
      <h1 className="font-mc text-2xl">Minecraft Zone</h1>
      <p className="opacity-80">
        A showcase of Erik’s Minecraft builds, experiments, and fun projects.
      </p>

      {/* Blog posts */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {error && (
          <p className="text-red-600 text-sm">
            Error loading posts: {error.message}
          </p>
        )}

        {posts && posts.length > 0 ? (
          posts.map((post) => (
            <div key={post.id} className="card-block">
              <h2 className="font-mc text-lg">{post.title}</h2>
              <p className="text-sm opacity-80">{post.excerpt}</p>
              <Link href={`/post/${post.slug}`} className="btn-mc mt-2 inline-block">
                Read More
              </Link>
            </div>
          ))
        ) : (
          <p className="text-sm opacity-70">No Minecraft posts yet — coming soon!</p>
        )}
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        {page > 1 ? (
          <Link
            href={`/minecraft-zone?page=${page - 1}`}
            className="btn-mc"
          >
            ← Previous
          </Link>
        ) : <span />}

        {page < totalPages ? (
          <Link
            href={`/minecraft-zone?page=${page + 1}`}
            className="btn-mc"
          >
            Next →
          </Link>
        ) : <span />}
      </div>

      {/* Mini-game section */}
      <div className="card-block mt-6">
        <h2 className="font-mc text-lg mb-2">Mini-Games</h2>
        <p className="text-sm mb-2">Play Minecraft-style games directly here!</p>
        <Link href="/minecraft-zone/snake" className="btn-mc">
          Minecraft Snake
        </Link>
      </div>
    </div>
  );
}