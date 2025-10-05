import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const AVATAR_CHOICES = [
  "alex","bluey","creeper","enderman","erik_steve","scientist",
  "skeleton","villager","waffle","zombie","steve",
];

async function saveAvatar(formData: FormData) {
  "use server";

  // 1) Validate secret (PIN)
  const expected = process.env.AVATAR_CHANGE_SECRET || "";
  const provided = String(formData.get("secret") || "");
  if (!expected || provided !== expected) {
    redirect("/site/avatar-house?err=bad_secret");
  }

  // 2) Validate avatar choice
  const avatar = String(formData.get("avatar") || "");
  const ok = AVATAR_CHOICES.some(s => avatar === `/avatars/${s}.png`);
  if (!ok) {
    redirect("/site/avatar-house?err=bad_avatar");
  }

  // 3) Write Erik's avatar using service role
  const admin = supabaseAdmin();
  const erikId = process.env.NEXT_PUBLIC_ERIK_USER_ID!;
  await admin
    .from("profile_avatar")
    .upsert({ id: erikId, avatar }, { onConflict: "id" });

  // 4) Revalidate pages so Home updates instantly
  revalidatePath("/site");
  revalidatePath("/site/avatar-house");
  redirect("/site/avatar-house?ok=1");
}

export default async function Page() {
  // Optional: fetch current to show selection state
  const admin = supabaseAdmin();
  const erikId = process.env.NEXT_PUBLIC_ERIK_USER_ID!;
  const { data: row } = await admin
    .from("profile_avatar")
    .select("avatar")
    .eq("id", erikId)
    .maybeSingle();

  const currentAvatar = row?.avatar ?? "/avatars/erik_steve.png";

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-mc text-2xl">Avatar House</h1>
        <Link href="/site" className="btn-mc-secondary">← Back to Home</Link>
      </div>

      <p className="text-xs text-mc-stone">
        Enter your secret and pick an avatar. Changes save instantly.
      </p>

      <form action={saveAvatar} method="post" className="home-card p-4 space-y-4">
        <div className="flex items-center gap-3">
          <label className="text-sm w-28">Secret</label>
          <input
            type="password"
            name="secret"
            required
            className="border rounded px-2 py-1 text-sm"
            placeholder="Enter PIN"
          />
        </div>

        <div className="grid grid-cols-5 gap-3 sm:grid-cols-10">
          {AVATAR_CHOICES.map(stem => {
            const url = `/avatars/${stem}.png`;
            const selected = currentAvatar === url;
            return (
              <button
                key={stem}
                type="submit"
                name="avatar"
                value={url}
                className={[
                  "relative aspect-square rounded-md border-2 p-1 bg-white/90 hover:brightness-95 transition",
                  selected ? "border-[#2f6f32] ring-2 ring-[#2f6f32]/40" : "border-[#5a3d1a]",
                ].join(" ")}
                title={stem}
                aria-label={stem}
              >
                <img src={url} alt={stem} className="object-contain w-full h-full rounded-md" />
              </button>
            );
          })}
        </div>
      </form>
    </div>
  );
}