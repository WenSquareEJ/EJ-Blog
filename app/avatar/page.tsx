"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import AvatarHouse from "@/components/AvatarHouse";

export default function AvatarPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [current, setCurrent] = useState<string | null>(null); // stem (no .png)
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("Please sign in to change your avatar.");
        setLoading(false);
        return;
      }
      setUserId(user.id);

      // Load current avatar from profiles
      const { data, error } = await supabase
        .from("profiles")
        .select("avatar")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        setError(error.message);
      } else {
        const filename = (data?.avatar ?? "").toString();
        const match = filename.match(/^(.+)\.png$/i);
        setCurrent(match?.[1]?.toLowerCase() ?? null);
      }
      setLoading(false);
    })();
  }, [supabase]);

  function onUpdated(newStem: string) {
    setCurrent(newStem);
    startTransition(() => router.refresh());
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-mc text-2xl text-[#5a3d1a]">Choose Your Avatar</h1>
        <Link href="/site" className="btn-mc">⬅ Back to Home</Link>
      </div>

      {loading ? (
        <p className="text-sm text-mc-stone">Loading…</p>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : (
        <>
          {/* Current avatar preview */}
          <section className="home-card p-4">
            <h2 className="font-mc text-lg mb-3 text-[#3b2f23]">Current Avatar</h2>
            <div className="flex items-center gap-4">
              <div className="relative w-24 h-24 rounded-md border-2 border-[#5a3d1a] bg-white/80">
                {current ? (
                  <Image
                    src={`/avatars/${current}.png`}
                    alt="Current avatar"
                    fill
                    sizes="96px"
                    className="object-contain"
                  />
                ) : (
                  <div className="w-full h-full grid place-items-center text-xs text-mc-stone">No avatar</div>
                )}
              </div>
              <div className="text-xs text-mc-stone">
                Pick an avatar below — changes save instantly.
              </div>
            </div>
          </section>

          {/* Avatar selection grid (re-use existing component) */}
          <AvatarHouse
            current={current ?? undefined}
          />
        </>
      )}
    </div>
  );
}
