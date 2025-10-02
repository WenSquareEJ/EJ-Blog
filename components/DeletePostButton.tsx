'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DeletePostButton({ postId }: { postId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const onDelete = async () => {
    if (!confirm('Are you sure you want to delete this post?')) return
    setLoading(true)
    try {
      const res = await fetch(`/api/posts/${postId}/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!res.ok) {
        const text = await res.text()
        alert(`Delete failed: ${text || res.statusText}`)
        return
      }
      // Go home after successful delete
      router.push('/')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={onDelete}
      disabled={loading}
      className="btn bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
      title="Delete this post"
    >
      {loading ? 'Deleting…' : 'Delete'}
    </button>
  )
}
