
import supabaseAdmin from "./supabaseAdmin";
import supabaseServer from "./supabaseServer";

export const AVATAR_OPTIONS = [
  "Steve.png","Alex.png","Creeper.png","Enderman.png","Skeleton.png","Zombie.png","Villager.png","Pig.png","Bee.png","Fox.png",
  "Parrot_Red.png","Parrot_Blue.png","Parrot_Green.png","Parrot_Cyan.png","Parrot_Yellow.png","Wolf.png"
];

const ERIK_EMAIL = "erik.ys.johansson@gmail.com";
const ERIK_PROFILE_TABLE = "profiles";

export async function getErikUserId(): Promise<string | null> {
  const envId = process.env.NEXT_PUBLIC_ERIK_USER_ID;
  if (envId && typeof envId === "string" && envId.trim().length > 0) {
    return envId.trim();
  }
  // Fallback: lookup by email using supabaseAdmin
  try {
    const { data, error } = await supabaseAdmin().auth.admin.listUsers();
    if (error || !data?.users) return null;
    const erik = data.users.find((u: any) => u.email === ERIK_EMAIL);
    return erik?.id ?? null;
  } catch {
    return null;
  }
}

export async function getErikProfileAvatar(): Promise<string> {
  // Try to get Erik's user_metadata.avatar from Supabase auth
  const erikUserId = await getErikUserId();
  if (!erikUserId) return "/avatars/Steve.png";
  try {
    const { data, error } = await supabaseAdmin().auth.admin.getUserById(erikUserId);
    if (error || !data || !data.user) return "/avatars/Steve.png";
    const filename = data.user.user_metadata?.avatar;
    if (typeof filename === "string" && AVATAR_OPTIONS.includes(filename)) {
      return `/avatars/${filename}`;
    }
    return "/avatars/Steve.png";
  } catch {
    return "/avatars/Steve.png";
  }
}
