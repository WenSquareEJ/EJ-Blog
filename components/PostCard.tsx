import Link from 'next/link'
export default function PostCard({ post }: { post: any }) {
  return (
    <article className="border rounded-xl p-4 bg-white">
      <h3 className="text-xl font-semibold"><Link href={`/post/${post.id}`}>{post.title}</Link></h3>
      <p className="text-sm text-gray-500">{new Date(post.published_at||post.created_at).toLocaleString()}</p>

      {post.tags?.length ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {post.tags.map((t: any) => (
            <Link key={t.slug} href={`/tags/${t.slug}`} className="text-xs bg-gray-100 px-2 py-1 rounded-full hover:bg-gray-200">
              #{t.name}
            </Link>
          ))}
        </div>
      ) : null}

      <p className="mt-2 line-clamp-3 whitespace-pre-wrap">{post.content}</p>
    </article>
  )
}
