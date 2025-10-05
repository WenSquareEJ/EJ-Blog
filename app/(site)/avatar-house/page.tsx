import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const AVATAR_CHOICES = [
  "alex", "bluey", "creeper", "enderman", "erik_steve",
  "scientist", "skeleton", "villager", "waffle", "zombie", "steve",
];

async function saveAvatar(formData: FormData) {
  "use server";

  const expected = process.env.AVATAR_CHANGE_SECRET || "";
  const provided = String(formData.get("secret") || "").trim();
  if (!expected || provided !== expected) {
    redirect("/site/avatar-house?err=bad_secret");
  }

  const avatar = String(formData.get("avatar") || "");
  const ok = AVATAR_CHOICES.some(s => avatar === `/avatars/${s}.png`);
  if (!ok) {
    redirect("/site/avatar-house?err=bad_avatar");
  }

  const admin = supabaseAdmin();
  const erikId = process.env.NEXT_PUBLIC_ERIK_USER_ID!;
  await admin
    .from("profile_avatar")
    .upsert({ id: erikId, avatar }, { onConflict: "id" });

  revalidatePath("/site");
  revalidatePath("/site/avatar-house");
  redirect("/site/avatar-house?ok=1");
}

export default async function Page({
  searchParams,
}: {
  searchParams: { ok?: string; err?: string };
}) {
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
      <h1 className="font-mc text-2xl text-center">🏠 Avatar House</h1>

      {searchParams.ok && (
        <p className="text-green-600 text-center text-sm">✅ Avatar updated successfully!</p>
      )}
      {searchParams.err === "bad_secret" && (
        <p className="text-red-600 text-center text-sm">❌ Incorrect secret.</p>
      )}
      {searchParams.err === "bad_avatar" && (
        <p className="text-red-600 text-center text-sm">❌ Invalid avatar choice.</p>
      )}

      <p className="text-xs text-mc-stone text-center">
        Enter your secret PIN and pick an avatar. Changes are instant once saved.
      </p>

      <form action={saveAvatar} method="post" className="home-card p-4 space-y-4">
        <div className="flex items-center justify-center gap-3">
          <label className="text-sm w-20 text-right">Secret:</label>
          <input
            type="password"
            name="secret"
            required
            className="border rounded px-2 py-1 text-sm"
            placeholder="Enter PIN"
          />
        </div>

        <div className="grid grid-cols-5 gap-3 sm:grid-cols-10 justify-items-center">
          {AVATAR_CHOICES.map((stem) => {
            const url = `/avatars/${stem}.png`;
            const selected = currentAvatar === url;
            return (
              <button
                key={stem}
                type="submit"
                name="avatar"
                value={url}
                className={[
                  "relative aspect-square rounded-md border-2 p-1 transition-all duration-200",
                  "bg-white/90 border-[#5a3d1a] hover:brightness-105 hover:ring-4 hover:ring-[#2f6f32]/40 hover:shadow-[0_0_12px_#2f6f32aa]",
                  selected
                    ? "border-[#2f6f32] ring-4 ring-[#2f6f32]/60 shadow-[0_0_15px_#2f6f32aa] scale-105"
                    : "",
                ].join(" ")}
                title={stem}
                aria-label={stem}
              >
                <img
                  src={url}
                  alt={stem}
                  className="object-contain w-full h-full rounded-md"
                />
              </button>
            );
          })}
        </div>
      </form>
    </div>
  );
}