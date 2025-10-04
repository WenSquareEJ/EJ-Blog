// RLS Policy (documented):
// Allow delete on public.scratch_projects if:
//   - User is admin (auth.email() = NEXT_PUBLIC_ADMIN_EMAIL)
//   - OR user is owner (auth.uid() = created_by)
//
// See Supabase policies for details.

import supabaseServer from "@/lib/supabaseServer";

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.toLowerCase() ?? "wenyu.yan@gmail.com";

function isUUID(id: string) {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  if (!isUUID(id)) {
    return Response.json({ error: "Invalid project ID" }, { status: 400 });
  }

  const sb = supabaseServer();
  const { data: authRes, error: authError } = await sb.auth.getUser();
  if (authError) {
    return Response.json({ error: "Failed to authenticate" }, { status: 500 });
  }
  const user = authRes?.user ?? null;
  const requesterEmail = user?.email?.toLowerCase() ?? null;
  const requesterId = user?.id ?? null;
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch project to check ownership and thumbnail
  const { data: project, error: fetchError } = await sb
    .from("scratch_projects")
    .select("id, created_by, image_path")
    .eq("id", id)
    .maybeSingle();
  if (fetchError) {
    return Response.json({ error: "Failed to load project" }, { status: 500 });
  }
  if (!project) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  // Check permissions
  if (
    !(
      (project.created_by && requesterId === project.created_by) ||
      requesterEmail === ADMIN_EMAIL
    )
  ) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  // Delete project record
  const { error: deleteError } = await sb
    .from("scratch_projects")
    .delete()
    .eq("id", id);
  if (deleteError) {
    return Response.json({ error: "Failed to delete project" }, { status: 500 });
  }

  // Delete thumbnail from storage if present
  if (project.image_path) {
    const { error: storageError } = await sb.storage
      .from("scratch-thumbnails")
      .remove([project.image_path]);
    if (storageError) {
      // Not fatal, just log
      console.warn("Failed to delete thumbnail from storage", storageError);
    }
  }

  return Response.json({ ok: true });
}
