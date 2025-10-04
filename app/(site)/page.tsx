
// --- Imports ---
import supabaseServer from "@/lib/supabaseServer";
import { buildExcerpt, extractPostContent } from "@/lib/postContent";
import { resolveBadgeIcon } from "@/lib/badgeIcons";
import type { TablesRow } from "@/lib/database.types";
import AvatarTile from "@/components/AvatarTile";
import { getErikProfileAvatar, getErikUserId } from "@/lib/erik";
import Link from "next/link";
import ParrotSprite from "@/components/ParrotSprite";
import PixelBackground from "@/components/PixelBackground";
import XPBar from "@/components/XPBar";

// --- Types & Constants ---
const MESSAGE_WALL_LIMIT = 3;
const HUB_SUBTITLE = "Welcome to the base camp for Erik's stories, games, and projects.";
const MINECRAFT_TAG_SLUG = "minecraft";
const ERIK_EMAIL = "erik.ys.johansson@gmail.com";

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

// --- Main Page Function ---
export default async function Page() {
  // Always show Erik's avatar only
  const avatarUrl = await getErikProfileAvatar();
  const erikUserId = await getErikUserId();
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.toLowerCase() ?? "wenyu.yan@gmail.com";
  // Get current user for settings link
  const sb = supabaseServer();
  const { data: userRes } = await sb.auth.getUser();
  const user = userRes?.user ?? null;
  const isAdmin = user?.email?.toLowerCase() === adminEmail;
  const isErik = user?.id === erikUserId;

  // ...existing logic for posts, projects, badges, moderation...
  // ...existing JSX for the Home Hub page...
  return (
    <div className="space-y-10">
      {/* Home Hub JSX goes here. All content must be inside this parent div. */}
    </div>
  );
}

