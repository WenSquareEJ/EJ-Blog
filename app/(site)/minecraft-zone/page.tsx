// /app/(site)/minecraft-zone/page.tsx
import Link from "next/link";
import supabaseServer from "@/lib/supabaseServer";
import { buildExcerpt, extractPostContent } from "@/lib/postContent";

export default async function MinecraftZonePage() {
  const sb = supabaseServer();

  // Fetch only 3 recent Minecraft posts
  const { data: posts } = await sb
    .from("posts")
    .select("id, title, content, content_html, created_at")
    .eq("status", "approved")
    .contains("tags", ["minecraft"]) // posts tagged with 'minecraft'
    .order("published_at", { ascending: false })
    .limit(3);

  return (
    <div className="space-y-6">
      <h1 className="font-mc text-2xl">⛏️ Minecraft Zone</h1>
      <p className="opacity-80">
        Erik’s space for Minecraft builds, stories, and fun.
      </p>

      {/* Recent Posts */}
      <div className="space-y-4">
        {posts?.length ? (
          posts.map((post) => {
            const { text } = extractPostContent({
              content_html: post.content_html,
              content: post.content,
            });
            const excerpt = buildExcerpt(text, 120);
            return (
            <div
              key={post.id}
              className="card-block hover:shadow-lg transition"
            >
              <h2 className="font-mc text-lg">{post.title}</h2>
              <p className="text-sm opacity-90">{excerpt}</p>
              <Link
                href={`/post/${post.id}`}
                className="text-blue-600 underline text-xs"
              >
                Read more
              </Link>
            </div>
          );
          })
        ) : (
          <p>No Minecraft posts yet — stay tuned!</p>
        )}
      </div>

      {/* Pagination link to full blog */}
      <div className="text-right">
        <Link href="/tags/minecraft" className="btn-mc">
          View all Minecraft posts →
        </Link>
      </div>

      {/* Snake game section */}
      <div className="mt-8 text-center">
        <h2 className="font-mc text-xl mb-2">🎮 Play a Game!</h2>
        <Link href="/minecraft-zone/game" className="btn-mc">
          🐍 Play Snake
        </Link>
      </div>
    </div>
  );
}
