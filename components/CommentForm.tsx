'use client'
import { useState } from 'react'
import { shouldHold } from '@/lib/moderation'

export default function CommentForm({ postId }: { postId: string }) {
  const [content, setContent] = useState('')
  const [name, setName] = useState('')
  const [msg, setMsg] = useState<string|null>(null)
  return (
    <form className="mt-4 space-y-2" onSubmit={async e=>{
      e.preventDefault()
      if (!name.trim() || !content.trim()) {
        setMsg('Please provide your name and a comment.')
        return
      }
      const hold = shouldHold(content)
      const res = await fetch('/api/comments', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, content, commenter_name: name, status: hold?'pending':'pending' }) 
      })
      setMsg(res.ok? 'Comment sent to parents for review.' : 'Error')
      if (res.ok) {
        setContent('')
        setName('')
      }
    }}>
      <input 
        value={name} 
        onChange={e=>setName(e.target.value)} 
        placeholder="Your name…" 
        className="w-full border rounded-lg p-3" 
        maxLength={50}
        required
      />
      <textarea 
        value={content} 
        onChange={e=>setContent(e.target.value)} 
        placeholder="Say something nice…" 
        className="w-full border rounded-lg p-3 min-h-[100px]" 
        required
      />
      <button className="mt-2 px-4 py-2 bg-brand text-mc-ink rounded-lg">Send</button>
      {msg && <p className="text-sm text-gray-600 mt-2">{msg}</p>}
    </form>
  )
}
