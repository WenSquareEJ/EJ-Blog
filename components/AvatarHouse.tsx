"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

// 👇 Make sure these names EXACTLY match the .png files in /public/avatars (omit .png)
const AVATAR_FILES = [
  "alex",
  "bluey",
  "creeper",
  "enderman",
  "erik_steve",
  "scientist",
  "skeleton",
  "villager",
  "waffle",
  "zombie",
];

type Props = {
  current?: string | null;
};

export default function AvatarHouse({ current = null }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(current);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function chooseAvatar(fileStem: string) {
    setSelected(fileStem);
    setError(null);

    startTransition(async () => {
      try {
        const res = await fetch("/api/profile/avatar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename: `${fileStem}.png` }),
        });

        const data = await res.json().catch(() => ({} as any));

        if (!res.ok || !data?.ok) {
          const msg = (data && data.error) ? data.error : `Failed (${res.status})`;
          throw new Error(msg);
        }

        router.refresh();
      } catch (e: any) {
        setError(e?.message || "Failed to update avatar.");
      }
    });
  }

  return (
    <section className="home-card">
      <div className="home-card__body space-y-3">
        <h3 className="font-mc text-xl">🏠 Avatar House</h3>
        <p className="text-xs text-mc-stone">Choose your avatar for the site.</p>

        <div className="grid grid-cols-5 gap-3 sm:grid-cols-8">
          {AVATAR_FILES.map((stem) => {
            const isActive = selected === stem;
            return (
              <button
                key={stem}
                onClick={() => chooseAvatar(stem)}
                disabled={pending}
                className={[
                  "relative aspect-square rounded-md border-2 p-1",
                  "bg-[color:rgba(255,255,255,0.9)]",
                  "hover:brightness-95 transition",
                  isActive
                    ? "border-[#2f6f32] ring-2 ring-[#2f6f32]/40"
                    : "border-[#5a3d1a]",
                ].join(" ")}
                title={stem}
              >
                <Image
                  src={`/avatars/${stem}.png`}
                  alt={stem}
                  fill
                  sizes="64px"
                  className="object-contain"
                />
              </button>
            );
          })}
        </div>

  {pending && <p className="text-xs text-mc-stone">Updating…</p>}
  {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    </section>
  );
}
// ...existing code ends above, remove all below...
