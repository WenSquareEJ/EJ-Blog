// /app/(site)/login/page.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import supabaseBrowser from "@/lib/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) setMsg(error.message)
    else setMsg('Logged in! You can go back to Home.')
  }

  async function handleLogout() {
    setMsg(null)
    setLoading(true)
    const { error } = await supabase.auth.signOut()
    setLoading(false)
    if (error) setMsg(error.message)
    else setMsg('Logged out.')
  }

  return (
    <div className="max-w-md mx-auto card-block p-5">
      <h1 className="font-mc text-lg mb-4">Log in</h1>

      <form onSubmit={handleLogin} className="space-y-3">
        <div className="space-y-1">
          <label className="block text-sm">Email</label>
          <input
            className="w-full border rounded-block px-3 py-2"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm">Password</label>
          <input
            className="w-full border rounded-block px-3 py-2"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            placeholder="••••••••"
          />
        </div>

        <button className="btn-mc w-full" type="submit" disabled={loading}>
          {loading ? 'Working…' : 'Log in'}
        </button>
      </form>

      <div className="mt-3 flex items-center justify-between">
        <button className="btn-mc-secondary" onClick={handleLogout} disabled={loading}>
          Log out
        </button>
        <Link className="underline text-sm" href="/">Back to Home</Link>
      </div>

      {msg && <p className="mt-3 text-sm">{msg}</p>}
    </div>
  )
}
