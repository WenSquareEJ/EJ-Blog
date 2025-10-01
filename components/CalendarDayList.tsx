import PostCard from './PostCard'
export default function CalendarDayList({ posts }: { posts: any[] }) {
  if (!posts?.length) return <p className="text-gray-600">No posts on this day.</p>
  return <div className="space-y-4">{posts.map(p => <PostCard key={p.id} post={p} />)}</div>
}
