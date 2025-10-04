import supabaseAdmin from "./supabaseAdmin";
import supabaseServer from "./supabaseServer";

const ERIK_EMAIL = "erik.ys.johansson@gmail.com";
const ERIK_PROFILE_TABLE = "profiles";

export async function getErikUserId(): Promise<string | null> {
  const envId = process.env.NEXT_PUBLIC_ERIK_USER_ID;
  if (envId && typeof envId === "string" && envId.trim().length > 0) {
    return envId.trim();
  }
  // Fallback: lookup by email using admin client
  const { data, error } = await supabaseAdmin.auth.admin.listUsers();
  if (error || !data?.users) return null;
  const user = data.users.find(u => u.email?.toLowerCase() === ERIK_EMAIL.toLowerCase());
  return user?.id ?? null;
}

export async function getErikProfileAvatar(): Promise<string | null> {
  const erikUserId = await getErikUserId();
  if (!erikUserId) return null;
  const { data, error } = await supabaseServer()
    .from(ERIK_PROFILE_TABLE)
    .select("avatar_url")
    .eq("id", erikUserId)
    .maybeSingle();
  if (error || !data) return null;
  return data.avatar_url ?? null;
}

export async function setErikProfileAvatar(url: string): Promise<boolean> {
  const erikUserId = await getErikUserId();
  if (!erikUserId) return false;
  const { error } = await supabaseServer()
    .from(ERIK_PROFILE_TABLE)
    .upsert({ id: erikUserId, avatar_url: url }, { onConflict: "id" });
  return !error;
}
