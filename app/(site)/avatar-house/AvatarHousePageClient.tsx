// app/(site)/avatar-house/AvatarHousePageClient.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import AvatarHouse from "@/components/AvatarHouse";

export default function AvatarHousePageClient() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!isMounted) return;
      setUser(user ?? null);

      // Optional: fetch current avatar url from your existing endpoint (if present)
      try {
        const res = await fetch("/api/profile/avatar/current", { credentials: "same-origin" });
        if (res.ok) {
          const json = await res.json();
          setAvatarUrl((json?.avatarUrl as string) ?? null);
        }
      } catch {}

      setLoading(false);
    })();
    return () => { isMounted = false; };
  }, [supabase]);

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-mc text-2xl">Choose Your Avatar</h1>
        <Link href="/site" className="btn-mc-secondary">← Back to Home</Link>
      </div>

      {loading && <p className="text-sm text-mc-stone">Loading…</p>}
      {!loading && !user && <p className="text-sm text-red-600">Please sign in to change your avatar.</p>}

      {!!user && (
        <>
          {avatarUrl && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-mc-stone">Current:</span>
              <Image src={avatarUrl} alt="Current avatar" width={48} height={48} className="rounded-md" />
            </div>
          )}
          <AvatarHouse />
        </>
      )}
    </div>
  );
}
