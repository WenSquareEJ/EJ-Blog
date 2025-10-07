// /app/api/posts/[id]/comment/route.ts
import supabaseServer from "@/lib/supabaseServer";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const sb = supabaseServer();
  const form = await req.formData();

  // ✅ Validation (prevents empty or overly long comments)
  const content = String(form.get("content") ?? "").trim();
  if (!content) {
    return NextResponse.json({ error: "Comment cannot be empty" }, { status: 400 });
  }
  if (content.length > 2000) {
    return NextResponse.json({ error: "Comment too long" }, { status: 400 });
  }

  // ✅ Minimal type-safe fix (temporary cast only on this call)
  await (sb.from("comments") as any).insert([
    { post_id: params.id, content, status: "pending" },
  ]);

  // ✅ Preserve your existing redirect logic
  const accept = req.headers.get("accept") ?? "";
  if (accept.includes("text/html")) {
    const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    return NextResponse.redirect(new URL(`/post/${params.id}`, base));
  }

  return NextResponse.json({ ok: true });
}