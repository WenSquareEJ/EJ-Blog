// /app/(site)/logout/route.ts
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/createServerClient";

export async function POST(req: Request) {
  const sb = createServerClient();
  // ignore errors to ensure we always redirect
  try { await sb.auth.signOut(); } catch {}
  return NextResponse.redirect(new URL("/", req.url));
}
