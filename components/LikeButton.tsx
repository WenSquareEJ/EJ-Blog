"use client"
import { useState, useEffect } from "react"

export default function LikeButton({ postId }: { postId: string }) {
  const [msg, setMsg] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [count, setCount] = useState<number>(0)
  // Fetch like count on mount
  useEffect(() => {
    let ignore = false;
    async function fetchCount() {
      try {
        const res = await fetch(`/api/likes?postId=${encodeURIComponent(postId)}`)
        if (!res.ok) throw new Error("Failed to fetch count")
        const data = await res.json()
        if (!ignore && typeof data.count === "number") setCount(data.count)
      } catch {
        if (!ignore) setCount(0)
      }
    }
    if (postId) fetchCount()
    return () => { ignore = true }
  }, [postId])

  async function handleLike() {
    setMsg(null)
    if (!postId) return
    setPending(true)
    setCount((c) => c + 1) // Optimistically increment
    try {
      const res = await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      })
      const data = await res.json()
      if (res.ok) {
        setMsg("Liked!")
        // Optionally update count from server if returned
        if (typeof data.count === "number") setCount(data.count)
        console.log(data)
      } else {
        setMsg(data?.error || "Error")
        setCount((c) => Math.max(0, c - 1)) // Rollback
        console.error(data)
      }
    } catch (e) {
      setMsg("Network error")
      setCount((c) => Math.max(0, c - 1)) // Rollback
      console.error(e)
    } finally {
      setPending(false)
    }
  }

  return (
    <div>
      <button
        className="btn-mc mt-3 flex items-center gap-1"
        type="button"
        onClick={handleLike}
        disabled={pending}
      >
        <img
          src="/icons/diamond.png"
          alt="Like"
          width={16}
          height={16}
          style={{ display: 'inline-block', verticalAlign: 'middle' }}
          onError={e => {
            e.currentTarget.style.display = 'none';
            const sib = e.currentTarget.nextSibling;
            if (sib && sib instanceof HTMLElement) {
              sib.style.display = 'inline';
            }
          }}
        />
        <span style={{ display: 'none' }} role="img" aria-label="brick">🧱</span>
        Like ({count})
      </button>
      {msg && <span className="ml-2 text-xs text-mc-stone">{msg}</span>}
    </div>
  )
}
