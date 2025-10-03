// /components/AIHelper.tsx
"use client"

import { useState } from "react"

export default function AIHelper() {
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
    <div className="card-block w-72 fixed right-2 bottom-2 bg-mc-sky/90">
      <h2 className="font-mc text-sm mb-2">AI Helper</h2>
      <div className="h-40 overflow-y-auto bg-white/70 p-2 mb-2 text-xs">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
            <p><strong>{m.role === "user" ? "You" : "AI"}:</strong> {m.text}</p>
          </div>
        ))}
      </div>
      <form onSubmit={askAI} className="flex gap-1">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 border rounded p-1 text-xs"
          placeholder="Ask me..."
        />
        <button type="submit" className="btn-mc">Go</button>
      </form>
    </div>
  )
}
