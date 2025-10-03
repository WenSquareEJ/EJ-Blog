"use client";

import Link from "next/link";

export default function ModerationQueueLink() {
  return (
    <Link
      href="/moderation"
      className="px-2 py-1 rounded border border-black bg-white text-xs hover:brightness-90"
    >
      Moderation
    </Link>
  );
}