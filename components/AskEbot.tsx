// /components/AskEbot.tsx
"use client"

import { useState } from "react"

export default function AskEbot() {
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([])

  async function askAI(e: React.FormEvent) {
    e.preventDefault()
    setMessages((prev) => [...prev, { role: "user", text: input }])
    setInput("")

    // Call your API route to get AI response
    const res = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: input }),
    })
    const data = await res.json()
    setMessages((prev) => [...prev, { role: "assistant", text: data.answer }])
  }

  return (
    <div
      aria-label="Ask Ebot chat widget"
      className="card-block fixed bottom-2 right-2 w-72 bg-mc-sky/90"
    >
      <h2 className="mb-2 font-mc text-sm">Ask Ebot</h2>
      <div className="mb-2 h-40 overflow-y-auto bg-white/70 p-2 text-xs">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
            <p><strong>{m.role === "user" ? "You" : "Ebot"}:</strong> {m.text}</p>
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
