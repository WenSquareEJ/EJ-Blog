import Link from "next/link";
import { createClient } from "@/lib/supabaseServer";

// fetch posts from Supabase
async function getPosts() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("posts")
    .select("id, title, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error loading posts:", error.message);
    return [];
  }

  return data || [];
}

export default async function HomePage() {
  const posts = await getPosts();

  return (
    <main className="max-w-2xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">EJ Blog</h1>

      {posts.length === 0 && (
        <p className="text-gray-500">No posts yet. Try adding one!</p>
      )}

      <ul className="space-y-4">
        {posts.map((post) => (
          <li
            key={post.id}
            className="border rounded-lg p-4 hover:bg-gray-50 transition"
          >
            <Link
              href={`/post/${post.id}`} // ✅ absolute path
              className="no-underline hover:underline"
              prefetch={false}
            >
              <h2 className="text-xl font-semibold">{post.title}</h2>
            </Link>
            <p className="text-sm text-gray-500">
              {new Date(post.created_at).toLocaleString()}
            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}
