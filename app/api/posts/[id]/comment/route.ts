// /app/api/posts/[id]/comment/route.ts
import { createServerClient } from "@/lib/createServerClient"
import { NextResponse } from "next/server"

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const sb = createServerClient()
  const form = await req.formData()
  const content = form.get("content") as string

  await sb.from("comments").insert({
    post_id: params.id,
    content,
  })

  return NextResponse.redirect(new URL(`/post/${params.id}`, process.env.NEXT_PUBLIC_SITE_URL))
}
