

import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/lib/database.types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Allowed avatar stems. Corresponding PNGs must exist under /public/avatars/ */
const AVATAR_STEMS = [
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
] as const;
type AvatarStem = (typeof AVATAR_STEMS)[number];

function isAllowedStem(v: string): v is AvatarStem {
  return AVATAR_STEMS.includes(v as AvatarStem);
}

/** Server Action: update Erik's profiles.avatar_url (only Erik can change) */
async function saveAvatar(formData: FormData): Promise<void> {
  "use server";
  const supabase = createServerActionClient({ cookies });

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      console.error("Auth error:", error?.message);
      return;
    }

    const erikId = process.env.NEXT_PUBLIC_ERIK_USER_ID;
    if (user.id !== erikId) {
      console.error("Forbidden: Not Erik");
      return;
    }

    const stem = String(formData.get("stem") ?? "").replace(/\.png$/i, "");
    const allowed = [
      "steve", "alex", "creeper", "enderman", "skeleton",
      "parrot-blue", "parrot-red", "miner", "builder", "erik_steve"
    ];
    if (!allowed.includes(stem)) {
      console.error("Invalid avatar choice:", stem);
      return;
    }

    await supabase
      .from("profiles")
      .update({ avatar_url: `/avatars/${stem}.png` })
      .eq("id", user.id);

    revalidatePath("/site");
  } catch (e: any) {
    console.error("saveAvatar server action error:", e?.message || e);
  }
}

export default async function AvatarHousePage() {
  // We still render the page even if user isn’t signed in; the form will refuse to save.
  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-mc text-2xl">Choose Your Avatar</h1>
        <Link href="/site" className="btn-mc">← Back to Home</Link>
      </div>

      <p className="text-xs text-mc-stone">
        Pick an avatar below. Changes save instantly if you’re signed in as Erik (or admin).
      </p>

      <form action={saveAvatar}>
        <div className="grid grid-cols-5 gap-3 sm:grid-cols-8">
          {AVATAR_STEMS.map((stem) => (
            <button
              key={stem}
              name="stem"
              value={stem}
              className={["relative aspect-square rounded-md border-2 p-1",
                "bg-[color:rgba(255,255,255,0.9)] hover:brightness-95 transition",
                "border-[color:var(--mc-wood)]",
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
          ))}
        </div>
      </form>
    </div>
  );
}
