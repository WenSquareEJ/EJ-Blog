
import { redirect } from "next/navigation";
import supabaseServer from "@/lib/supabaseServer";
import { getErikUserId } from "@/lib/erik";
import AvatarHousePageClient from "./AvatarHousePageClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page() {
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();

  const erikUserId = await getErikUserId();
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.toLowerCase() ?? "";

  const isErik = !!(user?.id && erikUserId && user.id === erikUserId);
  const isAdmin = !!(user?.email && user.email.toLowerCase() === adminEmail);

  if (!isErik && !isAdmin) {
    redirect("/site");
  }

  return <AvatarHousePageClient />;
}
