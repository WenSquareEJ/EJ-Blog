// /app/(site)/logout/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  const sb = supabaseServer();
  // ignore errors to ensure we always redirect
  try { await sb.auth.signOut(); } catch {}
  return NextResponse.redirect(new URL("/", req.url));
}
