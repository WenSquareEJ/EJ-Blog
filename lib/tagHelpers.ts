import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, TablesRow } from "./database.types";

export type TagRecord = Pick<TablesRow<"tags">, "id" | "name" | "slug">;

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

export async function attachTagsToPost(
  client: SupabaseClient<Database>,
  postId: string,
  tagNames: string[]
): Promise<{ tags: TagRecord[]; error: string | null }>
{
  if (!postId || tagNames.length === 0) {
    return { tags: [], error: null };
  }

  const tagPayloads = tagNames
    .map((name) => {
      const slug = slugifyTag(name);
      if (!slug) return null;
      return { name, slug } satisfies Pick<TablesRow<"tags">, "name" | "slug">;
    })
    .filter((value): value is { name: string; slug: string } => Boolean(value));

  if (tagPayloads.length === 0) {
    return { tags: [], error: null };
  }

  const { data: upsertedTags, error: upsertError } = await client
    .from("tags")
    .upsert(tagPayloads, { onConflict: "slug" })
    .select("id, name, slug");

  if (upsertError) {
    return { tags: [], error: upsertError.message };
  }

  const tags: TagRecord[] = (upsertedTags ?? [])
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

  return { tags, error: null };
}
