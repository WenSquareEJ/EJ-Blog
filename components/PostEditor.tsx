'use client'
import { useState } from 'react'
import ImageUploader from './ImageUploader'
import { shouldHold } from '@/lib/moderation'

export default function PostEditor() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState<string|null>(null)

  async function submit(status: 'draft' | 'pending') {
    setSubmitting(true)
    const hold = shouldHold(`${title}\n${content}`)
    const res = await fetch('/api/posts', { method: 'POST', body: JSON.stringify({ title, content, images, status: hold ? 'pending' : status }) })
    setSubmitting(false)
    if (res.ok) setMsg(status==='pending' ? 'Sent to parents for approval.' : 'Saved as draft.')
    else setMsg('Error saving post')
  }

  return (
    <div className="space-y-4">
      <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Post title" className="w-full border rounded-lg p-3" />
      <textarea value={content} onChange={e=>setContent(e.target.value)} placeholder="Write your story…" className="w-full border rounded-lg p-3 min-h-[160px]" />
      <ImageUploader onUploaded={paths => setImages([...images, ...paths])} />
      <div className="flex gap-2">
        <button onClick={()=>submit('draft')} className="px-4 py-2 rounded-lg border">Save draft</button>
        <button onClick={()=>submit('pending')} className="px-4 py-2 rounded-lg bg-brand text-white">Ask a grown‑up to publish</button>
      </div>
      {msg && <p className="text-sm text-gray-600">{msg}</p>}
    </div>
  )
}
