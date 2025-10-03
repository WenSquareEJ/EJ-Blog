// /app/api/posts/[id]/like/route.ts
import supabaseServer from "@/lib/supabaseServer";
import { NextResponse } from "next/server";
import type { TablesInsert } from "@/lib/database.types";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const sb = supabaseServer();
  const { data: userRes } = await sb.auth.getUser();

  const reaction: TablesInsert<"reactions"> = {
    target_type: "post",
    target_id: params.id,
    kind: "like",
    user_id: userRes?.user?.id ?? null,
  };

  await sb.from("reactions").insert(reaction);

  const base = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
  return NextResponse.redirect(new URL(`/post/${params.id}`, base));
}
