'use client'
import { useState } from 'react'
export default function BannerPlaceholder() {
  const [open, setOpen] = useState(true)
  if (!open) return null
  return (
    <div className="bg-brand text-white px-4 py-3 rounded-xl mb-4">
      <div className="flex items-center justify-between">
        <p className="text-sm sm:text-base">🎉 Welcome! This is your banner area. We’ll design a custom graphic + message here.</p>
        <button className="ml-4 text-white/90 underline" onClick={() => setOpen(false)}>Dismiss</button>
      </div>
    </div>
  )
}
