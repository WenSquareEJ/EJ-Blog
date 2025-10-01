import Link from 'next/link'
export default function PostCard({ post }: { post: any }) {
  return (
    <article className="border rounded-xl p-4 bg-white">
      <h3 className="text-xl font-semibold"><Link href={`/post/${post.id}`}>{post.title}</Link></h3>
      <p className="text-sm text-gray-500">{new Date(post.published_at||post.created_at).toLocaleString()}</p>
      <p className="mt-2 line-clamp-3 whitespace-pre-wrap">{post.content}</p>
    </article>
  )
}
