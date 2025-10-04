import type { SupabaseClient } from '@supabase/supabase-js';
import supabaseAdmin from '@/lib/supabaseAdmin';
import type { Database, TablesRow } from '@/lib/database.types';

type BadgeRow = Pick<TablesRow<'badges'>, 'id' | 'name' | 'criteria'>;
type UserBadgeRow = Pick<TablesRow<'user_badges'>, 'badge_id'>;

type ProgressType =
  | 'post_count'
  | 'minecraft_tag_posts'
  | 'project_posts'
  | 'daily_streak';

type BadgeCriteriaDetails = {
  type: string | null;
  threshold: number | null;
};

type ProgressPostRow = Pick<TablesRow<'posts'>, 'id' | 'published_at' | 'created_at'> & {
  post_tags?: { tags: { slug: string | null } | null }[] | null;
};

export type BadgeAward = { badgeId: string; badgeName: string };

const TRACKED_TYPES = new Set<ProgressType>([
  'post_count',
  'minecraft_tag_posts',
  'project_posts',
  'daily_streak',
]);

type Clients = {
  userId: string;
  reader: SupabaseClient<Database>;
  writer?: SupabaseClient<Database>;
};

export async function checkAndAwardBadgesForUser({
  userId,
  reader,
  writer,
}: Clients): Promise<BadgeAward[]> {
  const [{ data: badgesData, error: badgesError }, { data: earnedData, error: earnedError }] 
    = await Promise.all([
      reader.from('badges').select('id, name, criteria'),
      reader
        .from('user_badges')
        .select('badge_id')
        .eq('user_id', userId),
    ]);

  if (badgesError) {
    throw new Error(`[badges/check-award] Failed to load badges: ${badgesError.message}`);
  }

  if (earnedError) {
    throw new Error(`[badges/check-award] Failed to load existing badges: ${earnedError.message}`);
  }

  const badges: BadgeRow[] = badgesData ?? [];
  if (badges.length === 0) {
    return [];
  }

  const alreadyEarned = new Set((earnedData ?? []).map((row: UserBadgeRow) => row.badge_id));
  const parsedCriteria = new Map<string, BadgeCriteriaDetails>();
  const neededTypes = new Set<ProgressType>();

  for (const badge of badges) {
    const details = parseBadgeCriteria(badge.criteria);
    parsedCriteria.set(badge.id, details);

    if (alreadyEarned.has(badge.id)) continue;

    const type = details.type as ProgressType | null;
    if (!type || !TRACKED_TYPES.has(type)) continue;
    if (!details.threshold || details.threshold <= 0) continue;

    neededTypes.add(type);
  }

  const progressByType: Record<ProgressType, number | null> = {
    post_count: null,
    minecraft_tag_posts: null,
    project_posts: null,
    daily_streak: null,
  };

  if (neededTypes.size > 0) {
    const { data: postsData, error: postsError } = await reader
      .from('posts')
      .select('id, published_at, created_at, post_tags:post_tags(tags(slug))')
      .eq('author', userId)
      .eq('status', 'approved');

    if (postsError) {
      console.error('[badges/check-award] Failed to load user posts', postsError);
    } else {
      const posts = (postsData ?? []) as ProgressPostRow[];

      if (neededTypes.has('post_count')) {
        progressByType.post_count = posts.length;
      }

      if (neededTypes.has('minecraft_tag_posts') || neededTypes.has('project_posts')) {
        let minecraftCount = 0;
        let projectCount = 0;

        for (const post of posts) {
          const slugs = extractTagSlugs(post);
          if (neededTypes.has('minecraft_tag_posts') && slugs.has('minecraft')) {
            minecraftCount += 1;
          }
          if (
            neededTypes.has('project_posts') &&
            (slugs.has('project') || slugs.has('projects'))
          ) {
            projectCount += 1;
          }
        }

        if (neededTypes.has('minecraft_tag_posts')) {
          progressByType.minecraft_tag_posts = minecraftCount;
        }
        if (neededTypes.has('project_posts')) {
          progressByType.project_posts = projectCount;
        }
      }

      if (neededTypes.has('daily_streak')) {
        progressByType.daily_streak = calculateLongestDailyStreak(posts);
      }
    }
  }

  const newlyAwarded: BadgeAward[] = [];
  let writerClient = writer ?? null;

  for (const badge of badges) {
    if (alreadyEarned.has(badge.id)) continue;

    const details = parsedCriteria.get(badge.id) ?? { type: null, threshold: null };
    const type = details.type as ProgressType | null;
    const threshold = details.threshold ?? null;

    if (!type || !TRACKED_TYPES.has(type)) continue;
    if (!threshold || threshold <= 0) continue;

    const progressValue = progressByType[type];
    if (progressValue == null || progressValue < threshold) continue;

    try {
      writerClient = writerClient ?? supabaseAdmin();

      const { data: insertData, error: insertError } = await writerClient
        .from('user_badges')
        .upsert(
          {
            user_id: userId,
            badge_id: badge.id,
            awarded_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,badge_id', ignoreDuplicates: true },
        )
        .select('badge_id');

      if (insertError) {
        console.error('[badges/check-award] Failed to award badge', {
          badgeId: badge.id,
          error: insertError,
        });
        continue;
      }

      if (Array.isArray(insertData) && insertData.length > 0) {
        console.info('[badges/check-award] Awarded badge', {
          badgeId: badge.id,
          badgeName: badge.name,
          userId,
        });
        newlyAwarded.push({ badgeId: badge.id, badgeName: badge.name ?? 'Badge' });
        alreadyEarned.add(badge.id);
      }
    } catch (error) {
      console.error('[badges/check-award] Unexpected error awarding badge', {
        badgeId: badge.id,
        error,
      });
    }
  }

  return newlyAwarded;
}

function parseBadgeCriteria(raw: BadgeRow['criteria']): BadgeCriteriaDetails {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { type: null, threshold: null };
  }

  const criteria = raw as Record<string, unknown>;
  const type = typeof criteria.type === 'string' ? criteria.type : null;

  let threshold: number | null = null;
  if (typeof criteria.threshold === 'number') {
    threshold = criteria.threshold;
  } else if (criteria.threshold != null) {
    const parsed = Number(criteria.threshold);
    if (Number.isFinite(parsed)) {
      threshold = parsed;
    }
  }

  return { type, threshold };
}

function extractTagSlugs(post: ProgressPostRow): Set<string> {
  const slugs = new Set<string>();
  for (const entry of post.post_tags ?? []) {
    const slug = entry.tags?.slug;
    if (typeof slug === 'string' && slug.trim()) {
      slugs.add(slug.toLowerCase());
    }
  }
  return slugs;
}

function calculateLongestDailyStreak(posts: ProgressPostRow[]): number {
  if (posts.length === 0) return 0;

  const dayMs = 24 * 60 * 60 * 1000;
  const uniqueDays = new Set<string>();

  for (const post of posts) {
    const raw = post.published_at ?? post.created_at;
    if (!raw) continue;
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) continue;
    uniqueDays.add(date.toISOString().slice(0, 10));
  }

  if (uniqueDays.size === 0) return 0;

  const sortedDays = Array.from(uniqueDays).sort();
  let longest = 1;
  let current = 1;

  for (let i = 1; i < sortedDays.length; i += 1) {
    const prev = new Date(`${sortedDays[i - 1]}T00:00:00Z`).getTime();
    const cur = new Date(`${sortedDays[i]}T00:00:00Z`).getTime();
    const diff = Math.round((cur - prev) / dayMs);

    if (diff === 1) {
      current += 1;
    } else {
      current = 1;
    }
    longest = Math.max(longest, current);
  }

  return longest;
}
