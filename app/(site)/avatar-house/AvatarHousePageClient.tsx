"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import AvatarHouse from "@/components/AvatarHouse";

type Props = {
  initialUser: { id: string; email?: string | null } | null;
};

export default function AvatarHousePageClient({ initialUser }: Props) {
  const [user] = useState(initialUser);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/profile/avatar/current", { credentials: "same-origin" });
        if (!alive) return;
        if (res.ok) {
          const json = await res.json();
          setAvatarUrl((json?.avatarUrl as string) ?? null);
        }
      } catch {}
    })();
    return () => { alive = false; };
  }, []);

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-mc text-2xl">Choose Your Avatar</h1>
        <Link href="/site" className="btn-mc-secondary">← Back to Home</Link>
      </div>

      {!user && <p className="text-sm text-red-600">Please sign in to change your avatar.</p>}

      {!!user && (
        <>
          {avatarUrl && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-mc-stone">Current:</span>
              <Image src={avatarUrl} alt="Current avatar" width={48} height={48} className="rounded-md" />
            </div>
          )}
          {/* Re-use the grid; it posts to /api/settings/avatar/choose */}
          <AvatarHouse />
        </>
      )}
    </div>
  );
}
