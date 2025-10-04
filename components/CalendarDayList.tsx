import PostCard from "./PostCard";
import { buildExcerpt, extractPostContent } from "@/lib/postContent";

type CalendarPost = {
  id: string;
  title: string;
  content: string | null;
  content_html: string | null;
  tags?: { id: string; name: string; slug: string }[];
};

export default function CalendarDayList({ posts }: { posts: CalendarPost[] | null }) {
  if (!posts?.length) {
    return <p className="text-gray-600">No posts on this day.</p>;
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => {
        const { text } = extractPostContent({
          content: post.content,
          content_html: post.content_html,
        });
        return (
          <PostCard
            key={post.id}
            id={post.id}
            title={post.title}
            excerpt={buildExcerpt(text)}
            tags={post.tags}
          />
        );
      })}
    </div>
  );
}
