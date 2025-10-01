export default function CommentList({ comments }: { comments: any[] }) {
  if (!comments?.length) return null
  return (
    <ul className="mt-4 space-y-3">
      {comments.map(c=> (
        <li key={c.id} className="border rounded-lg p-3 bg-gray-50">
          <p className="text-sm text-gray-600">{c.display_name || 'Guest'}</p>
          <p className="whitespace-pre-wrap">{c.content}</p>
        </li>
      ))}
    </ul>
  )
}
