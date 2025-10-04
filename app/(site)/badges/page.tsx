import Link from 'next/link';
import supabaseServer from '@/lib/supabaseServer';
import type { TablesRow } from '@/lib/database.types';
import { resolveBadgeIcon } from '@/lib/badgeIcons';
import { AwardBadgeButton } from './AwardBadgeButton';
import { SelfAwardDevButton } from './SelfAwardDevButton';
import CheckBadgeProgressButton from './CheckBadgeProgressButton';

type BadgeRow = TablesRow<'badges'>;
type UserBadgeRow = TablesRow<'user_badges'>;

type BadgeTier = 'emerald' | 'diamond' | 'gold' | 'iron' | null;
type ProgressType = 'post_count' | 'minecraft_tag_posts' | 'project_posts' | 'daily_streak';

const TRACKED_CRITERIA_TYPES = new Set<ProgressType>([
  'post_count',
  'minecraft_tag_posts',
  'project_posts',
  'daily_streak',
]);

type BadgeCriteriaDetails = {
  type: string | null;
  threshold: number | null;
};

type ProgressQueryRow = {
  id: string;
  published_at: string | null;
  created_at: string | null;
  post_tags?: { tags: { slug: string | null } | null }[] | null;
};

function determineBadgeTier(name: string): BadgeTier {
  const normalized = name.toLowerCase();
  if (normalized.includes('emerald')) return 'emerald';
  if (normalized.includes('diamond')) return 'diamond';
  if (normalized.includes('gold')) return 'gold';
  if (normalized.includes('iron')) return 'iron';
  return null;
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

function buildCriteriaSummary(details: BadgeCriteriaDetails): string | null {
  const { type, threshold } = details;
  if (!type) return null;

  switch (type) {
    case 'post_count':
      return threshold && threshold > 1
        ? `Publish ${threshold} posts to earn this badge.`
        : 'Publish your first post to earn this badge.';
    case 'location_posts':
      return threshold && threshold > 1
        ? `Share adventures from ${threshold} different places.`
        : 'Share an adventure story to earn this badge.';
    case 'minecraft_tag_posts':
      return threshold && threshold > 1
        ? `Post ${threshold} Minecraft-tagged stories.`
        : 'Post a Minecraft-tagged story to earn this badge.';
    case 'project_posts':
      return threshold && threshold > 1
        ? `Document ${threshold} projects or builds.`
        : 'Document a project or build to earn this badge.';
    case 'daily_streak':
      return threshold && threshold > 1
        ? `Post daily for ${threshold} days in a row.`
        : 'Post daily for a short streak to earn this badge.';
    default:
      return 'Complete the special challenge to earn this badge.';
  }
}

function calculateLongestDailyStreak(posts: ProgressQueryRow[]): number {
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

function extractTagSlugs(post: ProgressQueryRow): Set<string> {
  const slugs = new Set<string>();
  for (const entry of post.post_tags ?? []) {
    const slug = entry.tags?.slug;
    if (typeof slug === 'string' && slug.trim()) {
      slugs.add(slug.toLowerCase());
    }
  }
  return slugs;
}

function formatAwardedAt(awardedAt: string | null) {
  if (!awardedAt) return null;
  const parsed = new Date(awardedAt);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default async function BadgesPage() {
  const sb = supabaseServer();

  const {
    data: { user } = { user: null },
  } = await sb.auth.getUser();

  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.toLowerCase() ?? null;
  const userId = user?.id ?? null;
  const isAdmin = Boolean(
    adminEmail && user?.email && user.email.toLowerCase() === adminEmail,
  );

  const {
    data: badgesData,
    error: badgesError,
  } = await sb
    .from('badges')
    .select('id, name, description, icon, criteria')
    .order('name', { ascending: true });

  if (badgesError) {
    console.error('[badges/page] Failed to fetch badges', badgesError);
  }

  let userBadges: UserBadgeRow[] = [];
  let userBadgesErrored = false;

  if (userId) {
    const { data, error } = await sb
      .from('user_badges')
      .select('user_id, badge_id, awarded_at')
      .eq('user_id', userId);

    if (error) {
      userBadgesErrored = true;
      console.error('[badges/page] Failed to fetch user badges', error);
    } else if (data) {
      userBadges = data;
    }
  }

  const earnedByBadgeId = new Map(
    userBadges.map((entry) => [entry.badge_id, entry] as const),
  );

  const badges: BadgeRow[] = badgesData ?? [];
  const hasBadges = badges.length > 0;

  const isLoggedIn = Boolean(userId);
  const isDev = process.env.NODE_ENV !== 'production';

  const progressByType: Record<ProgressType, number | null> = {
    post_count: null,
    minecraft_tag_posts: null,
    project_posts: null,
    daily_streak: null,
  };

  if (isLoggedIn && hasBadges) {
    const neededTypes = new Set<ProgressType>();

    for (const badge of badges) {
      if (earnedByBadgeId.has(badge.id)) continue;
      const criteria = parseBadgeCriteria(badge.criteria);
      const type = criteria.type as ProgressType | null;
      if (!type || !TRACKED_CRITERIA_TYPES.has(type)) continue;
      if (!criteria.threshold || criteria.threshold <= 0) continue;
      neededTypes.add(type);
    }

    if (neededTypes.size > 0) {
      const {
        data: progressData,
        error: progressError,
      } = await sb
        .from('posts')
        .select('id, published_at, created_at, post_tags:post_tags(tags(slug))')
        .eq('author', userId as string)
        .eq('status', 'approved');

      if (progressError) {
        console.error('[badges/page] Failed to compute badge progress', progressError);
      } else {
        const posts = (progressData ?? []) as ProgressQueryRow[];

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
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-mc text-xl sm:text-2xl">Badges</h1>
        <p className="text-sm text-mc-stone">
          Celebrate accomplishments across posts, projects, and family adventures.
        </p>
        {!isLoggedIn && (
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="text-mc-ink/80">
              Log in to see which badges you&apos;ve unlocked.
            </span>
            <Link href="/login" className="btn-mc-secondary">
              Log in
            </Link>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          {isDev && isLoggedIn && hasBadges && (
            <SelfAwardDevButton
              badgeId={badges[0]?.id ?? null}
              badgeName={badges[0]?.name ?? null}
            />
          )}
          {isLoggedIn && <CheckBadgeProgressButton />}
        </div>
      </header>

      {badgesError ? (
        <div className="card-block border border-red-400 bg-red-50 text-red-700">
          We couldn&apos;t load badges right now. Please try again later.
        </div>
      ) : !hasBadges ? (
        <div className="card-block text-sm text-mc-stone">
          Badges will appear here once they&apos;re configured.
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {badges.map((badge) => {
            const earned = earnedByBadgeId.get(badge.id);
            const awardedLabel = formatAwardedAt(earned?.awarded_at ?? null);
            const icon = resolveBadgeIcon(badge.icon);
            const criteriaDetails = parseBadgeCriteria(badge.criteria);
            const criteriaSummary = buildCriteriaSummary(criteriaDetails);
            const tier = determineBadgeTier(badge.name ?? '');
            const cardClasses = [
              'card-block badge-card space-y-3 relative flex h-full flex-col',
              earned ? 'badge-card-earned' : 'badge-card-locked',
            ].join(' ');
            const iconClasses = [
              'badge-icon',
              earned ? 'badge-icon-earned' : 'badge-icon-locked',
            ].join(' ');
            const criteriaType = criteriaDetails.type as ProgressType | null;
            const threshold = criteriaDetails.threshold ?? null;
            const isTrackedType = Boolean(
              criteriaType && TRACKED_CRITERIA_TYPES.has(criteriaType as ProgressType),
            );
            const progressValue =
              isTrackedType && criteriaType
                ? progressByType[criteriaType as ProgressType]
                : null;
            const showProgress =
              isLoggedIn &&
              !earned &&
              isTrackedType &&
              typeof threshold === 'number' &&
              threshold > 0;
            const effectiveThreshold = showProgress ? (threshold as number) : null;
            const clampedPercent = effectiveThreshold
              ? Math.max(
                  0,
                  Math.min(100, ((progressValue ?? 0) / effectiveThreshold) * 100),
                )
              : 0;

            return (
              <li key={badge.id} className={cardClasses}>
                {tier && (
                  <span
                    className={`badge-ribbon badge-ribbon-${tier.toLowerCase()}`}
                    aria-hidden
                  />
                )}
                <div className="flex flex-wrap items-start gap-3">
                  <span className={iconClasses} aria-hidden>
                    {icon}
                  </span>
                  <div className="flex-1 space-y-2 min-w-[55%]">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold text-base sm:text-lg badge-title">
                        {badge.name}
                      </h2>
                      <span
                        className={`badge-status-chip ${earned ? 'badge-status-earned' : 'badge-status-locked'}`}
                      >
                        {earned ? 'Earned ✓' : 'Locked'}
                      </span>
                      {isAdmin && badge.id && (
                        <AwardBadgeButton
                          badgeId={badge.id}
                          badgeName={badge.name ?? 'Badge'}
                        />
                      )}
                    </div>
                    {badge.description && (
                      <p className="badge-description">
                        {badge.description}
                      </p>
                    )}
                    {criteriaSummary && (
                      <div className="flex flex-wrap items-center gap-2 badge-criteria">
                        <span className="font-semibold uppercase tracking-wide text-[0.65rem] text-mc-stone">
                          How to earn
                        </span>
                        <span
                          className="badge-tooltip-trigger"
                          title={criteriaSummary}
                          aria-label={`${badge.name ?? 'This badge'}: ${criteriaSummary}`}
                          tabIndex={0}
                        >
                          ?
                        </span>
                        <span className="text-mc-stone/80 text-xs" aria-hidden>
                          {criteriaSummary}
                        </span>
                      </div>
                    )}
                    {showProgress && effectiveThreshold != null && (
                      <div className="badge-progress">
                        <div className="badge-progress-meta">
                          <span>Progress</span>
                          <span className="badge-progress-value">
                            {progressValue != null
                              ? `${progressValue} / ${effectiveThreshold}`
                              : `— / ${effectiveThreshold}`}
                          </span>
                        </div>
                        <div className="badge-progress-bar" aria-hidden>
                          <span
                            className="badge-progress-fill"
                            style={{ width: `${clampedPercent}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {earned && awardedLabel && (
                  <p className="text-xs text-mc-stone">
                    Awarded on {awardedLabel}
                  </p>
                )}
                {!earned && userBadgesErrored && (
                  <p className="text-xs text-red-600">
                    We couldn&apos;t check your progress. Refresh to try again.
                  </p>
                )}
                {!earned && !isLoggedIn && (
                  <p className="text-xs text-mc-stone">
                    Sign in to start collecting badges.
                  </p>
                )}
                <span className="badge-card-outline mt-0" aria-hidden />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
