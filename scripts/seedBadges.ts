import supabaseAdmin from '../lib/supabaseAdmin';
import { BADGE_SEED, upsertBadges } from '../lib/badgesSeed';

async function main() {
  const client = supabaseAdmin();
  const { data, error } = await upsertBadges(client);

  if (error) {
    console.error('Failed to seed badges', error);
    process.exit(1);
  }

  const seededNames = data?.map((badge) => badge.name) ?? [];
  console.log(
    `Seed badges completed. Processed ${BADGE_SEED.length} definitions; ` +
      `${seededNames.length} rows currently stored by name.`,
  );
}

void main();

