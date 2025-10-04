// /components/PostCard.tsx
import Link from "next/link";

type TagSummary = {
  id: string;
  name: string;
  slug: string;
};

type PostCardProps = {
  id: string;
  title: string;
  excerpt: string;
  tags?: TagSummary[];
};

export default function PostCard({ id, title, excerpt, tags }: PostCardProps) {
  const summary = excerpt.trim() || "No description yet.";
  return (
    <div className="card-block">
      <h2 className="font-mc text-base mb-2">{title}</h2>
      <p className="text-sm text-mc-stone">{summary}</p>
      {tags && tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2 text-[0.65rem] uppercase tracking-[0.12em]">
          {tags.map((tag) => (
            <Link
              key={tag.id}
              href={`/tags/${tag.slug}`}
              className="rounded-full border border-mc-wood-dark bg-mc-sand px-2 py-1 text-mc-dirt"
            >
              #{tag.name}
            </Link>
          ))}
        </div>
      )}
      <Link href={`/post/${id}`} className="btn-mc">
        Read More
      </Link>
    </div>
  );
}
