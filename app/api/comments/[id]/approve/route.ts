import supabaseServer from "@/lib/supabaseServer";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const sb = supabaseServer();
  const { error } = await sb
    .from("comments")
    .update({ status: "approved" })
    .eq("id", params.id);

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
