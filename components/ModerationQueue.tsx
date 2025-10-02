'use client'
import { useEffect, useState } from 'react'

export default function ModerationQueue() {
  const [pendingPosts, setPendingPosts] = useState<any[]>([])
  const [pendingComments, setPendingComments] = useState<any[]>([])
  useEffect(()=>{ (async()=>{
    const p = await fetch('/api/posts?status=pending').then(r=>r.json())
    const c = await fetch('/api/comments?status=pending').then(r=>r.json())
    setPendingPosts(p.items||[])
    setPendingComments(c.items||[])
  })() },[])

  async function actPost(id: string, action: 'approve'|'reject') {
    await fetch(`/api/posts/${id}/${action}`, { method: 'POST' })
    setPendingPosts(ps => ps.filter(x=>x.id!==id))
  }

  return (
    <div className="space-y-8">
      <section>
        <h3 className="text-lg font-semibold">Posts awaiting approval</h3>
        <ul className="mt-3 space-y-3">
          {pendingPosts.map(p=> (
            <li key={p.id} className="card-block p-4">
              <h4 className="font-medium">{p.title}</h4>
              <p className="text-sm text-mc-stone whitespace-pre-wrap">{p.content}</p>
              <div className="mt-2 flex gap-2">
                <button onClick={()=>actPost(p.id,'approve')} className="btn-block">Approve</button>
                <button onClick={()=>actPost(p.id,'reject')} className="btn-block secondary">Reject</button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="text-lg font-semibold">Comments awaiting approval</h3>
        <ul className="mt-3 space-y-3">
          {pendingComments.map(c=> (
            <li key={c.id} className="card-block p-4">
              <p className="text-sm text-mc-stone">{c.display_name || 'Guest'}</p>
              <p className="whitespace-pre-wrap">{c.content}</p>
              {/* TODO: approve/reject comment API routes */}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
