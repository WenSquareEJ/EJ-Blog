// /app/api/posts/create/route.ts
import { createServerClient } from "@/lib/supabaseServer"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const sb = createServerClient()
  const form = await req.formData()
  const title = form.get("title") as string
  const content = form.get("content") as string
  const image_url = form.get("image_url") as string | null

  const { data: user } = await sb.auth.getUser()
  if (!user?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { error } = await sb.from("posts").insert({
    title,
    content,
    image_url,
    author_id: user.user.id,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.redirect(new URL("/", req.url))
}
