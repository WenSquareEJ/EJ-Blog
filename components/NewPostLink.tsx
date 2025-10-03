'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabaseClient'

export default function NewPostLink() {
  const [hasUser, setHasUser] = useState<boolean>(false)

  useEffect(() => {
    const supabase = supabaseBrowser()

    // initial check
    supabase.auth.getSession().then(({ data }) => {
      setHasUser(Boolean(data.session?.user))
    })

    // listen for future changes
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      setHasUser(Boolean(session?.user))
    })

    return () => {
      sub.subscription.unsubscribe()
    }
  }, [])

  if (!hasUser) return null
  return <Link className="btn-mc" href="/post/new">New Post</Link>
}
