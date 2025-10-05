"use client";

import { useEffect, useState, useTransition } from "react";
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
  "steve",
];

type Props = {
  /** Current avatar stem (no .png), or null/undefined if none */
  current?: string | null;
};

export default function AvatarHouse({ current = null }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(current);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Keep local selection in sync if parent prop changes
  useEffect(() => {
    setSelected(current ?? null);
  }, [current]);

  async function chooseAvatar(fileStem: string) {
    setSelected(fileStem);
    setError(null);

    startTransition(async () => {
      try {
        const res = await fetch("/api/settings/avatar/choose", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename: `${fileStem}.png` }),
        });

        const data = await res.json().catch(() => ({} as any));

        if (!res.ok || !data?.ok) {
          const msg = data?.error ? data.error : `Failed (${res.status})`;
          throw new Error(msg);
        }

        // ✅ Success: show toast briefly and refresh
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
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
                {/* optional tiny 'Saved!' chip when the selected tile was just saved */}
                {isActive && saved && (
                  <span className="absolute -top-2 -right-2 rounded-md border border-[#5a3d1a] bg-white/90 px-1.5 py-0.5 text-[10px] font-mc shadow-pixel">
                    Saved!
                  </span>
                )}
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

      {/* ✅ One toast, outside the map, only when save succeeded */}
      {saved && (
        <div className="toast-stack" aria-live="polite">
          <div className="toast-card">
            <span className="toast-emoji">✅</span>
            <span className="toast-message">Saved! Avatar updated.</span>
          </div>
        </div>
      )}
    </section>
  );
}