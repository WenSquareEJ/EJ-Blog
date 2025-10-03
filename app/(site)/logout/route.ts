// app/(site)/logout/route.ts
import { NextResponse } from "next/server";
import supabaseServer from "@/lib/supabaseServer";

export async function POST() {
  const supabase = supabaseServer();
  await supabase.auth.signOut();

  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return NextResponse.redirect(new URL("/", base));
}