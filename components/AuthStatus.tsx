'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type Profile = { id: string; role: 'child'|'parent'|'guest'|null }

export default function AuthStatus() {
  const [profile, setProfile] = useState<Profile|null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function load() {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { if (mounted) { setProfile(null); setLoading(false) } ; return }
      // fetch own profile (RLS policy allows self read)
      const { data } = await supabase.from('profiles').select('id, role').eq('id', session.user.id).maybeSingle()
      if (mounted) {
        setProfile(data ? { id: data.id, role: (data as any).role } : { id: session.user.id, role: null })
        setLoading(false)
      }
    }

    load()
    const { data: sub } = supabase.auth.onAuthStateChange((_e) => load())
    return () => { mounted = false; sub?.subscription?.unsubscribe() }
  }, [])

  if (loading) return <div className="text-sm text-gray-500">…</div>

  return (
    <div className="flex items-center gap-3 text-sm">
      {/* Links that depend on role */}
      {profile?.role === 'child' && <Link className="underline" href="/post/new">New Post</Link>}
      {profile?.role === 'parent' && <Link className="underline" href="/moderation">Moderation</Link>}

      {/* Auth buttons */}
      {profile
        ? <button className="border rounded px-2 py-1" onClick={() => supabase.auth.signOut()}>Logout</button>
        : <Link className="border rounded px-2 py-1" href="/login">Login</Link>}
    </div>
  )
}
