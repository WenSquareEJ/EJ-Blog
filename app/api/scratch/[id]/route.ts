import { NextResponse } from "next/server";
import supabaseServer from "@/lib/supabaseServer";

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.toLowerCase();
  const { data: project, error: fetchError } = await sb
    .from("scratch_projects")
    .select("id, user_id")
    .eq("id", params.id)
    .maybeSingle();
  if (fetchError) {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const isAdmin = user.email?.toLowerCase() === adminEmail;
  const isOwner = user.id === project.user_id;
  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { error: deleteError } = await sb
    .from("scratch_projects")
    .delete()
    .eq("id", params.id);
  if (deleteError) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
  return new NextResponse(null, { status: 204 });
}
