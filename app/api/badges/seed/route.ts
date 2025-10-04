// TODO: Remove this route once badge seeding has been completed in all environments.
import { NextResponse } from 'next/server';
import supabaseServer from '@/lib/supabaseServer';
import supabaseAdmin from '@/lib/supabaseAdmin';
import { BADGE_SEED, upsertBadges } from '@/lib/badgesSeed';

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.toLowerCase();

export async function POST() {
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

  const client = supabaseAdmin();
  const { data, error } = await upsertBadges(client);

  if (error) {
    console.error('[badges/seed] Failed to upsert badges', error);
    return NextResponse.json({ error: 'Failed to seed badges' }, { status: 500 });
  }

  const processedNames = data?.map((badge) => badge.name) ?? [];
  console.log('[badges/seed] Seeded badges', {
    expectedDefinitions: BADGE_SEED.length,
    storedRows: processedNames.length,
    names: processedNames,
    adminUser: user.id,
  });

  return NextResponse.json({
    ok: true,
    expectedDefinitions: BADGE_SEED.length,
    storedRows: processedNames.length,
    names: processedNames,
  });
}
