import Link from 'next/link'

export default function PostCard({ post }: { post: any }) {
  return (
    <article className="card-block overflow-hidden">
      <div className="h-2 bg-mc-grass" />
      <div className="p-4">
        <h3 className="text-xl font-semibold">
          <Link href={`/post/${post.id}`}>{post.title}</Link>
        </h3>
        <p className="text-xs text-mc-stone mt-1">
          {new Date(post.published_at||post.created_at).toLocaleString()}
        </p>

        {post.tags?.length ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {post.tags.map((t:any) => (
              <span key={t.slug} className="text-xs bg-mc-sand/50 text-mc-dirt px-2 py-1 rounded-full">
                #{t.name}
              </span>
            ))}
          </div>
        ) : null}

        <p className="mt-3 line-clamp-3 whitespace-pre-wrap">{post.content}</p>
      </div>
    </article>
  )
}
