'use client'

import { useEffect, useState } from 'react'
import { supabaseClient } from '@/lib/supabaseClient'
import DeletePostButton from './DeletePostButton'

type Props = {
  postId: string
  postAuthorId: string
}

export default function PostDeleteGate({ postId, postAuthorId }: Props) {
  const sb = supabaseClient()
  const [ready, setReady] = useState(false)
  const [canDelete, setCanDelete] = useState(false)

  useEffect(() => {
    let isMounted = true
    ;(async () => {
      const {
        data: { user },
      } = await sb.auth.getUser()
      const userId = user?.id ?? null

      let role: string | null = null
      if (userId) {
        const { data: prof } = await sb
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .maybeSingle()
        role = prof?.role ?? null
      }

      if (!isMounted) return
      setCanDelete((!!userId && userId === postAuthorId) || role === 'parent')
      setReady(true)
    })()

    return () => {
      isMounted = false
    }
  }, [postAuthorId, sb])

  if (!ready || !canDelete) return null
  return <DeletePostButton postId={postId} />
}
