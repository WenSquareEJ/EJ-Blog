'use client'
import { useState } from 'react'
import { shouldHold } from '@/lib/moderation'

export default function CommentForm({ postId }: { postId: string }) {
  const [content, setContent] = useState('')
  const [msg, setMsg] = useState<string|null>(null)
  return (
    <form className="mt-4" onSubmit={async e=>{
      e.preventDefault()
      const hold = shouldHold(content)
      const res = await fetch('/api/comments', { method: 'POST', body: JSON.stringify({ postId, content, status: hold?'pending':'pending' }) })
      setMsg(res.ok? 'Comment sent to parents for review.' : 'Error')
      if (res.ok) setContent('')
    }}>
      <textarea value={content} onChange={e=>setContent(e.target.value)} placeholder="Say something nice…" className="w-full border rounded-lg p-3 min-h-[100px]" />
  <button className="mt-2 px-4 py-2 bg-brand text-mc-ink rounded-lg">Send</button>
      {msg && <p className="text-sm text-gray-600 mt-2">{msg}</p>}
    </form>
  )
}
