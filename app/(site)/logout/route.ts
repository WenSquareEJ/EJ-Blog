// app/(site)/logout/route.ts
import { NextResponse } from "next/server";
import supabaseRoute from "@/lib/supabaseRoute";

export async function POST() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const response = NextResponse.redirect(new URL("/", base));
  const supabase = supabaseRoute(response);

  await supabase.auth.signOut();

  return response;
}
