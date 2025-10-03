// components/AuthButtons.tsx
'use client'

import Link from 'next/link'

type Props = {
  userEmail: string | null
}

export default function AuthButtons({ userEmail }: Props) {
  // Not logged in → show Login link
  if (!userEmail) {
    return <Link className="btn-mc-secondary" href="/login">Log in</Link>
  }

  // Logged in → show Logout button (posts to /logout route)
  return (
    <form action="/logout" method="post">
      <button type="submit" className="btn-mc-secondary">Log out</button>
    </form>
  )
}