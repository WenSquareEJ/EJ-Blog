import supabaseAdmin from "./supabaseAdmin";
import supabaseServer from "./supabaseServer";

const ERIK_EMAIL = "erik.ys.johansson@gmail.com";
const ERIK_PROFILE_TABLE = "profiles";

export async function getErikUserId(): Promise<string | null> {
  const envId = process.env.NEXT_PUBLIC_ERIK_USER_ID;
  if (envId && typeof envId === "string" && envId.trim().length > 0) {
    return envId.trim();
  }
  // Fallback: lookup by email in profiles table
  const { data, error } = await supabaseServer()
    .from(ERIK_PROFILE_TABLE)
    .select("id")
    .eq("email", ERIK_EMAIL)
    .maybeSingle();
  if (error || !data) return null;
  return data.id ?? null;
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
  // Fetch Erik's profile to get required fields
  const { data: profile, error: fetchError } = await supabaseServer()
    .from(ERIK_PROFILE_TABLE)
    .select("id, email")
    .eq("id", erikUserId)
    .maybeSingle();
  if (fetchError || !profile) return false;
  const { email } = profile;
  const { error } = await supabaseServer()
    .from(ERIK_PROFILE_TABLE)
    .upsert({ id: erikUserId, email, avatar_url: url }, { onConflict: "id" });
  return !error;
}
