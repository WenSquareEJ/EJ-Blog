// /app/api/posts/[id]/like/route.ts
import supabaseServer from "@/lib/supabaseServer";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const sb = supabaseServer();
  const { data: userRes } = await sb.auth.getUser();

  await sb.from("reactions").insert({
    target_type: "post",
    target_id: params.id,
    kind: "like",
    user_id: userRes?.user?.id ?? null,
  });

  const base = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
  return NextResponse.redirect(new URL(`/post/${params.id}`, base));
}
