
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import Link from "next/link";

const avatarChoices = [
  "alex","bluey","creeper","enderman","erik_steve","scientist","skeleton","villager","waffle","zombie","steve"
];

async function saveAvatar(formData: FormData) {
  "use server";
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: cookies() }
  );
  const avatar = String(formData.get("avatar") || "");
  const ok = avatarChoices.some(s => avatar === `/avatars/${s}.png`);
  if (!ok) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("profiles")
    .upsert({ id: user.id, avatar_url: avatar }, { onConflict: "id" });
  revalidatePath("/site");
  revalidatePath("/site/avatar-house");
  redirect("/site/avatar-house?ok=1");
}

export default async function Page() {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: cookies() }
  );
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("id", user?.id ?? "")
    .maybeSingle();
  const currentAvatar = profile?.avatar_url;

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-mc text-2xl">Choose Your Avatar</h1>
        <Link href="/site" className="btn-mc-secondary">← Back to Home</Link>
      </div>
      <p className="text-xs text-mc-stone">Pick an avatar below. Changes save instantly if you’re signed in as Erik (or admin).</p>
      <form action={saveAvatar} method="post" className="home-card p-4">
        <div className="mt-3 grid grid-cols-5 gap-3 sm:grid-cols-10">
          {avatarChoices.map((stem) => {
            const url = `/avatars/${stem}.png`;
            const selected = currentAvatar === url;
            return (
              <button
                key={stem}
                type="submit"
                name="avatar"
                value={url}
                className={
                  "relative aspect-square rounded-md border-2 p-1 bg-white/90 hover:brightness-95 transition border-[#5a3d1a]" +
                  (selected ? " ring-2 ring-mc-green" : "")
                }
                title={stem}
                aria-label={stem}
              >
                <img
                  src={url}
                  alt={stem}
                  className="object-contain w-full h-full"
                  style={{ borderRadius: "0.5rem" }}
                />
              </button>
            );
          })}
        </div>
      </form>
    </div>
  );
}