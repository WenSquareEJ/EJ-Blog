"use client"
import { useState } from "react"

export default function LikeButton({ postId }: { postId: string }) {
  const [msg, setMsg] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleLike() {
    setMsg(null)
    if (!postId) return
    setPending(true)
    try {
      const res = await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      })
      const data = await res.json()
      if (res.ok) {
        setMsg("Liked!")
        console.log(data)
      } else {
        setMsg(data?.error || "Error")
        console.error(data)
      }
    } catch (e) {
      setMsg("Network error")
      console.error(e)
    } finally {
      setPending(false)
    }
  }

  return (
    <div>
      <button
        className="btn-mc mt-3"
        type="button"
        onClick={handleLike}
        disabled={pending}
      >
        ❤️ Like
      </button>
      {msg && <span className="ml-2 text-xs text-mc-stone">{msg}</span>}
    </div>
  )
}
