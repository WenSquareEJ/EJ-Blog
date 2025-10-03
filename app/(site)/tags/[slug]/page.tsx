import PostCard from "@/components/PostCard";
import supabaseServer from "@/lib/supabaseServer";
import { buildExcerpt, extractPostContent } from "@/lib/postContent";

export default async function TagPage({ params }: { params: { slug: string } }) {
  const sb = supabaseServer()

  // find tag id
  const { data: tag } = await sb.from('tags').select('id, name, slug').eq('slug', params.slug).maybeSingle()
  if (!tag) return <p className="text-gray-600">Tag not found.</p>

  // get posts for that tag
  const { data: postTagRows } = await sb
    .from('post_tags')
    .select('post_id')
    .eq('tag_id', tag.id)
  const ids = (postTagRows ?? []).map((row) => row.post_id as string)
  type TagPost = {
    id: string;
    title: string;
    content: string | null;
    content_html: string | null;
    created_at: string;
  };
  let posts: TagPost[] = []
  if (ids.length) {
    const { data } = await sb
      .from('posts')
      .select('id, title, content, content_html, created_at')
      .in('id', ids)
      .eq('status','approved')
      .order('published_at', { ascending: false })
    posts = (data || []) as TagPost[]
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Posts tagged “{tag.name}”</h1>
      <div className="space-y-4">
        {posts.map((post) => {
          const { text } = extractPostContent({
            content_html: post.content_html,
            content: post.content,
          });
          return (
            <PostCard
              key={post.id}
              id={post.id}
              title={post.title}
              excerpt={buildExcerpt(text)}
            />
          );
        })}
      </div>
    </div>
  )
}
