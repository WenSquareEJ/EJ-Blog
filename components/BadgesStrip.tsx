import React from 'react';
import supabaseServer from '@/lib/supabaseServer';
import { resolveBadgeIcon } from '@/lib/badgeIcons';

// Helper to resolve Erik's user id
async function getErikUserId(): Promise<string | null> {
  const envId = process.env.NEXT_PUBLIC_ERIK_USER_ID;
  if (envId) return envId;
  // Replicate logic from /badges page
  const ERIK_EMAIL = 'erik.ys.johansson@gmail.com'.toLowerCase();
  try {
    const sbAdmin = supabaseServer();
    const { data, error } = await sbAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (error) return null;
    const users = data?.users ?? [];
    const match = users.find((u) => u.email?.toLowerCase() === ERIK_EMAIL);
    return match?.id ?? null;
  } catch {
    return null;
  }
}

export type WidgetBadge = {
  id: string;
  name: string;
  icon: React.ReactNode;
  awarded_at: string;
};

export default async function BadgesStrip() {
  const erikUserId = await getErikUserId();
  if (!erikUserId) {
    return (
      <div className="badge-strip-card">
        <span className="text-mc-stone text-sm">No badges yet</span>
      </div>
    );
  }

  // Fetch all badges and Erik's earned badges
  const sb = supabaseServer();
  const { data: badgesData } = await sb.from('badges').select('id, name, icon').order('name', { ascending: true });
  const { data: userBadgesData } = await sb.from('user_badges').select('badge_id, awarded_at').eq('user_id', erikUserId);

  if (!badgesData || !userBadgesData) {
    return (
      <div className="badge-strip-card">
        <span className="text-mc-stone text-sm">No badges yet</span>
      </div>
    );
  }

  // Map earned badges
  const earnedMap = new Map<string, { awarded_at: string }>(
    userBadgesData.map(b => [b.badge_id, { awarded_at: b.awarded_at ?? '' }])
  );
  const earnedBadges: WidgetBadge[] = badgesData
    .filter(b => earnedMap.has(b.id))
    .map(b => ({
      id: b.id,
      name: b.name,
      icon: resolveBadgeIcon(b.icon) ?? '🏅',
      awarded_at: earnedMap.get(b.id)?.awarded_at ?? '',
    }))
    .sort((a, b) => {
      // Sort by awarded_at desc, then name
      const dateA = a.awarded_at ? new Date(a.awarded_at).getTime() : 0;
      const dateB = b.awarded_at ? new Date(b.awarded_at).getTime() : 0;
      if (dateA !== dateB) return dateB - dateA;
      return a.name.localeCompare(b.name);
    });

  const maxIcons = 10;
  const visibleBadges = earnedBadges.slice(0, maxIcons);
  const extraCount = earnedBadges.length - visibleBadges.length;

  return (
    <div className="badge-strip-card">
      <div className="badge-strip-row" role="list">
        {visibleBadges.map(badge => (
          <span
            key={badge.id}
            className="badge-strip-icon"
            title={badge.name}
            aria-label={badge.name}
            role="listitem"
          >
            {badge.icon}
            <span className="sr-only">{badge.name}</span>
          </span>
        ))}
        {extraCount > 0 && (
          <span className="badge-strip-extra" title={`+${extraCount} more badges`}>
            +{extraCount}
          </span>
        )}
      </div>
      <a href="/badges" className="badge-strip-link">View all</a>
    </div>
  );
}
