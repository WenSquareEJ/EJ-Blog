import { NextResponse } from 'next/server';
import supabaseServer from '@/lib/supabaseServer';
import supabaseAdmin from '@/lib/supabaseAdmin';

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.toLowerCase();

type AwardRequest = {
  user_id?: string;
  badge_id?: string;
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

  const payload = (await request.json().catch(() => null)) as AwardRequest | null;
  const userId = payload?.user_id?.trim();
  const badgeId = payload?.badge_id?.trim();

  if (!userId || !badgeId) {
    return NextResponse.json({ error: 'user_id and badge_id required' }, { status: 400 });
  }

  const adminClient = supabaseAdmin();
  const { data, error } = await adminClient
    .from('user_badges')
    .upsert(
      {
        user_id: userId,
        badge_id: badgeId,
      },
      { onConflict: 'user_id,badge_id' },
    )
    .select('user_id, badge_id, awarded_at')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, record: data }, { status: 200 });
}

