import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, TablesRow } from "./database.types";
import { checkAndAwardBadgesForUser } from "./badges/checkAndAwardForUser";

export type TagRecord = Pick<TablesRow<"tags">, "id" | "name" | "slug">;

const TAG_SLUG_NORMALIZATION: Record<string, string> = {
  mincraft: "minecraft",
  minecrft: "minecraft",
};

export function normalizeTagSlug(
  input: string | null | undefined,
  options?: { defaultSlug?: string }
): string {
  const fallback = options?.defaultSlug?.trim().toLowerCase() ?? "";
  const raw = (input ?? "").trim().toLowerCase();
  const slug = raw || fallback;
  if (!slug) return "";
  const normalized = TAG_SLUG_NORMALIZATION[slug] ?? slug;
  return normalized.toLowerCase();
}

export function resolveTagSlugVariants(
  input: string | null | undefined,
  options?: { defaultSlug?: string }
): string[] {
  const canonical = normalizeTagSlug(input, options);
  if (!canonical) return [];
  const variants = new Set<string>([canonical]);
  for (const [typo, target] of Object.entries(TAG_SLUG_NORMALIZATION)) {
    if (target === canonical) {
      variants.add(typo);
    }
  }
  return Array.from(variants);
}

export function sanitizeTagNames(input: string[] | null | undefined): string[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  const cleaned: string[] = [];

  for (const raw of input) {
    if (typeof raw !== "string") continue;
    const normalized = raw.trim().toLowerCase();
    if (!normalized || normalized.length > 20) continue;
    if (seen.has(normalized)) continue;
    cleaned.push(normalized);
    seen.add(normalized);
    if (cleaned.length >= 12) break;
  }

  return cleaned;
}

export function slugifyTag(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug.slice(0, 50);
}

type AttachTagsOptions = {
  authorId?: string | null;
};

export async function attachTagsToPost(
  client: SupabaseClient<Database>,
  postId: string,
  tagNames: string[],
  options?: AttachTagsOptions
): Promise<{ tags: TagRecord[]; error: string | null }>
{
  if (!postId) {
    return { tags: [], error: null };
  }

  const tagPayloads = tagNames
    .map((name) => {
      const slug = slugifyTag(name);
      if (!slug) return null;
      return { name, slug } satisfies Pick<TablesRow<"tags">, "name" | "slug">;
    })
    .filter((value): value is { name: string; slug: string } => Boolean(value));

  let tags: TagRecord[] = [];

  if (tagPayloads.length > 0) {
    const { data: upsertedTags, error: upsertError } = await client
      .from("tags")
      .upsert(tagPayloads, { onConflict: "slug" })
      .select("id, name, slug");

    if (upsertError) {
      return { tags: [], error: upsertError.message };
    }

    tags = (upsertedTags ?? [])
      .map((tag) => {
        if (!tag.id) return null;
        return {
          id: tag.id,
          name: tag.name,
          slug: tag.slug,
        } satisfies TagRecord;
      })
      .filter((tag): tag is TagRecord => Boolean(tag));

    if (tags.length === 0) {
      return { tags: [], error: null };
    }

    const linkPayload = tags.map((tag) => ({
      post_id: postId,
      tag_id: tag.id,
    }));

    const { error: linkError } = await client
      .from("post_tags")
      .upsert(linkPayload, { onConflict: "post_id,tag_id" });

    if (linkError) {
      return { tags, error: linkError.message };
    }
  }

  if (options?.authorId) {
    try {
      await checkAndAwardBadgesForUser({
        userId: options.authorId,
        reader: client,
      });
    } catch (error) {
      console.error('[badges/check-award] Tag update follow-up failed', {
        postId,
        userId: options.authorId,
        error,
      });
    }
  }

  return { tags, error: null };
}
