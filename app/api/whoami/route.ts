import supabaseServer from "@/lib/supabaseServer";

export async function GET() {
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  return new Response(JSON.stringify({
    email: user?.email ?? null,
    id: user?.id ?? null,
  }), { headers: { "content-type": "application/json" } });
}