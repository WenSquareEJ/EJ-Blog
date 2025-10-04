import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, TablesInsert } from './database.types';
import supabaseAdmin from './supabaseAdmin';

const FIRST_POST_BADGE_NAME = 'First Post';
const MINECRAFT_BADGE_NAME = 'Redstone Tinkerer';
const MINECRAFT_TAG_SLUG = 'minecraft';

type UserBadgesInsert = TablesInsert<'user_badges'>;

const badgeIdCache = new Map<string, string>();

function getClient(client?: SupabaseClient<Database>) {
  return client ?? supabaseAdmin();
}

async function resolveBadgeId(
  client: SupabaseClient<Database>,
  badgeName: string,
): Promise<string | null> {
  const cached = badgeIdCache.get(badgeName);
  if (cached) return cached;

  const { data, error } = await client
    .from('badges')
    .select('id')
    .eq('name', badgeName)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load badge "${badgeName}": ${error.message}`);
  }

  if (!data?.id) {
    console.warn(`[badges] Badge "${badgeName}" not found; skipping award.`);
    return null;
  }

  badgeIdCache.set(badgeName, data.id);
  return data.id;
}

async function awardBadgeIfNeeded(
  client: SupabaseClient<Database>,
  payload: UserBadgesInsert,
  badgeName: string,
): Promise<boolean> {
  const { data, error } = await client
    .from('user_badges')
    .upsert(payload, {
      onConflict: 'user_id,badge_id',
      ignoreDuplicates: true,
    })
    .select('user_id');

  if (error) {
    throw new Error(`Failed to award badge "${badgeName}": ${error.message}`);
  }

  const awarded = Array.isArray(data) && data.length > 0;
  if (awarded) {
    console.log('[badges] Awarded badge', {
      badge: badgeName,
      userId: payload.user_id,
    });
  }
  return awarded;
}

export async function checkAndAwardForPost(
  userId: string,
  client?: SupabaseClient<Database>,
): Promise<boolean> {
  const sb = getClient(client);

  const { count, error } = await sb
    .from('posts')
    .select('id', { count: 'exact', head: true })
    .eq('author', userId)
    .eq('status', 'approved');

  if (error) {
    throw new Error(`Failed to count approved posts: ${error.message}`);
  }

  if ((count ?? 0) < 1) {
    return false;
  }

  const badgeId = await resolveBadgeId(sb, FIRST_POST_BADGE_NAME);
  if (!badgeId) return false;

  return awardBadgeIfNeeded(
    sb,
    {
      user_id: userId,
      badge_id: badgeId,
    },
    FIRST_POST_BADGE_NAME,
  );
}

export async function checkAndAwardForMinecraftPosts(
  userId: string,
  client?: SupabaseClient<Database>,
): Promise<boolean> {
  const sb = getClient(client);

  const { count, error } = await sb
    .from('posts')
    .select('id, post_tags!inner(tags!inner(slug))', {
      head: true,
      count: 'exact',
    })
    .eq('author', userId)
    .eq('status', 'approved')
    .eq('post_tags.tags.slug', MINECRAFT_TAG_SLUG);

  if (error) {
    throw new Error(`Failed to count Minecraft posts: ${error.message}`);
  }

  if ((count ?? 0) < 3) {
    return false;
  }

  const badgeId = await resolveBadgeId(sb, MINECRAFT_BADGE_NAME);
  if (!badgeId) return false;

  return awardBadgeIfNeeded(
    sb,
    {
      user_id: userId,
      badge_id: badgeId,
    },
    MINECRAFT_BADGE_NAME,
  );
}
