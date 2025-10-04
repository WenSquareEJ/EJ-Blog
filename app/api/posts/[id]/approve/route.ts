import supabaseServer from "@/lib/supabaseServer";
import supabaseAdmin from "@/lib/supabaseAdmin";
import {
  checkAndAwardForMinecraftPosts,
  checkAndAwardForPost,
} from "@/lib/badges";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const sb = supabaseServer();
  const {
    data: updatedPost,
    error,
  } = await sb
    .from("posts")
    .update({ status: "approved", published_at: new Date().toISOString() })
    .eq("id", params.id)
    .neq("status", "deleted")
    .select("id, author")
    .maybeSingle();

  if (error) {
    return new Response(error.message, { status: 500 });
  }

  if (updatedPost?.author) {
    const adminClient = supabaseAdmin();
    try {
      await Promise.all([
        checkAndAwardForPost(updatedPost.author, adminClient),
        checkAndAwardForMinecraftPosts(updatedPost.author, adminClient),
      ]);
    } catch (awardError) {
      console.error("[badges] Failed to award badges after approval", awardError);
    }
  }

  return redirectOrJson(req);
}

function redirectOrJson(req: Request) {
  const accept = req.headers.get("accept") ?? "";
  if (accept.includes("text/html")) {
    return Response.redirect(new URL("/moderation", req.url));
  }
  return Response.json({ ok: true });
}
