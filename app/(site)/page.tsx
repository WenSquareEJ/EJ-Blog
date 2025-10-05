import TipOfTheDay from "@/components/TipOfTheDay";
import Link from "next/link";
import PortalRoom from "@/components/PortalRoom";
import PixelBackground from "@/components/PixelBackground";
import AvatarTile from "@/components/AvatarTile";
import XPBar from "@/components/XPBar";
import ParrotSprite from "@/components/ParrotSprite";
import { ERIK_USER_ID } from "@/lib/erik";
import { getUser, supabaseServer } from "@/lib/supabaseServer";

export default async function Page() {
  if (!ERIK_USER_ID) {
    console.warn("[home] ERIK_USER_ID is missing; falling back to default avatar");
  }

  const supabase = supabaseServer();
  let avatarUrl = "/avatars/steve.png";

  if (ERIK_USER_ID) {
    const { data, error } = await supabase
      .from("profile_avatar")
      .select("avatar")
      .eq("id", ERIK_USER_ID)
      .maybeSingle();
    if (!error && data?.avatar) {
      avatarUrl = data.avatar;
    }
  }

  // Only show the "Change Avatar" button if Erik is logged in.
  // (Remove this check if you want everyone to see the link; the page itself is PIN-protected.)
  const user = await getUser();
  const isErik = user?.id === ERIK_USER_ID;

  return (
    <div className="space-y-10">
      {/* Home Banner */}
      <section className="home-banner relative overflow-hidden rounded-2xl border-[4px] border-[color:var(--mc-wood)] text-[color:var(--mc-ink)] shadow-mc">
        <PixelBackground className="absolute inset-0 w-full h-full pointer-events-none select-none" />
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:gap-10 p-6">
          <div className="flex flex-col items-center gap-4 md:flex-row md:gap-6">
            <AvatarTile username="Erik" avatarUrl={avatarUrl} className="w-24 h-24 md:w-28 md:h-28 avatar-glow" />
            <div className="flex-1 space-y-2">
              <h1 className="font-mc text-2xl text-[#f4d68e] drop-shadow-[1px_1px_0_#5a3d1a]">
                EJ Blocks & Bots
              </h1>
              <div className="max-w-lg">
                <XPBar />
              </div>
            </div>
          </div>
        </div>
        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-6 px-6 pb-6">
          <div className="md:max-w-[65%] md:flex-1">
            <TipOfTheDay />
          </div>
          <div className="home-banner__parrot md:flex md:basis-[35%] md:justify-end">
            <ParrotSprite className="w-20 sm:w-24 md:w-28" />
          </div>
        </div>
      </section>

      {/* Portal Room grid below Hero */}
      <PortalRoom />

      {/* Erik-only: Avatar change button */}
      {isErik && (
        <div className="px-6">
          <Link href="/site/avatar-house" className="btn-mc">
            🧑 Change Avatar
          </Link>
        </div>
      )}
    </div>
  );
}