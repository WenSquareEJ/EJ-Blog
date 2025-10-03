// /app/api/posts/[id]/comment/route.ts
import supabaseServer from "@/lib/supabaseServer";
import { NextResponse } from "next/server"

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const sb = supabaseServer()
  const form = await req.formData()
  const content = form.get("content") as string

  await sb.from("comments").insert({
    post_id: params.id,
    content,
    status: "pending",
  })

  const accept = req.headers.get("accept") ?? "";
  if (accept.includes("text/html")) {
    const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    return NextResponse.redirect(new URL(`/post/${params.id}`, base));
  }

  return NextResponse.json({ ok: true });
}
