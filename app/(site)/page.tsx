// /app/(site)/page.tsx
import Link from "next/link";
import supabaseServer from "@/lib/supabaseServer";
import { buildExcerpt, extractPostContent } from "@/lib/postContent";
import { resolveBadgeIcon } from "@/lib/badgeIcons";
import type { TablesRow } from "@/lib/database.types";
import AvatarTile from "@/components/AvatarTile";
import ParrotSprite from "@/components/ParrotSprite";
import PixelBackground from "@/components/PixelBackground";
import XPBar from "@/components/XPBar";

const MESSAGE_WALL_LIMIT = 3;
const HUB_SUBTITLE = "Welcome to the base camp for Erik's stories, games, and projects.";
const MINECRAFT_TAG_SLUG = "minecraft";

type PostRow = Pick<
  TablesRow<"posts">,
  "id" | "title" | "content" | "content_html" | "published_at" | "created_at"
>;

type MinecraftPostRow = Pick<
  TablesRow<"posts">,
  "id" | "title" | "published_at" | "created_at"
> & {
  post_tags?: { tag_id: string | null }[] | null;
};

type ScratchProjectRow = Pick<
  TablesRow<"scratch_projects">,
  "id" | "title" | "created_at"
>;

type BadgeRow = Pick<
  TablesRow<"badges">,
  "id" | "name" | "icon" | "description" | "criteria"
>;

type UserBadgeRow = Pick<TablesRow<"user_badges">, "badge_id" | "awarded_at">;

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

type BadgeCriteriaDetails = {
  type: string | null;
  threshold: number | null;
};

type WidgetBadge = {
  id: string;
  name: string;
  icon: string;
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


function coerceNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

const ERIK_EMAIL = "erik.ys.johansson@gmail.com";

let cachedErikUserId: string | null = null;
let erikUserIdResolved = false;
let erikUserIdPromise: Promise<string | null> | null = null;

function parseBadgeCriteria(raw: BadgeRow["criteria"]): BadgeCriteriaDetails {
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

function buildBadgeCriteriaSummary(details: BadgeCriteriaDetails): string | null {
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

async function resolveErikUserId(): Promise<string | null> {
  const envUserId = coerceNonEmptyString(process.env.NEXT_PUBLIC_ERIK_USER_ID);
  if (envUserId) {
    cachedErikUserId = envUserId;
    erikUserIdResolved = true;
    return envUserId;
  }

  if (erikUserIdResolved) {
    return cachedErikUserId;
  }

  if (!erikUserIdPromise) {
    erikUserIdPromise = (async () => {
      try {
        const response = await fetch(
          `/api/badges/resolve-user?email=${encodeURIComponent(ERIK_EMAIL)}`,
          {
            method: "GET",
            headers: { accept: "application/json" },
            cache: "no-store",
          }
        );

        if (!response.ok) {
          if (process.env.NODE_ENV !== "production") {
            console.warn(
              `[home-hub] failed to resolve Erik's user id (status ${response.status})`
            );
          }
          return null;
        }

        const payload = (await response.json()) as { user_id?: unknown };
        const userId = coerceNonEmptyString(payload.user_id);
        if (!userId && process.env.NODE_ENV !== "production") {
          console.warn("[home-hub] resolver returned no user id for Erik");
        }
        return userId;
      } catch (error) {
        if (process.env.NODE_ENV !== "production") {
          console.error("[home-hub] unexpected error resolving Erik's user id", error);
        }
        return null;
      } finally {
        erikUserIdResolved = true;
      }
    })();
  }

  const resolvedId = await erikUserIdPromise;
  cachedErikUserId = resolvedId ?? null;
  erikUserIdPromise = null;
  return cachedErikUserId;
}

export default async function HomeHubPage() {
  const sb = supabaseServer();

  const {
    data: userRes,
    error: userError,
  } = await sb.auth.getUser();

  if (userError) {
    console.error("[home-hub] failed to fetch user", userError);
  }

  const user = userRes?.user ?? null;
  const userEmail = user?.email ?? null;
  const userMetadata = (user?.user_metadata ?? {}) as Record<string, unknown>;
  const metaValue = (key: string) => coerceNonEmptyString(userMetadata[key]);
  const avatarUrl = metaValue("avatar_url") ?? metaValue("avatar") ?? null;
  const emailHandle = userEmail ? userEmail.split("@")[0] : null;
  const displayName =
    metaValue("full_name") ??
    metaValue("display_name") ??
    metaValue("username") ??
    metaValue("preferred_username") ??
    emailHandle ??
    "Guest Explorer";

  const adminEmail =
    process.env.NEXT_PUBLIC_ADMIN_EMAIL?.toLowerCase() ?? "wenyu.yan@gmail.com";
  const isAdmin =
    userEmail?.toLowerCase() === adminEmail && adminEmail.length > 0;

  let latestPosts: PostSummary[] = [];
  let latestPostsError: string | null = null;

  const {
    data: latestData,
    error: latestError,
  } = await sb
    .from("posts")
    .select(
      "id, title, content, content_html, published_at, created_at"
    )
    .eq("status", "approved")
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(MESSAGE_WALL_LIMIT);

  if (latestError) {
    console.error("[home-hub] failed to load latest posts", latestError);
    latestPostsError = "Unable to load latest posts.";
  } else {
    latestPosts = ((latestData ?? []) as PostRow[]).map((post) => {
      const { text } = extractPostContent({
        content_html: post.content_html,
        content: post.content,
      });

      return {
        id: post.id,
        title: post.title || "Untitled",
        excerpt: buildExcerpt(text),
        publishedAt: getPostTimestamp(post),
      } satisfies PostSummary;
    });
  }

  let minecraftPosts: MiniPost[] = [];
  let minecraftError: string | null = null;

  const {
    data: minecraftTag,
    error: minecraftTagError,
  } = await sb
    .from("tags")
    .select("id")
    .eq("slug", MINECRAFT_TAG_SLUG)
    .maybeSingle();

  if (minecraftTagError) {
    console.error("[home-hub] failed to load minecraft tag", minecraftTagError);
    minecraftError = "Unable to load Minecraft posts.";
  } else if (minecraftTag) {
    const {
      data: minecraftData,
      error: minecraftPostsError,
    } = await sb
      .from("posts")
      .select(
        "id, title, published_at, created_at, post_tags:post_tags!inner(tag_id)"
      )
      .eq("status", "approved")
      .eq("post_tags.tag_id", minecraftTag.id)
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(3);

    if (minecraftPostsError) {
      console.error(
        "[home-hub] failed to load minecraft posts",
        minecraftPostsError
      );
      minecraftError = "Unable to load Minecraft posts.";
    } else {
      minecraftPosts = ((minecraftData ?? []) as MinecraftPostRow[]).map(
        (post) => ({
          id: post.id,
          title: post.title || "Untitled",
          publishedAt: getPostTimestamp(post),
        })
      );
    }
  }

  let scratchProjects: ScratchPreview[] = [];
  let scratchError: string | null = null;

  const {
    data: scratchData,
    error: scratchFetchError,
  } = await sb
    .from("scratch_projects")
    .select("id, title, created_at")
    .order("created_at", { ascending: false })
    .limit(3);

  if (scratchFetchError) {
    console.error("[home-hub] failed to load scratch projects", scratchFetchError);
    scratchError = "Unable to load Scratch projects.";
  } else {
    scratchProjects = ((scratchData ?? []) as ScratchProjectRow[]).map(
      (project) => ({
        id: project.id,
        title: project.title?.trim() || "Untitled",
        createdAt: project.created_at ?? null,
      })
    );
  }

  let widgetBadges: WidgetBadge[] = [];
  let badgesError: string | null = null;
  let erikCollectionUnavailable = false;

  const {
    data: badgesData,
    error: badgesFetchError,
  } = await sb
    .from("badges")
    .select("id, name, icon, description, criteria")
    .order("name", { ascending: true });

  if (badgesFetchError) {
    console.error("[home-hub] failed to load badges", badgesFetchError);
    badgesError = "Unable to load badges.";
  } else {
    const allBadges = ((badgesData ?? []) as BadgeRow[]).filter((badge) => Boolean(badge.id));
    if (allBadges.length > 0) {
      const erikUserId = await resolveErikUserId();

      let erikUserBadges: UserBadgeRow[] = [];
      if (erikUserId) {
        const {
          data: erikBadgesData,
          error: erikBadgesFetchError,
        } = await sb
          .from("user_badges")
          .select("badge_id, awarded_at")
          .eq("user_id", erikUserId);

        if (erikBadgesFetchError) {
          if (process.env.NODE_ENV !== "production") {
            console.error(
              "[home-hub] failed to load Erik's badge awards",
              erikBadgesFetchError
            );
          }
          erikCollectionUnavailable = true;
        } else {
          erikUserBadges = (erikBadgesData ?? []) as UserBadgeRow[];
        }
      } else {
        erikCollectionUnavailable = true;
      }

      const awardedByBadgeId = new Map(
        erikUserBadges.map((entry) => [entry.badge_id, entry] as const)
      );

      widgetBadges = allBadges
        .map((badge) => {
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
            status: award ? "earned" : "locked",
          } satisfies WidgetBadge;
        })
        .sort((a, b) => {
          if (a.status !== b.status) {
            return a.status === "earned" ? -1 : 1;
          }
          return a.name.localeCompare(b.name);
        });
    }
  }
  const messageWallPosts = latestPosts.slice(0, 3);

  let moderationSnapshot: ModerationSnapshot = {
    pendingPosts: null,
    pendingComments: null,
    error: null,
  };

  if (isAdmin) {
    const {
      count: pendingPosts,
      error: pendingPostsError,
    } = await sb
      .from("posts")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");

    const {
      count: pendingComments,
      error: pendingCommentsError,
    } = await sb
      .from("comments")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");

    const errors: string[] = [];

    if (pendingPostsError) {
      console.error("[home-hub] failed to load pending posts", pendingPostsError);
      errors.push("posts");
    } else {
      moderationSnapshot.pendingPosts = pendingPosts ?? 0;
    }

    if (pendingCommentsError) {
      console.error(
        "[home-hub] failed to load pending comments",
        pendingCommentsError
      );
      errors.push("comments");
    } else {
      moderationSnapshot.pendingComments = pendingComments ?? 0;
    }

    if (errors.length > 0) {
      moderationSnapshot.error = `Unable to load ${errors.join(" and ")} counts.`;
    }
  }

  return (
    <div className="space-y-10">
      <section className="home-banner relative overflow-hidden rounded-2xl border-[4px] border-[color:var(--mc-wood)] bg-[color:var(--mc-sky)] text-[color:var(--mc-ink)] shadow-mc">
        <PixelBackground />
        <div className="relative z-10 flex flex-col gap-6 px-6 py-8 sm:px-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-end">
            <AvatarTile username={displayName} avatarUrl={avatarUrl} />
            <div className="flex-1 space-y-4">
              <div className="space-y-2 text-[color:var(--mc-ink)]">
                <h1 className="font-mc section-title text-3xl sm:text-4xl">{"Erik's Hub"}</h1>
                <p className="max-w-xl text-sm text-[color:rgba(46,46,46,0.82)] sm:text-base">
                  {HUB_SUBTITLE}
                </p>
                {userEmail && (
                  <p className="text-xs uppercase tracking-[0.18em] text-[color:rgba(46,46,46,0.6)]">
                    Signed in as {userEmail}
                  </p>
                )}
              </div>
              <div className="max-w-lg">
                <XPBar currentXP={120} nextLevelXP={200} />
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-6">
            <div className="home-banner__tip md:max-w-[65%] md:flex-1">
              <span className="home-banner__tip-label">Tip of the Day</span>
              <p className="home-banner__tip-copy">{HUB_SUBTITLE}</p>
            </div>
            <div className="home-banner__parrot md:flex md:basis-[35%] md:justify-end">
              <ParrotSprite className="w-20 drop-shadow-[0_4px_0_rgba(35,19,8,0.35)] sm:w-24 md:w-28" />
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section className="home-card">
          <div className="home-card__body space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-mc section-title text-2xl">My Projects</h2>
              <Link
                href="/minecraft-zone"
                className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:rgba(46,46,46,0.7)] hover:text-[color:var(--mc-ink)]"
              >
                Explore all
              </Link>
            </div>
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="home-icon home-icon--minecraft" aria-hidden="true" />
                    <h3 className="font-mc section-title text-lg">Minecraft Zone</h3>
                  </div>
                  <Link
                    href="/minecraft-zone"
                    className="text-xs uppercase tracking-[0.2em] text-[color:rgba(46,46,46,0.6)] hover:text-[color:var(--mc-ink)]"
                  >
                    Visit
                  </Link>
                </div>
                {minecraftError ? (
                  <p className="text-sm text-red-600">{minecraftError}</p>
                ) : minecraftPosts.length === 0 ? (
                  <p className="text-sm text-[color:rgba(46,46,46,0.7)]">
                    No Minecraft adventures yet.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {minecraftPosts.map((post) => {
                      const label = formatDateLabel(post.publishedAt);
                      return (
                        <li key={post.id} className="home-list-item">
                          <Link href={`/post/${post.id}`} className="home-list-link">
                            <span className="home-list-title">{post.title}</span>
                            {label && (
                              <span className="home-list-meta">{label}</span>
                            )}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="home-icon home-icon--scratch" aria-hidden="true" />
                    <h3 className="font-mc section-title text-lg">Scratch Board</h3>
                  </div>
                  <Link
                    href="/scratch-board"
                    className="text-xs uppercase tracking-[0.2em] text-[color:rgba(46,46,46,0.6)] hover:text-[color:var(--mc-ink)]"
                  >
                    Visit
                  </Link>
                </div>
                {scratchError ? (
                  <p className="text-sm text-red-600">{scratchError}</p>
                ) : scratchProjects.length === 0 ? (
                  <p className="text-sm text-[color:rgba(46,46,46,0.7)]">
                    No Scratch projects yet.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {scratchProjects.map((project) => {
                      const label = formatDateLabel(project.createdAt);
                      return (
                        <li key={project.id} className="home-list-item">
                          <Link href="/scratch-board" className="home-list-link">
                            <span className="home-list-title">{project.title}</span>
                            {label && (
                              <span className="home-list-meta">{label}</span>
                            )}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="flex flex-col gap-6">
          <section className="home-card">
            <div className="home-card__body space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-mc section-title text-2xl">Badges &amp; Achievements</h2>
                <Link
                  href="/badges"
                  className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:rgba(46,46,46,0.7)] hover:text-[color:var(--mc-ink)]"
                >
                  View all
                </Link>
              </div>
              {badgesError ? (
                <p className="text-sm text-red-600">{badgesError}</p>
              ) : widgetBadges.length === 0 ? (
                <p className="text-sm text-[color:rgba(46,46,46,0.7)]">
                  Badges will appear here once they&apos;re configured.
                </p>
              ) : (
                <div className="space-y-3">
                  {erikCollectionUnavailable && (
                    <p className="text-xs text-[color:rgba(46,46,46,0.6)]">
                      Erik&apos;s collection unavailable right now — showing badges as locked.
                    </p>
                  )}
                  <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {widgetBadges.map((badge) => {
                      const awardedLabel = formatErikBadgeAwardedAt(badge.awardedAt);
                      const cardClasses = [
                        "badge-card space-y-3 rounded-xl p-4",
                        badge.status === "earned" ? "badge-card-earned" : "badge-card-locked",
                      ].join(" ");
                      const iconClasses = [
                        "badge-icon",
                        badge.status === "earned" ? "badge-icon-earned" : "badge-icon-locked",
                      ].join(" ");

                      return (
                        <li key={badge.id} className={cardClasses}>
                          <div className="flex items-start gap-3">
                            <span className={iconClasses} aria-hidden>
                              {badge.icon}
                            </span>
                            <div className="space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="badge-title text-base font-semibold sm:text-lg">
                                  {badge.name}
                                </h3>
                                <span
                                  className={`badge-status-chip ${badge.status === "earned" ? "badge-status-earned" : "badge-status-locked"}`}
                                >
                                  {badge.status === "earned" ? "Earned ✓" : "Locked"}
                                </span>
                              </div>
                              {badge.description && (
                                <p className="badge-description text-sm">
                                  {badge.description}
                                </p>
                              )}
                              {badge.criteriaSummary && (
                                <p className="text-xs text-[color:rgba(47,39,28,0.75)]">
                                  {badge.criteriaSummary}
                                </p>
                              )}
                              {badge.status === "earned" && awardedLabel && (
                                <p className="text-xs text-[color:rgba(47,39,28,0.75)]">
                                  Awarded {awardedLabel}
                                </p>
                              )}
                            </div>
                          </div>
                          <span className="badge-card-outline" aria-hidden />
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          </section>

          <section className="home-card">
            <div className="home-card__body space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-mc section-title text-xl">Message Wall</h2>
                <Link
                  href="#latest-posts"
                  className="text-xs uppercase tracking-[0.2em] text-[color:rgba(46,46,46,0.6)] hover:text-[color:var(--mc-ink)]"
                >
                  See all
                </Link>
              </div>
              {latestPostsError ? (
                <p className="text-sm text-red-600">{latestPostsError}</p>
              ) : messageWallPosts.length === 0 ? (
                <p className="text-sm text-[color:rgba(46,46,46,0.7)]">
                  No messages yet. Share a story to kick things off!
                </p>
              ) : (
                <ul className="space-y-2">
                  {messageWallPosts.map((post) => {
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

      <section className="home-card">
        <div className="home-card__body space-y-3">
          <h3 className="font-mc section-title text-xl">Quick Actions</h3>
          <div className="flex flex-wrap gap-2">
            {user && (
              <Link href="/post/new" className="btn-mc">
                New Post
              </Link>
            )}
            {user && (
              <Link href="/scratch-board/new" className="btn-mc">
                New Scratch Project
              </Link>
            )}
            {isAdmin && (
              <Link href="/moderation" className="btn-mc-secondary section-label">
                Moderation
              </Link>
            )}
          </div>
        </div>
      </section>

      {isAdmin && (
        <section className="home-card">
          <div className="home-card__body space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-mc section-title text-xl">{"Parents' Corner"}</h3>
              <Link href="/moderation" className="btn-mc-secondary section-label">
                Go to moderation
              </Link>
            </div>
            {moderationSnapshot.error && (
              <p className="text-sm text-red-600">{moderationSnapshot.error}</p>
            )}
            <ul className="space-y-2 text-sm text-[color:var(--mc-ink)]">
              <li className="flex items-center justify-between">
                <span>Moderation queue</span>
                <span className="font-mc text-base">
                  {moderationSnapshot.pendingPosts ?? "--"}
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span>Pending comments</span>
                <span className="font-mc text-base">
                  {moderationSnapshot.pendingComments ?? "--"}
                </span>
              </li>
            </ul>
          </div>
        </section>
      )}
    </div>
  );

}
