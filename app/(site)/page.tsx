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

const PAGE_SIZE = 3;
const HUB_SUBTITLE = "Welcome to the base camp for Erik's stories, games, and projects.";
const MINECRAFT_TAG_SLUG = "minecraft";

type HomeSearchParams = {
  page?: string | string[];
};

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
  "id" | "name" | "icon" | "description"
>;

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

type BadgePreview = {
  id: string;
  name: string;
  icon: string;
  description: string | null;
};

type EarnedBadgePreview = {
  id: string;
  name: string;
  icon: string | null;
  awardedAt: string | null;
};

type ModerationSnapshot = {
  pendingPosts: number | null;
  pendingComments: number | null;
  error: string | null;
};

function parsePageParam(input: string | string[] | undefined): number {
  const raw = Array.isArray(input) ? input[0] : input;
  const parsed = parseInt(raw ?? "1", 10);
  if (Number.isNaN(parsed) || parsed < 1) {
    return 1;
  }
  return parsed;
}

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

function buildPageHref(page: number) {
  return page <= 1 ? "/" : `/?page=${page}`;
}

function coerceNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export default async function HomeHubPage({
  searchParams,
}: {
  searchParams?: HomeSearchParams;
}) {
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

  const page = parsePageParam(searchParams?.page);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

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
    .range(from, to);

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

  const hasNextPage = latestPosts.length === PAGE_SIZE;
  const hasPrevPage = page > 1;

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

  let badges: BadgePreview[] = [];
  let badgesError: string | null = null;

  const {
    data: badgesData,
    error: badgesFetchError,
  } = await sb
    .from("badges")
    .select("id, name, icon, description")
    .order("name", { ascending: true })
    .limit(6);

  if (badgesFetchError) {
    console.error("[home-hub] failed to load badges", badgesFetchError);
    badgesError = "Unable to load badges.";
  } else {
    badges = ((badgesData ?? []) as BadgeRow[]).map((badge) => ({
      id: badge.id,
      name: badge.name,
      icon: resolveBadgeIcon(badge.icon),
      description: badge.description,
    }));
  }

  let userBadgeCount: number | null = null;
  let userBadgesError: string | null = null;
  let recentBadgeSummaries: EarnedBadgePreview[] = [];

  if (user) {
    const {
      count: earnedCount,
      error: userBadgesFetchError,
    } = await sb
      .from("user_badges")
      .select("badge_id", { count: "exact", head: true })
      .eq("user_id", user.id);

    if (userBadgesFetchError) {
      console.error("[home-hub] failed to load user badges", userBadgesFetchError);
      userBadgesError = "Unable to load your badge progress.";
    } else {
      userBadgeCount = earnedCount ?? 0;
    }

    const {
      data: recentBadgesData,
      error: recentBadgesError,
    } = await sb
      .from("user_badges")
      .select("awarded_at, badges:badges(id, name, icon)")
      .eq("user_id", user.id)
      .order("awarded_at", { ascending: false })
      .limit(6);

    if (recentBadgesError) {
      console.error("[home-hub] failed to load recent user badges", recentBadgesError);
      userBadgesError = userBadgesError ?? "Unable to load your badge progress.";
    } else {
      recentBadgeSummaries = ((recentBadgesData ?? []) as {
        awarded_at: string | null;
        badges: { id: string | null; name: string | null; icon: string | null } | null;
      }[])
        .map((entry) => {
          const badge = entry.badges;
          if (!badge?.id) return null;
          return {
            id: badge.id,
            name: badge.name ?? "Badge",
            icon: badge.icon ?? null,
            awardedAt: entry.awarded_at ?? null,
          } satisfies EarnedBadgePreview;
        })
        .filter((badge): badge is EarnedBadgePreview => Boolean(badge));
    }
  }

  const homeBadgeIcons = recentBadgeSummaries.slice(0, 4).map((badge) => ({
    id: badge.id,
    name: badge.name,
    icon: resolveBadgeIcon(badge.icon),
  }));

  const featuredBadges = badges.slice(0, 3);
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
        <ParrotSprite className="absolute bottom-16 right-6 hidden sm:block w-20 drop-shadow-[0_4px_0_rgba(35,19,8,0.35)]" />
        <div className="relative z-10 flex flex-col gap-6 px-6 py-8 sm:px-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-end">
            <AvatarTile username={displayName} avatarUrl={avatarUrl} />
            <div className="flex-1 space-y-4">
              <div className="space-y-2 text-[color:var(--mc-ink)]">
                <h1 className="font-mc text-3xl sm:text-4xl">{"Erik's Hub"}</h1>
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
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="home-banner__tip">
              <span className="home-banner__tip-label">Tip of the Day</span>
              <p className="home-banner__tip-copy">{HUB_SUBTITLE}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {user && (
                <Link href="/post/new" className="btn-mc">
                  New Post
                </Link>
              )}
              <Link href="/badges" className="btn-mc">
                Badges
              </Link>
              <Link href="/minecraft-zone" className="btn-mc">
                Minecraft Zone
              </Link>
              <Link href="/scratch-board" className="btn-mc">
                Scratch Board
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section className="home-card">
          <div className="home-card__body space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-mc text-2xl">My Projects</h2>
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
                    <h3 className="font-mc text-lg">Minecraft Zone</h3>
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
                    <h3 className="font-mc text-lg">Scratch Board</h3>
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
                <h2 className="font-mc text-2xl">Badges &amp; Achievements</h2>
                <Link
                  href="/badges"
                  className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:rgba(46,46,46,0.7)] hover:text-[color:var(--mc-ink)]"
                >
                  View all
                </Link>
              </div>
              {user ? (
                <div className="space-y-3">
                  <p className="text-sm text-[color:rgba(46,46,46,0.7)]">
                    Earned: {typeof userBadgeCount === "number" ? userBadgeCount : "—"}
                  </p>
                  {userBadgesError ? (
                    <p className="text-sm text-red-600">{userBadgesError}</p>
                  ) : homeBadgeIcons.length > 0 ? (
                    <ul className="flex flex-wrap gap-2">
                      {homeBadgeIcons.map((badge) => (
                        <li key={badge.id} className="home-badge" aria-label={badge.name ?? undefined}>
                          <span aria-hidden>{badge.icon}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-[color:rgba(46,46,46,0.7)]">
                      No badges yet—share a story to earn your first!
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-[color:rgba(46,46,46,0.7)]">
                    Log in to start collecting badges.
                  </p>
                  <Link href="/login" className="btn-mc-secondary">
                    Log in
                  </Link>
                </div>
              )}
              {badgesError ? (
                <p className="text-sm text-red-600">{badgesError}</p>
              ) : featuredBadges.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.2em] text-[color:rgba(46,46,46,0.55)]">
                    Featured badges
                  </p>
                  <ul className="flex flex-wrap gap-3">
                    {featuredBadges.map((badge) => (
                      <li key={badge.id} className="home-featured-badge">
                        <span className="text-2xl" aria-hidden>
                          {badge.icon}
                        </span>
                        <span className="home-featured-badge__label">{badge.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </section>

          <section className="home-card">
            <div className="home-card__body space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-mc text-xl">Message Wall</h2>
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

      <section id="latest-posts" className="home-card">
        <div className="home-card__body space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 className="font-mc text-2xl">Latest Posts</h2>
            <p className="text-xs uppercase tracking-[0.18em] text-[color:rgba(46,46,46,0.6)]">
              Page {page}
            </p>
          </div>
          {latestPostsError ? (
            <p className="text-sm text-red-600">{latestPostsError}</p>
          ) : latestPosts.length === 0 ? (
            <p className="text-sm text-[color:rgba(46,46,46,0.7)]">No posts yet.</p>
          ) : (
            <ul className="space-y-3">
              {latestPosts.map((post) => {
                const label = formatDateLabel(post.publishedAt);
                return (
                  <li key={post.id} className="home-message">
                    <Link href={`/post/${post.id}`} className="home-message__link">
                      <span className="home-message__title">{post.title}</span>
                      <p className="home-message__excerpt">{post.excerpt}</p>
                      {label && <span className="home-message__meta">{label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="flex flex-wrap gap-2">
            {hasPrevPage ? (
              <Link href={buildPageHref(page - 1)} className="btn-mc-secondary">
                Previous
              </Link>
            ) : (
              <span className="btn-mc-secondary cursor-not-allowed opacity-50">
                Previous
              </span>
            )}
            {hasNextPage ? (
              <Link href={buildPageHref(page + 1)} className="btn-mc-secondary">
                Next
              </Link>
            ) : (
              <span className="btn-mc-secondary cursor-not-allowed opacity-50">
                Next
              </span>
            )}
          </div>
        </div>
      </section>

      <section className="home-card">
        <div className="home-card__body space-y-3">
          <h3 className="font-mc text-xl">Quick Actions</h3>
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
            <Link href="/calendar" className="btn-mc-secondary">
              Calendar
            </Link>
            <Link href="/tags" className="btn-mc-secondary">
              Tags
            </Link>
            {isAdmin && (
              <Link href="/moderation" className="btn-mc-secondary">
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
              <h3 className="font-mc text-xl">{"Parents' Corner"}</h3>
              <Link href="/moderation" className="btn-mc-secondary">
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
