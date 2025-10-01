'use client'
export default function ReactionBar({ targetType, targetId }: { targetType: 'post'|'comment', targetId: string }) {
  async function send(kind: 'like'|'party'|'idea'|'heart') {
    await fetch('/api/reactions', { method: 'POST', body: JSON.stringify({ targetType, targetId, kind }) })
  }
  return (
    <div className="flex gap-3 text-xl">
      <button onClick={()=>send('like')}>👍</button>
      <button onClick={()=>send('party')}>🎉</button>
      <button onClick={()=>send('idea')}>💡</button>
      <button onClick={()=>send('heart')}>❤️</button>
    </div>
  )
}
