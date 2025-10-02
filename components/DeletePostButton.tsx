'use client'
import { useTransition } from 'react'

export default function DeletePostButton({ postId, onDone }: { postId: string; onDone?: () => void }) {
  const [pending, start] = useTransition()

  async function handleDelete() {
    if (!confirm('Delete this post? This will remove its images and comments.')) return
    start(async () => {
      const res = await fetch(`/api/posts/${postId}/delete`, { method: 'DELETE' })
      if (res.ok) {
        onDone ? onDone() : (window.location.href = '/')
      } else {
        const text = await res.text().catch(()=> 'Failed to delete')
        alert(text)
      }
    })
  }

  return (
    <button
      onClick={handleDelete}
      disabled={pending}
      className="btn-block secondary"
      title="Delete post"
    >
      {pending ? 'Deleting…' : 'Delete'}
    </button>
  )
}
