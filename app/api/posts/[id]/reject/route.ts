import supabaseServer from "@/lib/supabaseServer";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const sb = supabaseServer();
  const { error } = await sb
    .from("posts")
    .update({ status: "rejected" })
    .eq("id", params.id)
    .neq("status", "deleted");

  if (error) {
    return new Response(error.message, { status: 500 });
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
