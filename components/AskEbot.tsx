// /components/AskEbot.tsx
"use client"

import { useState } from "react"

export default function AskEbot() {
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([])
  const [open, setOpen] = useState(false) // start collapsed

  async function askAI(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim()) return
    const q = input
    setMessages((prev) => [...prev, { role: "user", text: q }])
    setInput("")

    const res = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: q }),
    })
    const data = await res.json()
    setMessages((prev) => [...prev, { role: "assistant", text: data.answer }])
  }

  // Collapsed bubble (minimal footprint)
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        aria-label="Open Ask Ebot"
        className="fixed bottom-2 right-2 z-[9999] btn-mc rounded-full px-4 py-2 text-sm font-mc flex items-center gap-2"
        style={{
          right: "max(0.5rem, env(safe-area-inset-right))",
          bottom: "max(0.5rem, env(safe-area-inset-bottom))",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src="/ebot.png" 
          alt="Ebot" 
          width={32} 
          height={32}
          className="block rounded"
          style={{ 
            imageRendering: 'pixelated',
            mixBlendMode: 'multiply'
          }}
        />
        Ask Ebot
      </button>
    )
  }

  // Expanded panel (keeps your existing Minecraft styles)
  return (
    <div
      aria-label="Ask Ebot chat widget"
      className="card-block fixed bottom-2 right-2 w-72 bg-mc-sky/90 z-[9999]"
      style={{
        right: "max(0.5rem, env(safe-area-inset-right))",
        bottom: "max(0.5rem, env(safe-area-inset-bottom))",
      }}
    >
      {/* Header with minimize */}
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-mc text-sm">Ask Ebot</h2>
        <button
          onClick={() => setOpen(false)}
          aria-label="Minimize Ask Ebot"
          className="text-xs rounded-md px-2 py-1 bg-mc-wood/10 hover:bg-mc-wood/20"
          title="Minimize"
        >
          ─
        </button>
      </div>

      <div className="mb-2 h-40 overflow-y-auto bg-white/70 p-2 text-xs">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
            <p>
              <strong>{m.role === "user" ? "You" : "Ebot"}:</strong> {m.text}
            </p>
          </div>
        ))}
      </div>

      <form aria-label="Ask Ebot input" className="flex gap-1" onSubmit={askAI}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          aria-label="Message for Ebot"
          className="flex-1 rounded border p-1 text-xs"
          placeholder="Ask Ebot..."
        />
        <button className="btn-mc" type="submit">
          Go
        </button>
      </form>
    </div>
  )
}