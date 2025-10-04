import { NextResponse } from 'next/server';
import supabaseServer from '@/lib/supabaseServer';
import supabaseAdmin from '@/lib/supabaseAdmin';

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.toLowerCase();

type ResolveRequest = {
  email?: string;
};

export async function POST(request: Request) {
  const sb = supabaseServer();
  const {
    data: { user },
    error: authError,
  } = await sb.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  if (!ADMIN_EMAIL || user.email?.toLowerCase() !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const payload = (await request.json().catch(() => null)) as ResolveRequest | null;
  const email = payload?.email?.trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ error: 'email required' }, { status: 400 });
  }

  const adminClient = supabaseAdmin();
  const { data: userData, error } = await adminClient.auth.admin.getUserByEmail(email);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const match = userData?.user;

  if (!match) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ user_id: match.id, email: match.email });
}
