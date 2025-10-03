'use client';

import Link from "next/link";

type AuthButtonsProps = {
  userEmail?: string | null;
};

export default function AuthButtons({ userEmail = null }: AuthButtonsProps) {
  if (!userEmail) {
    // If no one is logged in → show Login link
    return <Link className="btn-mc-secondary" href="/login">Log in</Link>;
  }

  // If logged in → show Logout button
  return (
    <form action="/logout" method="post">
      <button className="btn-mc-secondary" type="submit">Log out</button>
    </form>
  );
}