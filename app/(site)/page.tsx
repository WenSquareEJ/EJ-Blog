import PortalRoom from "@/components/PortalRoom";
// Defensive helpers
const safeMap = <T, R>(arr: T[] | null | undefined, fn: (t:T)=>R): R[] => Array.isArray(arr) ? arr.map(fn) : [];
const isValidISO = (s: string | null | undefined) => !!s && !Number.isNaN(new Date(s).getTime());

function getErikIdFromEnv(): string | null {
  const id = process.env.NEXT_PUBLIC_ERIK_USER_ID?.trim();
  return id && id.length > 0 ? id : null;
}
import supabaseServer from "@/lib/supabaseServer";
import type { TablesRow } from "@/lib/database.types";
import { extractPostContent, buildExcerpt } from "@/lib/postContent";
import PixelBackground from "@/components/PixelBackground";
import AvatarTile from "@/components/AvatarTile";
import XPBar from "@/components/XPBar";
import ParrotSprite from "@/components/ParrotSprite";
import Link from "next/link";
/* --- Home: Erik’s earned badges (public icons-only widget) --- */
let homeBadgeIcons: HomeBadgeIcon[] = [];

try {
  const admin = supabaseAdmin();
  const erikId = await getErikUserId(); // already implemented in lib/erik

  if (erikId) {
    // 1) Get earned badge ids for Erik
    const { data: earnedRows, error: earnedErr } = await admin
      .from("user_badges")
      .select("badge_id, awarded_at")
      .eq("user_id", erikId);

    if (!earnedErr && earnedRows?.length) {
      const badgeIds = earnedRows.map(r => r.badge_id).filter(Boolean);

      // 2) Load badge names + icon keys
      const { data: badgeRows, error: badgeErr } = await admin
      .from("badges")
      .select("id, name, icon")
      .in("id", badgeIds);

      if (!badgeErr && badgeRows) {
        homeBadgeIcons = badgeRows
          .map(b => ({
            id: b.id,
            name: b.name ?? "Badge",
            icon: resolveBadgeIcon(b.icon) // returns a React node; never null
          }))
          .sort((a, b) => a.name.localeCompare(b.name));
      }
    }
  }
} catch (e) {
  if (process.env.NODE_ENV !== "production") {
    console.warn("[home] failed to load Erik's badges for widget", e);
  }
}



import supabaseAdmin from "@/lib/supabaseAdmin";
import { resolveBadgeIcon } from "@/lib/badgeIcons";
// import { getErikProfileAvatar, getErikUserId } from "@/lib/erik";
import { getErikProfileAvatar, getErikUserId } from "@/lib/erik";

type HomeBadgeIcon = {
  id: string;
  name: string;
  icon: React.ReactNode;
};

const MESSAGE_WALL_LIMIT = 3;
const HUB_SUBTITLE = "Welcome to the base camp for Erik's stories, games, and projects.";
const MINECRAFT_TAG_SLUG = "minecraft";

type PostSummary = {
  id: string;
  title: string;
  excerpt: string;
  publishedAt: string | null;
};
type MiniPost = {
  id: string;
  title: string;
  publishedAt: string | null;
};
type ScratchPreview = {
  id: string;
  title: string;
  createdAt: string | null;
};
type WidgetBadge = {
  id: string;
  name: string;
  icon: string | null;
  description: string | null;
  criteriaSummary: string | null;
  awardedAt: string | null;
  status: "earned" | "locked";
};
type ModerationSnapshot = {
  pendingPosts: number | null;
  pendingComments: number | null;
  error: string | null;
};

function formatDateLabel(isoDate: string | null | undefined): string | null {
  if (!isoDate) return null;
  const value = new Date(isoDate);
  if (!Number.isFinite(value.getTime())) return null;
  return value.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
function getPostTimestamp(row: { published_at: string | null; created_at: string | null }) {
  return row.published_at ?? row.created_at ?? null;
}
function parseBadgeCriteria(raw: any): { type: string | null; threshold: number | null } {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { type: null, threshold: null };
  }
  const criteria = raw as Record<string, unknown>;
  const type = typeof criteria.type === "string" ? criteria.type : null;
  let threshold: number | null = null;
  if (typeof criteria.threshold === "number") {
    threshold = criteria.threshold;
  } else if (criteria.threshold != null) {
    const parsed = Number(criteria.threshold);
    if (Number.isFinite(parsed)) {
      threshold = parsed;
    }
  }
  return { type, threshold };
}
function buildBadgeCriteriaSummary(details: { type: string | null; threshold: number | null }): string | null {
  const { type, threshold } = details;
  if (!type) return null;
  switch (type) {
    case "post_count":
      return threshold && threshold > 1
        ? `Publish ${threshold} posts to earn this badge.`
        : "Publish your first post to earn this badge.";
    case "minecraft_tag_posts":
      return threshold && threshold > 1
        ? `Post ${threshold} Minecraft-tagged stories.`
        : "Post a Minecraft-tagged story to earn this badge.";
    case "project_posts":
      return threshold && threshold > 1
        ? `Document ${threshold} projects or builds.`
        : "Document a project or build to earn this badge.";
    case "daily_streak":
      return threshold && threshold > 1
        ? `Post daily for ${threshold} days in a row.`
        : "Post daily for a short streak to earn this badge.";
    case "location_posts":
      return threshold && threshold > 1
        ? `Share adventures from ${threshold} different places.`
        : "Share an adventure story to earn this badge.";
    default:
      return "Complete the special challenge to earn this badge.";
  }
}
function formatErikBadgeAwardedAt(isoDate: string | null): string | null {
  if (!isoDate) return null;
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function Page() {
  console.log('[home] render start');

  // Get Erik's avatar
  let avatarUrl: string = "/assets/avatars/steve.png";
  try {
    const avatarUrlRaw = await getErikProfileAvatar();
    if (avatarUrlRaw && typeof avatarUrlRaw === 'string' && avatarUrlRaw.length > 0) {
      avatarUrl = avatarUrlRaw;
    }
  } catch (error) {
    console.error('[home] avatar fetch failed', error);
  }

  // Supabase server client
  const sb = supabaseServer();

  // Auth block
  let user: any = null;
  let isAdmin = false;
  let adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.toLowerCase() ?? "";
  try {
    const { data: userRes } = await sb.auth.getUser();
    user = userRes?.user ?? null;
    isAdmin = user?.email?.toLowerCase() === adminEmail;
  } catch (error) {
    console.error('[home] auth.getUser failed', error);
  }


  // Scratch projects
  let scratchProjects: ScratchPreview[] = [];
  let scratchError: string | null = null;
  try {
    const { data: scratchData, error: scratchFetchError } = await sb
      .from("scratch_projects")
      .select("id, title, created_at")
      .order("created_at", { ascending: false })
      .limit(3);
    if (scratchFetchError) throw scratchFetchError;
    scratchProjects = ((scratchData ?? []) as TablesRow<"scratch_projects">[]).map(project => ({
      id: project.id,
      title: project.title?.trim() || "Untitled",
      createdAt: project.created_at ?? null,
    }));
  } catch (error) {
    console.error('[home] scratch projects failed', error);
    scratchError = "Unable to load Scratch projects.";
  }
  console.log('[home] scratch projects:', scratchProjects.length);

  // Latest posts
  let latestPosts: PostSummary[] = [];
  let latestPostsError: string | null = null;
  try {
    const { data: latestData, error: latestError } = await sb
      .from("posts")
      .select("id, title, content, content_html, published_at, created_at")
      .eq("status", "approved")
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(MESSAGE_WALL_LIMIT);
    if (latestError) throw latestError;
    latestPosts = ((latestData ?? []) as TablesRow<"posts">[]).map(post => {
      const { text } = extractPostContent({ content_html: post.content_html, content: post.content });
      return {
        id: post.id,
        title: post.title || "Untitled",
        excerpt: buildExcerpt(text),
        publishedAt: getPostTimestamp(post),
      };
    });
  } catch (error) {
    console.error('[home] latest posts failed', error);
    latestPostsError = "Unable to load latest posts.";
  }
  console.log('[home] latest posts:', latestPosts.length);

  // Minecraft posts
  let minecraftPosts: MiniPost[] = [];
  let minecraftError: string | null = null;
  try {
    const { data: minecraftTag, error: minecraftTagError } = await sb
      .from("tags")
      .select("id")
      .eq("slug", MINECRAFT_TAG_SLUG)
      .maybeSingle();
    if (minecraftTagError) throw minecraftTagError;
    if (minecraftTag) {
      const { data: minecraftData, error: minecraftPostsError } = await sb
        .from("posts")
        .select("id, title, published_at, created_at, post_tags:post_tags!inner(tag_id)")
        .eq("status", "approved")
        .eq("post_tags.tag_id", minecraftTag.id)
        .order("published_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(3);
      if (minecraftPostsError) throw minecraftPostsError;
      minecraftPosts = ((minecraftData ?? []) as Array<{ id: string; title: string | null; published_at: string | null; created_at: string | null }> ).map(post => ({
        id: post.id,
        title: post.title || "Untitled",
        publishedAt: getPostTimestamp({ published_at: post.published_at, created_at: post.created_at }),
      }));
    }
  } catch (error) {
    console.error('[home] minecraft posts failed', error);
    minecraftError = "Unable to load Minecraft posts.";
  }
  console.log('[home] minecraft posts:', minecraftPosts.length);

  // Badges widget
  let widgetBadges: WidgetBadge[] = [];
  let badgesError: string | null = null;
  let earnedBadges: WidgetBadge[] = [];
  const ERIK_ID = getErikIdFromEnv();
  let erikCollectionUnavailable = !ERIK_ID;
  if (!ERIK_ID) {
    console.warn('[home] NEXT_PUBLIC_ERIK_USER_ID missing — skipping Erik widgets');
  }
  try {
    if (!ERIK_ID) {
      widgetBadges = [];
    } else {
      const { data: badgesData, error: badgesFetchError } = await sb
        .from("badges")
        .select("id, name, icon, description, criteria")
        .order("name", { ascending: true });
      if (badgesFetchError) throw badgesFetchError;
      const allBadges = safeMap(badgesData, badge => badge).filter(badge => Boolean(badge.id));
      let erikUserBadges: { badge_id: string; awarded_at: string | null }[] = [];
      try {
        const { data: erikBadgesData, error: erikBadgesFetchError } = await sb
          .from("user_badges")
          .select("badge_id, awarded_at")
          .eq("user_id", ERIK_ID);
        if (erikBadgesFetchError) throw erikBadgesFetchError;
        erikUserBadges = safeMap(erikBadgesData, entry => entry);
      } catch (error) {
        console.error('[home] user_badges failed', error);
        erikUserBadges = [];
      }
      const awardedByBadgeId = new Map(erikUserBadges.map(entry => [entry.badge_id, entry] as const));
      widgetBadges = allBadges.map(badge => {
        const award = badge.id ? awardedByBadgeId.get(badge.id) : undefined;
        const details = parseBadgeCriteria(badge.criteria);
        const criteriaSummary = buildBadgeCriteriaSummary(details);
        return {
          id: badge.id,
          name: badge.name ?? "Badge",
          icon: resolveBadgeIcon(badge.icon),
          description: badge.description ?? null,
          criteriaSummary,
          awardedAt: award?.awarded_at ?? null,
          status: award ? "earned" as const : "locked" as const,
        };
      });
      earnedBadges = widgetBadges.filter(b => b.status === "earned");
    }
  } catch (error) {
    console.error('[home] badges query failed', error);
    widgetBadges = [];
    earnedBadges = [];
  }
  console.log('[home] badges:', widgetBadges.length, 'erikUnavailable:', !ERIK_ID);

  // Moderation snapshot (admin only)
  let moderationSnapshot: ModerationSnapshot = {
    pendingPosts: null,
    pendingComments: null,
    error: null,
  };
  if (isAdmin) {
    try {
      const { count: pendingPosts, error: pendingPostsError } = await sb
        .from("posts")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending");
      const { count: pendingComments, error: pendingCommentsError } = await sb
        .from("comments")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending");
      const errors: string[] = [];
      if (pendingPostsError) {
        errors.push("posts");
      } else {
        moderationSnapshot.pendingPosts = pendingPosts ?? 0;
      }
      if (pendingCommentsError) {
        errors.push("comments");
      } else {
        moderationSnapshot.pendingComments = pendingComments ?? 0;
      }
      if (errors.length > 0) {
        moderationSnapshot.error = `Unable to load ${errors.join(" and ")} counts.`;
      }
    } catch (error) {
      console.error('[home] moderation counts failed', error);
      moderationSnapshot.error = "Unable to load moderation counts.";
    }
  }
  console.log('[home] moderation counts:', moderationSnapshot.pendingPosts, moderationSnapshot.pendingComments);

  // Avatar House gating
  const canEditAvatar = Boolean(user?.id && ERIK_ID && user.id === ERIK_ID);

  // Render Home Hub
  return (
    <div className="space-y-10">
      {/* Home Banner */}
      <section className="home-banner relative overflow-hidden rounded-2xl border-[4px] border-[color:var(--mc-wood)] bg-[color:var(--mc-sky)] text-[color:var(--mc-ink)] shadow-mc">
        <PixelBackground className="absolute inset-0 w-full h-full pointer-events-none select-none" />
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:gap-10 p-6">
          <div className="flex flex-col items-center gap-4 md:flex-row md:gap-6">
            <AvatarTile username="Erik" avatarUrl={avatarUrl} />
            <div className="flex-1 space-y-2">
              <h1 className="home-card-title text-3xl sm:text-4xl">Erik&apos;s Hub</h1>
              <p className="home-card-body max-w-xl text-sm sm:text-base">{HUB_SUBTITLE}</p>
              <div className="max-w-lg">
                <XPBar currentXP={120} nextLevelXP={200} />
              </div>
            </div>
          </div>
        </div>
        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-6 px-6 pb-6">
          <div className="home-banner__tip md:max-w-[65%] md:flex-1">
            <span className="home-banner__tip-label">Tip of the Day</span>
            <p className="home-banner__tip-copy">{HUB_SUBTITLE}</p>
          </div>
          <div className="home-banner__parrot md:flex md:basis-[35%] md:justify-end">
            <ParrotSprite className="w-20 sm:w-24 md:w-28" />
          </div>
        </div>
      </section>
      {/* Portal Room grid below Hero */}
      <PortalRoom />

      {/* Parents' Corner (admin only) */}
      {isAdmin && (
        <section className="home-card">
          <div className="home-card__body space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-mc section-title text-xl">Parents&apos; Corner</h3>
              <Link href="/moderation" className="btn-mc-secondary section-label">Go to moderation</Link>
            </div>
            {moderationSnapshot.error && <p className="text-sm text-red-600">{moderationSnapshot.error}</p>}
            <ul className="space-y-2 text-sm text-[color:var(--mc-ink)]">
              <li className="flex items-center justify-between">
                <span>Moderation queue</span>
                <span className="font-mc text-base">{moderationSnapshot.pendingPosts ?? "--"}</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Pending comments</span>
                <span className="font-mc text-base">{moderationSnapshot.pendingComments ?? "--"}</span>
              </li>
            </ul>
          </div>
        </section>
      )}

      {/* Avatar House: Only Erik sees, at very end */}
      {user?.id === getErikIdFromEnv() && getErikIdFromEnv() && (
        <section id="avatar-house" className="home-card">
          <div className="home-card__body flex flex-col items-center gap-4">
            <h2 className="home-card-title text-xl mb-2">Avatar House</h2>
            <div className="flex flex-col items-center gap-2">
              <img
                src={avatarUrl}
                alt="Erik's Avatar"
                className="rounded-xl border-4 border-[color:var(--mc-wood)] bg-[color:var(--mc-parchment)] shadow-mc w-20 h-20 object-cover"
              />
              <span className="text-xs text-mc-stone">Current Avatar</span>
            </div>
            {/* Avatar options for Erik only */}
            <form
              className="flex flex-wrap gap-3 justify-center mt-2"
              action={"/"}
              onSubmit={e => e.preventDefault()}
            >
              {[
                { id: "steve", name: "Steve", url: "/assets/avatars/steve.png" },
                { id: "alex", name: "Alex", url: "/assets/avatars/alex.png" },
                { id: "creeper", name: "Creeper", url: "/assets/avatars/creeper.png" },
                { id: "enderman", name: "Enderman", url: "/assets/avatars/enderman.png" },
                { id: "parrot", name: "Parrot", url: "/assets/avatars/parrot.png" },
                { id: "wolf", name: "Wolf", url: "/assets/avatars/wolf.png" },
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  className={`border-2 rounded-lg p-1 bg-[color:var(--mc-parchment)] border-[color:var(--mc-wood)] shadow-mc focus:outline-mc-wood ${avatarUrl === opt.url ? "ring-2 ring-mc-emerald" : ""}`}
                  title={opt.name}
                  aria-label={opt.name}
                  onClick={async () => {
                    try {
                      const res = await fetch("/api/profile/avatar", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ avatar_url: opt.url }),
                      });
                      if (res.ok) {
                        window.location.reload();
                      } else {
                        alert("Failed to update avatar. Try again.");
                      }
                    } catch (error) {
                      console.error('[home] avatar update failed', error);
                    }
                  }}
                >
                  <img
                    src={opt.url}
                    alt={opt.name}
                    className="w-12 h-12 object-cover rounded-md"
                  />
                </button>
              ))}
            </form>
          </div>
        </section>
      )}

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        {/* My Projects Card */}
        <section className="home-card">
          <div className="home-card__body space-y-6">
            <h2 className="home-card-title text-2xl">My Projects</h2>
            {/* Minecraft Zone */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="home-icon home-icon--minecraft" aria-hidden="true" />
                  <h3 className="home-card-title text-lg">Minecraft Zone</h3>
                </div>
                <Link href="/minecraft-zone" className="home-card-meta text-xs uppercase tracking-[0.2em] hover:text-mc-ink">Visit</Link>
              </div>
              {minecraftError ? (
                <p className="text-sm text-red-600">{minecraftError}</p>
              ) : minecraftPosts.length === 0 ? (
                <p className="home-card-meta text-sm">No Minecraft adventures yet.</p>
              ) : (
                <ul className="space-y-2">
                  {minecraftPosts.map(post => {
                    const label = formatDateLabel(post.publishedAt);
                    return (
                      <li key={post.id} className="home-list-item">
                        <Link href={`/post/${post.id}`} className="home-list-link">
                          <span className="home-list-title">{post.title}</span>
                          {label && <span className="home-list-meta">{label}</span>}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            {/* Scratch Board */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="home-icon home-icon--scratch" aria-hidden="true" />
                  <h3 className="home-card-title text-lg">Scratch Board</h3>
                </div>
                <Link href="/scratch-board" className="home-card-meta text-xs uppercase tracking-[0.2em] hover:text-mc-ink">Visit</Link>
              </div>
              {scratchError ? (
                <p className="text-sm text-red-600">{scratchError}</p>
              ) : scratchProjects.length === 0 ? (
                <p className="home-card-meta text-sm">No Scratch projects yet.</p>
              ) : (
                <ul className="space-y-2">
                  {scratchProjects.map(project => {
                    const label = formatDateLabel(project.createdAt);
                    return (
                      <li key={project.id} className="home-list-item">
                        <Link href="/scratch-board" className="home-list-link">
                          <span className="home-list-title">{project.title}</span>
                          {label && <span className="home-list-meta">{label}</span>}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </section>

        {/* Right Column: Badges & Message Wall */}
        <div className="flex flex-col gap-6">
          {/* Badges & Achievements */}
          <section className="home-card">
            <div className="home-card__body space-y-4">
              <h2 className="home-card-title text-2xl">Earned Badges</h2>
              {earnedBadges.length === 0 ? (
                <p className="home-card-meta text-sm">No badges yet</p>
              ) : (
                <ul className="flex flex-wrap gap-2">
                  {earnedBadges.slice(0, 8).map(badge => (
                    <li
                      key={badge.id}
                      className="inline-flex items-center gap-1 rounded-lg border-2 border-[color:var(--mc-wood)] bg-[color:var(--mc-parchment)] px-2 py-1 shadow-mc"
                      title={badge.name}
                      aria-label={badge.name}
                    >
                      <span className="text-xl leading-none">{badge.icon ?? "🏅"}</span>
                      <span className="sr-only">{badge.name}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {/* Stories */}
          <section className="home-card">
            <div className="home-card__body space-y-4">
              <h2 className="home-card-title text-xl">Stories</h2>
              <Link href="/blog" className="home-card-meta text-xs uppercase tracking-[0.2em] hover:text-mc-ink">View all</Link>
              {latestPostsError ? (
                <p className="text-sm text-red-600">{latestPostsError}</p>
              ) : latestPosts.length === 0 ? (
                <p className="home-card-meta text-sm">No messages yet. Share a story to kick things off!</p>
              ) : (
                <ul className="space-y-2">
                  {latestPosts.map(post => {
                    const label = formatDateLabel(post.publishedAt);
                    return (
                      <li key={post.id} className="home-message">
                        <Link href={`/post/${post.id}`} className="home-message__link">
                          <span className="home-message__title">{post.title}</span>
                          {label && <span className="home-message__meta">{label}</span>}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>
        </div>
      </div>


      {/* Parents' Corner (admin only) */}
      {isAdmin && (
        <section className="home-card">
          <div className="home-card__body space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-mc section-title text-xl">Parents&apos; Corner</h3>
              <Link href="/moderation" className="btn-mc-secondary section-label">Go to moderation</Link>
            </div>
            {moderationSnapshot.error && <p className="text-sm text-red-600">{moderationSnapshot.error}</p>}
            <ul className="space-y-2 text-sm text-[color:var(--mc-ink)]">
              <li className="flex items-center justify-between">
                <span>Moderation queue</span>
                <span className="font-mc text-base">{moderationSnapshot.pendingPosts ?? "--"}</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Pending comments</span>
                <span className="font-mc text-base">{moderationSnapshot.pendingComments ?? "--"}</span>
              </li>
            </ul>
          </div>
        </section>
      )}
    </div>
  );
}