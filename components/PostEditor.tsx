'use client'
import { useState } from 'react'
import ImageUploader from './ImageUploader'
import { shouldHold } from '@/lib/moderation'

export default function PostEditor() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [tagDraft, setTagDraft] = useState('')
  const [msg, setMsg] = useState<string|null>(null)
  const [submitting, setSubmitting] = useState(false)

  function addTag() {
    const t = tagDraft.trim()
    if (!t) return
    if (!tags.includes(t)) setTags([...tags, t])
    setTagDraft('')
  }
  function removeTag(t: string) {
    setTags(tags.filter(x => x !== t))
  }

  async function submit(status: 'draft' | 'pending') {
    setSubmitting(true)
    const hold = shouldHold(`${title}\n${content}`)
    const res = await fetch('/api/posts', {
      method: 'POST',
      body: JSON.stringify({ title, content, images, status: hold ? 'pending' : status, tags })
    })
    setSubmitting(false)
    if (res.ok) setMsg(status==='pending' ? 'Sent to parents for approval.' : 'Saved as draft.')
    else setMsg('Error saving post')
  }

  return (
    <div className="space-y-4">
      <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Post title" className="w-full border rounded-block p-3" />
      <textarea value={content} onChange={e=>setContent(e.target.value)} placeholder="Write your story…" className="w-full border rounded-block p-3 min-h-[160px]" />

      {/* TAGS UI */}
      <div>
        <label className="block text-sm font-medium mb-1">Tags</label>
        <div className="flex gap-2">
          <input
            value={tagDraft}
            onChange={e=>setTagDraft(e.target.value)}
            placeholder="e.g. LEGO"
            className="flex-1 border rounded-block p-2"
            onKeyDown={(e)=>{ if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
          />
          <button type="button" onClick={addTag} className="px-3 py-2 rounded-block border">Add</button>
        </div>
        {tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {tags.map(t => (
              <span key={t} className="inline-flex items-center text-sm bg-mc-sand/40 text-mc-dirt rounded-full px-3 py-1">
                {t}
                <button type="button" className="ml-2 text-mc-stone" onClick={()=>removeTag(t)}>×</button>
              </span>
            ))}
          </div>
        )}
      </div>

      <ImageUploader onUploaded={paths => setImages([...images, ...paths])} />
      <div className="flex gap-2">
        <button disabled={submitting} onClick={()=>submit('draft')} className="btn-block secondary">Save draft</button>
        <button disabled={submitting} onClick={()=>submit('pending')} className="btn-block">Ask a grown-up to publish</button>
      </div>
      {msg && <p className="text-sm text-mc-stone">{msg}</p>}
    </div>
  )
}
