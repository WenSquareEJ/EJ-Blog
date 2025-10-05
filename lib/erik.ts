export function normalizeAvatarFilename(input: string): string {
  return String(input || "")
    .trim()
    .toLowerCase()
    .replace(/^.*[\\/]/, ""); // strip any path
}

export function toAvatarFilename(input: string): AvatarFilename | null {
  const n = normalizeAvatarFilename(input);
  return isAvatarFilename(n) ? (n as AvatarFilename) : null;
}

import supabaseAdmin from "./supabaseAdmin";
import supabaseServer from "./supabaseServer";



export const AVATAR_OPTIONS = [
  "alex.png",
  "bluey.png",
  "creeper.png",
  "enderman.png",
  "erik_steve.png",
  "scientist.png",
  "skeleton.png",
  "villager.png",
  "waffle.png",
  "zombie.png",
] as const;

export type AvatarFilename = (typeof AVATAR_OPTIONS)[number];

export function isAvatarFilename(s: string): s is AvatarFilename {
  return (AVATAR_OPTIONS as readonly string[]).includes(s);
}

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
    if (typeof filename === "string") {
      const normalized = normalizeAvatarFilename(filename);
      if (isAvatarFilename(normalized)) {
        return `/avatars/${normalized}`;
      }
    }
    return "/avatars/Steve.png";
  } catch {
    return "/avatars/Steve.png";
  }
}
