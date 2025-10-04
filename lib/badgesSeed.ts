import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, TablesInsert } from './database.types';

export const BADGE_SEED: TablesInsert<'badges'>[] = [
  {
    name: 'First Post',
    description: 'Publish your very first story for the family.',
    icon: '📝',
    criteria: { type: 'post_count', threshold: 1 },
  },
  {
    name: 'Explorer',
    description: 'Share adventures from different parts of the world.',
    icon: '🧭',
    criteria: { type: 'location_posts', threshold: 3 },
  },
  {
    name: 'Creeper Defender',
    description: 'Post tips to keep the Minecraft world safe.',
    icon: '💥',
    criteria: { type: 'minecraft_tag_posts', threshold: 3 },
  },
  {
    name: 'Redstone Tinkerer',
    description: 'Document clever builds or STEM experiments.',
    icon: '🧩',
    criteria: { type: 'project_posts', threshold: 2 },
  },
  {
    name: 'Daily Streak 7',
    description: 'Post for seven days in a row.',
    icon: '🔥7',
    criteria: { type: 'daily_streak', threshold: 7 },
  },
];

export async function upsertBadges(client: SupabaseClient<Database>) {
  return client
    .from('badges')
    .upsert(BADGE_SEED, { onConflict: 'name' })
    .select('id, name');
}
