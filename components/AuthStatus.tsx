// /components/AuthStatus.tsx
'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabaseClient'

export default function AuthStatus() {
  const [user, setUser] = useState<null | { id: string; email?: string }>(null)
  const supabase = supabaseBrowser()

  useEffect(() => {
    let isMounted = true

    // Get current user once
    supabase.auth.getUser().then(({ data }) => {
      if (isMounted) setUser(data.user ?? null)
    })

    // Keep in sync with auth changes
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) setUser(session?.user ?? null)
    })

    return () => {
      isMounted = false
      sub.subscription.unsubscribe()
    }
  }, [supabase])

  if (!user) {
    return <Link className="btn-mc-secondary" href="/login">Log in</Link>
  }

  // If you have a /logout action route, this button will work.
  // Otherwise swap this for a client onClick that calls supabase.auth.signOut()
  return (
    <form action="/logout" method="post">
      <button className="btn-mc-secondary" type="submit">Log out</button>
    </form>
  )
}
