// /app/(site)/page.tsx
import Link from "next/link";
import supabaseServer from "@/lib/supabaseServer";
import { buildExcerpt, extractPostContent } from "@/lib/postContent";
import { resolveBadgeIcon } from "@/lib/badgeIcons";
import type { TablesRow } from "@/lib/database.types";
import ProfileSummary from "@/components/ProfileSummary";
import XPBar from "@/components/XPBar";
import Bird from "@/components/pixels/Bird";
import Butterfly from "@/components/pixels/Butterfly";

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
    <div className="space-y-8">
      <section className="card-block relative overflow-hidden">
        <div className="pointer-events-none absolute -top-8 right-4 z-0 hidden sm:block">
          <Bird className="h-14 w-20 opacity-85 sm:h-16 sm:w-24 md:h-20 md:w-28" />
        </div>
        <div className="pointer-events-none absolute -bottom-6 left-6 z-0 hidden md:block">
          <Butterfly className="h-16 w-24 opacity-90" />
        </div>
        <div className="pointer-events-none absolute top-4 left-[55%] z-0 rotate-6">
          <Bird className="h-12 w-16 opacity-70 sm:opacity-90" />
        </div>

        <div className="relative z-10 space-y-3">
          <div className="space-y-2">
            <h1 className="font-mc text-3xl">{"Erik's Hub"}</h1>
            <p className="text-sm opacity-80">{HUB_SUBTITLE}</p>
            {userEmail && (
              <p className="text-xs text-mc-stone">Signed in as {userEmail}</p>
            )}
          </div>
          <XPBar currentXP={120} nextLevelXP={200} className="w-full max-w-md" />
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
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {user && (
          <ProfileSummary
            className="lg:col-span-2"
            userEmail={userEmail}
            recentBadges={recentBadgeSummaries}
            errorMessage={userBadgesError}
          />
        )}

        <section className="card-block space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-mc text-xl">Badges</h3>
            {user && (
              <Link href="/badges" className="text-xs font-semibold uppercase tracking-wide text-mc-stone hover:text-mc-ink">
                View all →
              </Link>
            )}
          </div>

          {user ? (
            <div className="space-y-3">
              <p className="text-sm text-mc-stone">
                Earned: {typeof userBadgeCount === 'number' ? userBadgeCount : '—'}
              </p>
              {userBadgesError ? (
                <p className="text-sm text-red-500">{userBadgesError}</p>
              ) : homeBadgeIcons.length > 0 ? (
                <ul className="flex flex-wrap items-center gap-2">
                  {homeBadgeIcons.map((badge) => (
                    <li key={badge.id}>
                      <span
                        className="badge-icon badge-icon-earned"
                        role="img"
                        aria-label={badge.name}
                      >
                        {badge.icon}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-mc-stone">
                  No badges yet—share a story to earn your first!
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-mc-stone">
                Log in to start collecting badges.
              </p>
              <Link href="/login" className="btn-mc-secondary">
                Log in
              </Link>
            </div>
          )}
        </section>

        <section className="card-block space-y-4 lg:col-span-2">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 className="font-mc text-2xl">Latest Posts</h2>
            <p className="text-xs uppercase tracking-wide text-mc-stone">
              Page {page}
            </p>
          </div>

          {latestPostsError ? (
            <p className="text-sm text-red-500">{latestPostsError}</p>
          ) : latestPosts.length === 0 ? (
            <p className="text-sm text-mc-stone">No posts yet.</p>
          ) : (
            <ul className="space-y-3">
              {latestPosts.map((post) => {
                const label = formatDateLabel(post.publishedAt);
                return (
                  <li
                    key={post.id}
                    className="rounded border border-mc-wood-dark/50 bg-mc-wood/20 p-3"
                  >
                    <Link href={`/post/${post.id}`} className="block space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="font-mc text-lg">{post.title}</h3>
                        {label && (
                          <span className="text-xs uppercase text-mc-stone">
                            {label}
                          </span>
                        )}
                      </div>
                      <p className="text-sm leading-relaxed text-mc-ink/80">
                        {post.excerpt}
                      </p>
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
        </section>

        <section className="card-block space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-mc text-xl">Minecraft Zone</h3>
            <Link href="/minecraft-zone" className="btn-mc-secondary">
              View all
            </Link>
          </div>

          {minecraftError ? (
            <p className="text-sm text-red-500">{minecraftError}</p>
          ) : minecraftPosts.length === 0 ? (
            <p className="text-sm text-mc-stone">No items yet.</p>
          ) : (
            <ul className="space-y-2">
              {minecraftPosts.map((post) => {
                const label = formatDateLabel(post.publishedAt);
                return (
                  <li
                    key={post.id}
                    className="rounded border border-mc-wood-dark/50 bg-mc-wood/20 px-3 py-2"
                  >
                    <Link href={`/post/${post.id}`} className="block">
                      <p className="font-mc text-sm">{post.title}</p>
                      {label && (
                        <p className="text-xs text-mc-stone">{label}</p>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="card-block space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-mc text-xl">Scratch Board</h3>
            <Link href="/scratch-board" className="btn-mc-secondary">
              View all
            </Link>
          </div>

          {scratchError ? (
            <p className="text-sm text-red-500">{scratchError}</p>
          ) : scratchProjects.length === 0 ? (
            <p className="text-sm text-mc-stone">No items yet.</p>
          ) : (
            <ul className="space-y-2">
              {scratchProjects.map((project) => {
                const label = formatDateLabel(project.createdAt);
                return (
                  <li
                    key={project.id}
                    className="rounded border border-mc-wood-dark/50 bg-mc-wood/20 px-3 py-2"
                  >
                    <p className="font-mc text-sm">{project.title}</p>
                    {label && <p className="text-xs text-mc-stone">{label}</p>}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="card-block space-y-4 lg:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="font-mc text-xl">Badges</h3>
              {user && userBadgeCount !== null && (
                <p className="text-sm text-mc-stone">
                  You have earned {userBadgeCount} badge{userBadgeCount === 1 ? "" : "s"}.
                </p>
              )}
              {user && userBadgesError && (
                <p className="text-sm text-red-500">{userBadgesError}</p>
              )}
            </div>
            <Link href="/badges" className="btn-mc-secondary">
              View all
            </Link>
          </div>

          {badgesError ? (
            <p className="text-sm text-red-500">{badgesError}</p>
          ) : badges.length === 0 ? (
            <p className="text-sm text-mc-stone">No badges yet.</p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {badges.map((badge) => (
                <li
                  key={badge.id}
                  className="rounded border border-mc-wood-dark/50 bg-mc-wood/20 px-3 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl" aria-hidden>
                      {badge.icon}
                    </span>
                    <div>
                      <p className="font-mc text-sm">{badge.name}</p>
                      {badge.description && (
                        <p className="text-xs text-mc-stone">{badge.description}</p>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card-block space-y-3 lg:col-span-2">
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
        </section>

        {isAdmin && (
          <section className="card-block space-y-3 lg:col-span-2">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-mc text-xl">{"Parents' Corner"}</h3>
              <Link href="/moderation" className="btn-mc-secondary">
                Go to moderation
              </Link>
            </div>
            {moderationSnapshot.error && (
              <p className="text-sm text-red-500">{moderationSnapshot.error}</p>
            )}
            <ul className="space-y-2 text-sm">
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
          </section>
        )}
      </div>
    </div>
  );
}
