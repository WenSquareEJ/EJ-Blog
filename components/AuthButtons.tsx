// Server Component: shows Login (if signed out) or Moderation + Logout (if signed in)
// Uses your existing supabaseServer helper.

import Link from 'next/link'
import { supabaseServer } from '@/lib/supabaseServer'

export default async function AuthButtons() {
  const sb = createServerClient()
  const { data: ures } = await sb.auth.getUser()
  const user = ures?.user

  // Not logged in → show Login
  if (!user) {
    return (
      <Link
        href="/login"
        className="px-3 py-1 rounded-md border border-mc-stem bg-white/80 hover:bg-white"
      >
        Login
      </Link>
    )
  }

  // Fetch role (allowed by your RLS read policy on `profiles`)
  let role: 'parent' | 'child' | null = null
  const { data: prof } = await sb
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()
  role = (prof?.role ?? null) as any

  return (
    <div className="flex items-center gap-3">
      {role === 'parent' && (
        <Link
          href="/moderation"
          className="px-3 py-1 rounded-md border border-mc-stem bg-white/80 hover:bg-white"
        >
          Moderation
        </Link>
      )}
      <form action="/logout" method="post">
        <button
          type="submit"
          className="px-3 py-1 rounded-md border border-mc-stem bg-white/80 hover:bg-white"
        >
          Logout
        </button>
      </form>
    </div>
  )
}
