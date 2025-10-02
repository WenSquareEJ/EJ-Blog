// app/api/posts/[id]/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  // who is logged in?
  const { data: { user } = { user: null } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const postId = params.id;

  // fetch post author
  const { data: post, error: postErr } = await supabase
    .from("posts")
    .select("id, author")
    .eq("id", postId)
    .maybeSingle();

  if (postErr) {
    return NextResponse.json({ error: "Failed to load post" }, { status: 500 });
  }
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  // check role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const isParent = profile?.role === "parent";
  const isAuthor = post.author === user.id;

  if (!isParent && !isAuthor) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // delete post
  const { error: delErr } = await supabase
    .from("posts")
    .delete()
    .eq("id", postId);

  if (delErr) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
