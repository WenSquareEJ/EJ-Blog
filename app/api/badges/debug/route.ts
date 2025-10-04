import { NextResponse } from 'next/server';
import supabaseServer from '@/lib/supabaseServer';

export async function GET() {
  const sb = supabaseServer();

  const badgesResult = await sb
    .from('badges')
    .select('id', { count: 'exact', head: true });

  let badgesCount: number | null = null;
  let badgesError: string | null = null;
  let badgesRLS = false;

  if (badgesResult.error) {
    badgesError = badgesResult.error.message;
    badgesRLS = badgesResult.error.code === '42501';
  } else {
    badgesCount = badgesResult.count ?? 0;
  }

  const {
    data: { user },
  } = await sb.auth.getUser();

  let userBadgesCount: number | null = null;
  let userBadgesError: string | null = null;
  let userBadgesRLS = false;

  if (user?.id) {
    const userBadgesResult = await sb
      .from('user_badges')
      .select('badge_id', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (userBadgesResult.error) {
      userBadgesError = userBadgesResult.error.message;
      userBadgesRLS = userBadgesResult.error.code === '42501';
    } else {
      userBadgesCount = userBadgesResult.count ?? 0;
    }
  }

  return NextResponse.json({
    badgesCount,
    badgesError,
    badgesRLS,
    userBadgesCount,
    userBadgesError,
    userBadgesRLS,
  });
}

