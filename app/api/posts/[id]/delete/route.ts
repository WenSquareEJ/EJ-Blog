import supabaseServer from "@/lib/supabaseServer";

const ADMIN_EMAIL =
  process.env.NEXT_PUBLIC_ADMIN_EMAIL?.toLowerCase() ?? "wenyu.yan@gmail.com";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const sb = supabaseServer();

  const { data: authRes, error: authError } = await sb.auth.getUser();
  if (authError) {
    console.error("[posts/delete] failed to get user", authError);
    return Response.json({ error: "Failed to authenticate" }, { status: 500 });
  }

  const user = authRes?.user ?? null;
  const requesterEmail = user?.email?.toLowerCase() ?? null;

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!ADMIN_EMAIL || requesterEmail !== ADMIN_EMAIL) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const postId = params.id;

  const { error: deleteError } = await sb
    .from("posts")
    .delete()
    .eq("id", postId);

  if (deleteError) {
    console.error("[posts/delete] failed to delete post", deleteError);
    return Response.json({ error: "Failed to delete post" }, { status: 500 });
  }

  return Response.json({ ok: true });
}
