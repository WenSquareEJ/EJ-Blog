// TODO: Remove this route once badge seeding has been completed in all environments.
import supabaseAdmin from '@/lib/supabaseAdmin';
import { BADGE_SEED, upsertBadges } from '@/lib/badgesSeed';

export async function POST() {
  const client = supabaseAdmin();
  const { data, error } = await upsertBadges(client);

  if (error) {
    console.error('[badges/seed] Failed to upsert badges', error);
    return new Response('Failed to seed badges', { status: 500 });
  }

  const processedNames = data?.map((badge) => badge.name) ?? [];
  console.log('[badges/seed] Seeded badges', {
    expectedDefinitions: BADGE_SEED.length,
    storedRows: processedNames.length,
    names: processedNames,
  });

  return Response.json({
    ok: true,
    expectedDefinitions: BADGE_SEED.length,
    storedRows: processedNames.length,
    names: processedNames,
  });
}

