import { NextResponse } from 'next/server';
import supabaseServer from '@/lib/supabaseServer';
import supabaseAdmin from '@/lib/supabaseAdmin';

type DevAwardRequest = {
  badge_id?: string;
};

export async function POST(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  const sb = supabaseServer();
  const {
    data: { user },
    error: authError,
  } = await sb.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as DevAwardRequest | null;
  const badgeId = payload?.badge_id?.trim();

  if (!badgeId) {
    return NextResponse.json({ error: 'badge_id required' }, { status: 400 });
  }

  const adminClient = supabaseAdmin();
  const { data, error } = await adminClient
    .from('user_badges')
    .upsert(
      {
        user_id: user.id,
        badge_id: badgeId,
      },
      { onConflict: 'user_id,badge_id' },
    )
    .select('user_id, badge_id, awarded_at')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, record: data });
}

