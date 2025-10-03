// /components/PostCard.tsx
import Link from "next/link"

export default function PostCard({ post }: { post: any }) {
  return (
    <div className="card-block">
      <h2 className="font-mc text-base mb-2">{post.title}</h2>
      <p className="text-sm mb-2 line-clamp-3">{post.content}</p>
      <Link href={`/post/${post.id}`} className="btn-mc">Read More</Link>
    </div>
  )
}
