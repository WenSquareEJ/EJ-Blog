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

  const {
    data: post,
    error: fetchError,
  } = await sb
    .from("posts")
    .select("id, status")
    .eq("id", postId)
    .maybeSingle();

  if (fetchError) {
    console.error("[posts/delete] failed to load post", fetchError);
    return Response.json({ error: "Failed to load post" }, { status: 500 });
  }

  if (!post || post.status === "deleted") {
    return Response.json({ error: "Post not found" }, { status: 404 });
  }

  const { error: updateError } = await sb
    .from("posts")
    .update({ status: "deleted" })
    .eq("id", postId);

  if (updateError) {
    console.error("[posts/delete] failed to soft-delete post", updateError);
    return Response.json({ error: "Failed to delete post" }, { status: 500 });
  }

  return Response.json({ ok: true });
}
