

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import AvatarHousePageClient from "./AvatarHousePageClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page() {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: cookies() }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/avatar-house");
  }

  return <AvatarHousePageClient initialUser={user} />;
}
