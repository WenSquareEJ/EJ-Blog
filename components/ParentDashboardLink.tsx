"use client";

import Link from "next/link";

export default function ParentDashboardLink() {
  return (
    <Link
      href="/parent"
      className="px-2 py-1 rounded border border-black bg-white text-xs hover:brightness-90"
    >
      Parent Dashboard
    </Link>
  );
}