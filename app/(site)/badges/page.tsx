import Link from 'next/link';
import supabaseServer from '@/lib/supabaseServer';
import type { TablesRow } from '@/lib/database.types';
import { resolveBadgeIcon } from '@/lib/badgeIcons';
import { AwardBadgeButton } from './AwardBadgeButton';
import { SelfAwardDevButton } from './SelfAwardDevButton';

type BadgeRow = TablesRow<'badges'>;
type UserBadgeRow = TablesRow<'user_badges'>;

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

function summarizeCriteria(raw: BadgeRow['criteria']): string | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return null;
  }

  const criteria = raw as Record<string, unknown>;
  const type = typeof criteria.type === 'string' ? criteria.type : null;
  const threshold =
    typeof criteria.threshold === 'number' ? criteria.threshold : Number(criteria.threshold);

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

export default async function BadgesPage() {
  const sb = supabaseServer();

  const {
    data: { user } = { user: null },
  } = await sb.auth.getUser();

  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.toLowerCase() ?? null;
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

  if (user?.id) {
    const { data, error } = await sb
      .from('user_badges')
      .select('badge_id, awarded_at')
      .eq('user_id', user.id);

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

  const isLoggedIn = Boolean(user?.id);
  const isDev = process.env.NODE_ENV !== 'production';

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
        {isDev && isLoggedIn && hasBadges && (
          <SelfAwardDevButton
            badgeId={badges[0]?.id ?? null}
            badgeName={badges[0]?.name ?? null}
          />
        )}
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
            const criteriaSummary = summarizeCriteria(badge.criteria);
            const cardClasses = 'card-block space-y-3';
            const iconClasses = `text-3xl ${earned ? 'badge-earned-icon' : 'badge-locked-icon'}`;

            return (
              <li key={badge.id} className={cardClasses}>
                <div className="flex items-start gap-3">
                  <span className={iconClasses} aria-hidden>
                    {icon}
                  </span>
                  <div className="flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold text-base sm:text-lg">
                        {badge.name}
                      </h2>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                          earned
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-200 text-slate-600'
                        }`}
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
                      <p className="text-sm text-mc-stone">
                        {badge.description}
                      </p>
                    )}
                    {criteriaSummary && (
                      <div className="flex flex-wrap items-center gap-2 text-xs text-mc-stone">
                        <span className="font-semibold uppercase tracking-wide">
                          How to earn
                        </span>
                        <span
                          className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-mc-sand text-mc-dirt/90 cursor-help"
                          title={criteriaSummary}
                          aria-label={`${badge.name ?? 'This badge'}: ${criteriaSummary}`}
                        >
                          ?
                        </span>
                        <span className="text-mc-stone/80">{criteriaSummary}</span>
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
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
