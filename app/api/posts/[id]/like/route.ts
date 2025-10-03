// /app/api/posts/[id]/like/route.ts
import supabaseServer from "@/lib/supabaseServer";
import { NextResponse } from "next/server"

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const sb = supabaseServer()

  const { data: post } = await sb.from("posts").select("likes").eq("id", params.id).single()
  const newLikes = (post?.likes || 0) + 1

  await sb.from("posts").update({ likes: newLikes }).eq("id", params.id)
  return NextResponse.redirect(new URL(`/post/${params.id}`, process.env.NEXT_PUBLIC_SITE_URL))
}
