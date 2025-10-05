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
import { getErikProfileAvatar, getErikUserId, AVATAR_OPTIONS } from "@/lib/erik";
import AvatarHouse from "@/components/AvatarHouse";

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
// WidgetBadge type removed, not needed for new layout
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
  let avatarUrl: string = "/avatars/Steve.png";
  let currentAvatarFilename: string = "Steve.png";
  try {
    const avatarUrlRaw = await getErikProfileAvatar();
    if (avatarUrlRaw && typeof avatarUrlRaw === 'string' && avatarUrlRaw.length > 0) {
      avatarUrl = avatarUrlRaw;
      // Extract filename from path
      const match = avatarUrlRaw.match(/\/avatars\/(.+\.png)$/);
      if (match && AVATAR_OPTIONS.includes(match[1])) {
        currentAvatarFilename = match[1];
      }
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
  const erikUserId = await getErikUserId();
  const isErik = !!(user?.id && erikUserId && user.id === erikUserId);

  // Render Home Hub
  return (
    <div className="space-y-10">
      {/* Home Banner */}
      <section className="home-banner relative overflow-hidden rounded-2xl border-[4px] border-[color:var(--mc-wood)] bg-[color:var(--mc-sky)] text-[color:var(--mc-ink)] shadow-mc">
        <PixelBackground className="absolute inset-0 w-full h-full pointer-events-none select-none" />
  <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:gap-10 p-6 bg-white/35 backdrop-blur-sm border-2 border-[#5a3d1a] rounded-xl shadow-md">
          <div className="flex flex-col items-center gap-4 md:flex-row md:gap-6">
            <AvatarTile username="Erik" avatarUrl={avatarUrl} />
            <div className="flex-1 space-y-2">
              <h1 className="font-mc text-2xl text-[#f4d68e] drop-shadow-[1px_1px_0_#5a3d1a]">EJ Blocks & Bots</h1>
              <div className="max-w-lg">
                <XPBar />
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

      {/* Avatar House: Only Erik sees, at very end */}
      {isErik && <AvatarHouse current={currentAvatarFilename?.replace(/\.png$/, "")} />}
    </div>
  );
}