import { NextResponse } from 'next/server';
import supabaseServer from '@/lib/supabaseServer';

export async function GET() {
  const sb = supabaseServer();
  const {
    data: auth,
    error: authError,
  } = await sb.auth.getUser();

  if (authError) {
    console.error('[badges/earned-count] Failed to verify user', authError);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = auth?.user?.id;
  if (!userId) {
    return NextResponse.json({ count: 0 });
  }

  const { count, error } = await sb
    .from('user_badges')
    .select('badge_id', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) {
    console.error('[badges/earned-count] Failed to count badges', error);
    return NextResponse.json({ error: 'Failed to load badge count' }, { status: 500 });
  }

  return NextResponse.json({ count: count ?? 0 });
}
