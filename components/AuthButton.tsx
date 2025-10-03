// /components/AuthButtons.tsx
'use client';

import Link from "next/link";

type AuthButtonsProps = {
  /** Logged-in user's email, or null if not logged in */
  userEmail: string | null;
};

export default function AuthButtons({ userEmail }: AuthButtonsProps) {
  // Not logged in → show Login link
  if (!userEmail) {
    return <Link className="btn-mc-secondary" href="/login">Log in</Link>;
  }

  // Logged in → show Logout button (posts to your /logout route)
  return (
    <form action="/logout" method="post">
      <button className="btn-mc-secondary" type="submit">Log out</button>
    </form>
  );
}