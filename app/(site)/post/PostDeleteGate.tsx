'use client'

import { useEffect, useState } from 'react'
import DeletePostButton from './DeletePostButton'
import { createClient } from '@supabase/supabase-js'

type Props = { postId: string; authorId: string }

export default function PostDeleteGate({ postId, authorId }: Props) {
  const [canDelete, setCanDelete] = useState(false)
  const [debugInfo, setDebugInfo] = useState<{
    viewerId: string | null
    viewerRole: 'parent' | 'child' | null
    postAuthor: string | null
    canDelete: boolean
  } | null>(null)

  // Create a browser Supabase client (uses your public envs)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    let cancelled = false

    async function run() {
      // who is logged in?
      const { data: ures } = await supabase.auth.getUser()
      const viewerId = ures?.user?.id ?? null

      // look up their role (RLS allows reading own profile’s role)
      let viewerRole: 'parent' | 'child' | null = null
      if (viewerId) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', viewerId)
          .maybeSingle()
        viewerRole = (prof?.role as 'parent' | 'child' | undefined) ?? null
      }

      const isParent = viewerRole === 'parent'
      const isAuthor = Boolean(viewerId && authorId && viewerId === authorId)
      const allowed = isParent || isAuthor

      if (!cancelled) {
        setCanDelete(allowed)

        // show the yellow debug block when ?debug=1 is in the URL
        if (typeof window !== 'undefined' && new URL(window.location.href).searchParams.get('debug') === '1') {
          setDebugInfo({
            viewerId,
            viewerRole,
            postAuthor: authorId || null,
            canDelete: allowed,
          })
        }
      }
    }

    run()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId, authorId])

  return (
    <>
      {debugInfo && (
        <pre className="bg-yellow-100 text-sm p-3 rounded mb-3">
{`DEBUG:
viewerId: ${debugInfo.viewerId}
viewerRole: ${debugInfo.viewerRole}
postAuthor: ${debugInfo.postAuthor}
canDelete: ${String(debugInfo.canDelete)}`}
        </pre>
      )}

      {canDelete && (
        <div className="ml-auto">
          <DeletePostButton postId={postId} />
        </div>
      )}
    </>
  )
}
