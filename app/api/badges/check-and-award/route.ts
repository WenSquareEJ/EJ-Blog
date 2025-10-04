import { NextResponse } from 'next/server';
import supabaseServer from '@/lib/supabaseServer';
import { checkAndAwardBadgesForUser } from '@/lib/badges/checkAndAwardForUser';

export async function POST() {
  const sb = supabaseServer();
  const {
    data: auth,
    error: authError,
  } = await sb.auth.getUser();

  if (authError) {
    console.error('[badges/check-award] Failed to verify user', authError);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = auth?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const awarded = await checkAndAwardBadgesForUser({ userId, reader: sb });
    return NextResponse.json({ awarded });
  } catch (error) {
    console.error('[badges/check-award] Failed to evaluate badges', error);
    return NextResponse.json(
      { error: 'Failed to check badges' },
      { status: 500 },
    );
  }
}
