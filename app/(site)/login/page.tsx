'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'signin'|'signup'>('signin')
  const [msg, setMsg] = useState<string>('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMsg('')
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        setMsg('Signed in! You can go Home.')
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setMsg('Check your email to confirm (if email confirmations are on). Then a parent should set your role in profiles.')
      }
    } catch (err: any) {
      setMsg(err.message || 'Error')
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
    setMsg('Signed out.')
  }

  return (
    <div className="max-w-md mx-auto space-y-4">
      <h1 className="text-2xl font-semibold">Login</h1>
      <div className="flex gap-2 text-sm">
        <button className={`px-3 py-1 rounded ${mode==='signin'?'bg-brand text-white':'border'}`} onClick={()=>setMode('signin')}>Sign in</button>
        <button className={`px-3 py-1 rounded ${mode==='signup'?'bg-brand text-white':'border'}`} onClick={()=>setMode('signup')}>Sign up</button>
        <button className="ml-auto px-3 py-1 rounded border" onClick={signOut}>Sign out</button>
      </div>

      <form className="space-y-3" onSubmit={handleSubmit}>
        <input className="w-full border rounded-lg p-3" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="w-full border rounded-lg p-3" placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        <button className="px-4 py-2 rounded-lg bg-brand text-white">{mode==='signin'?'Sign in':'Create account'}</button>
      </form>

      {msg && <p className="text-sm text-gray-600">{msg}</p>}

      <p className="text-sm"><Link className="underline" href="/">Go Home</Link></p>
    </div>
  )
}
