'use client'
import { useState } from 'react'
export default function BannerPlaceholder() {
  const [open, setOpen] = useState(true)
  if (!open) return null
  return (
    <div className="bg-mc-grass text-white px-4 py-3 rounded-block mb-4 shadow-block">
      <div className="flex items-center justify-between">
        <p className="text-sm sm:text-base">🟩 Minecraft skin active! We’ll design a custom banner here.</p>
        <button className="ml-4 underline" onClick={() => setOpen(false)}>Dismiss</button>
      </div>
    </div>
  )
}
