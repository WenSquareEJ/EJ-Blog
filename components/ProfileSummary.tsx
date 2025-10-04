import Link from "next/link";
import { resolveBadgeIcon } from "@/lib/badgeIcons";

type ProfileBadge = {
  id: string;
  name: string;
  icon: string | null;
  awardedAt: string | null;
};

type ProfileSummaryProps = {
  userEmail: string | null;
  recentBadges: ProfileBadge[];
  errorMessage?: string | null;
  className?: string;
};

export default function ProfileSummary({
  userEmail,
  recentBadges,
  errorMessage,
  className,
}: ProfileSummaryProps) {
  const wrapperClassName = ["card-block space-y-4", className]
    .filter(Boolean)
    .join(" ");

  return (
    <section className={wrapperClassName}>
      <div className="space-y-1">
        <h2 className="font-mc text-2xl">Your Badge Showcase</h2>
        {userEmail && (
          <p className="text-xs text-mc-stone">Signed in as {userEmail}</p>
        )}
        <p className="text-sm text-mc-ink/80">
          Highlights from your latest adventures and creations.
        </p>
      </div>

      {errorMessage ? (
        <p className="text-sm text-red-500">{errorMessage}</p>
      ) : recentBadges.length === 0 ? (
        <p className="text-sm text-mc-stone">
          No badges yet—share a new story and earn your first decoration.
        </p>
      ) : (
        <ul className="space-y-2">
          {recentBadges.map((badge) => {
            const icon = resolveBadgeIcon(badge.icon);
            const dateLabel = formatAwardedDate(badge.awardedAt);

            return (
              <li
                key={badge.id}
                className="flex items-center gap-3 rounded border border-mc-wood-dark/40 bg-mc-wood/15 px-3 py-2"
              >
                <span className="text-2xl" aria-hidden>
                  {icon}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-mc text-sm">{badge.name}</p>
                  {dateLabel ? (
                    <p className="text-xs text-mc-stone">Earned on {dateLabel}</p>
                  ) : (
                    <p className="text-xs text-mc-stone/70">Earned recently</p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex flex-wrap gap-2">
        <Link href="/badges" className="btn-mc-secondary">
          View all badges
        </Link>
        <Link href="/post/new" className="btn-mc-secondary">
          Share a new story
        </Link>
      </div>
    </section>
  );
}

function formatAwardedDate(awardedAt: string | null) {
  if (!awardedAt) return null;
  const date = new Date(awardedAt);
  if (!Number.isFinite(date.getTime())) return null;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
