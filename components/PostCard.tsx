// /components/PostCard.tsx
import Link from "next/link";

type PostCardProps = {
  id: string;
  title: string;
  excerpt: string;
};

export default function PostCard({ id, title, excerpt }: PostCardProps) {
  const summary = excerpt.trim() || "No description yet.";
  return (
    <div className="card-block">
      <h2 className="font-mc text-base mb-2">{title}</h2>
      <p className="text-sm text-mc-stone">{summary}</p>
      <Link href={`/post/${id}`} className="btn-mc">
        Read More
      </Link>
    </div>
  );
}
