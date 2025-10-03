// /app/(site)/page.tsx
import Link from "next/link";
import PostCard from "@/components/PostCard";
import supabaseServer from "@/lib/supabaseServer";
import { buildExcerpt, extractPostContent } from "@/lib/postContent";
import type { TablesRow } from "@/lib/database.types";

const PER_PAGE = 3;
const TIMEZONE = "Europe/London";

type SearchParams = {
  page?: string | string[];
  tag?: string | string[];
  date?: string | string[];
  y?: string | string[];
  m?: string | string[];
};

type TagRow = { id: number; name: string; slug: string };
type PostRow = {
  id: string;
  title: string;
  content: string | null;
  content_html: string | null;
  created_at: string;
};

type MonthlyPost = { id: string; title: string; created_at: string };
type MonthlyPostRow = Pick<TablesRow<"posts">, "id" | "title" | "created_at">;

function toISO(date: Date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString();
}

function startOfMonth(year: number, monthIdx: number) {
  return new Date(Date.UTC(year, monthIdx, 1, 0, 0, 0));
}

function endOfMonth(year: number, monthIdx: number) {
  return new Date(Date.UTC(year, monthIdx + 1, 0, 23, 59, 59, 999));
}

function startOfCalendarGrid(firstOfMonth: Date) {
  const js = new Date(firstOfMonth);
  const day = js.getUTCDay();
  js.setUTCDate(js.getUTCDate() - day);
  return js;
}

function addDays(date: Date, amount: number) {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() + amount);
  return copy;
}

function toLondonDateKey(date: Date) {
  const london = new Date(date.toLocaleString("en-GB", { timeZone: TIMEZONE }));
  const y = london.getFullYear();
  const m = String(london.getMonth() + 1).padStart(2, "0");
  const d = String(london.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function monthName(year: number, monthIdx: number) {
  return new Date(year, monthIdx, 1).toLocaleString("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: TIMEZONE,
  });
}

function parseParam(value?: string | string[]) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function buildHref(
  current: SearchParams | undefined,
  overrides: Record<string, string | undefined>
) {
  const params = new URLSearchParams();

  if (current) {
    Object.entries(current).forEach(([key, raw]) => {
      if (!raw) return;
      const value = Array.isArray(raw) ? raw[0] : raw;
      if (value) params.set(key, value);
    });
  }

  Object.entries(overrides).forEach(([key, value]) => {
    if (!value) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
  });

  const qs = params.toString();
  return qs ? `/?${qs}` : "/";
}

function formatDayLabel(dateString: string) {
  const date = new Date(`${dateString}T00:00:00Z`);
  return date.toLocaleDateString("en-GB", {
    timeZone: TIMEZONE,
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function HomePage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const sb = supabaseServer();

  const pageParam = parseParam(searchParams?.page) ?? "1";
  const page = Math.max(parseInt(pageParam, 10) || 1, 1);

  const tagSlug = parseParam(searchParams?.tag);
  const dateParam = parseParam(searchParams?.date);

  const now = new Date();
  const requestedYear = parseInt(parseParam(searchParams?.y) ?? "", 10);
  const requestedMonth = parseInt(parseParam(searchParams?.m) ?? "", 10);

  let year = Number.isFinite(requestedYear) ? requestedYear : now.getFullYear();
  let monthIdx =
    Number.isFinite(requestedMonth) && requestedMonth >= 1 && requestedMonth <= 12
      ? requestedMonth - 1
      : now.getMonth();

  let selectedDate: string | null = null;
  if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
    const parsed = new Date(`${dateParam}T00:00:00Z`);
    if (!Number.isNaN(parsed.getTime())) {
      selectedDate = dateParam;
      year = parsed.getUTCFullYear();
      monthIdx = parsed.getUTCMonth();
    }
  }

  const from = (page - 1) * PER_PAGE;
  const to = from + PER_PAGE - 1;

  const { data: tagsData } = await sb
    .from("tags")
    .select("id, name, slug")
    .order("name", { ascending: true });
  const tags = (tagsData ?? []) as TagRow[];

  const activeTag = tagSlug
    ? tags.find((tag) => tag.slug === tagSlug) ?? null
    : null;

  let tagPostIds: string[] | null = null;
  if (activeTag) {
    const { data: links } = await sb
      .from("post_tags")
      .select("post_id")
      .eq("tag_id", activeTag.id);
    tagPostIds = (links ?? []).map((row: any) => row.post_id as string);
  }

  const monthStart = startOfMonth(year, monthIdx);
  const monthEnd = endOfMonth(year, monthIdx);
  const { data: monthlyPosts } = await sb
    .from("posts")
    .select("id, title, created_at")
    .eq("status", "approved")
    .gte("created_at", toISO(monthStart))
    .lte("created_at", toISO(monthEnd))
    .order("created_at", { ascending: false });

  const postsByDay = new Map<string, MonthlyPost[]>();
  ((monthlyPosts ?? []) as MonthlyPostRow[]).forEach((post) => {
    if (!post.created_at) return;
    const createdAt = new Date(post.created_at);
    if (Number.isNaN(createdAt.getTime())) return;
    const key = toLondonDateKey(createdAt);
    const bucket = postsByDay.get(key) ?? [];
    bucket.push({ id: post.id, title: post.title, created_at: post.created_at });
    postsByDay.set(key, bucket);
  });

  let postsError: string | null = null;
  let posts: PostRow[] = [];

  if (tagPostIds !== null && tagPostIds.length === 0) {
    posts = [];
  } else {
    let query = sb
      .from("posts")
      .select("id, title, content, content_html, created_at")
      .eq("status", "approved")
      .order("created_at", { ascending: false });

    if (tagPostIds && tagPostIds.length > 0) {
      query = query.in("id", tagPostIds);
    }

    if (selectedDate) {
      const startDate = new Date(`${selectedDate}T00:00:00Z`);
      const endDate = new Date(startDate);
      endDate.setUTCDate(endDate.getUTCDate() + 1);
      query = query
        .gte("created_at", startDate.toISOString())
        .lt("created_at", endDate.toISOString());
    }

    const { data, error } = await query.range(from, to);
    posts = (data ?? []) as PostRow[];
    if (error) {
      postsError = error.message;
    }
  }

  const postSummaries = posts.map((post) => {
    const { html, text } = extractPostContent({
      content_html: post.content_html,
      content: post.content,
    });
    return {
      id: post.id,
      title: post.title,
      html,
      text,
      excerpt: buildExcerpt(text),
    };
  });

  const days = Array.from({ length: 42 }, (_, i) => addDays(startOfCalendarGrid(monthStart), i));
  const monthLabel = monthName(year, monthIdx);

  const prev = new Date(Date.UTC(year, monthIdx, 1));
  prev.setUTCMonth(prev.getUTCMonth() - 1);
  const next = new Date(Date.UTC(year, monthIdx, 1));
  next.setUTCMonth(next.getUTCMonth() + 1);

  const prevHref = buildHref(searchParams, {
    y: String(prev.getUTCFullYear()),
    m: String(prev.getUTCMonth() + 1),
    date: undefined,
    page: undefined,
  });

  const nextHref = buildHref(searchParams, {
    y: String(next.getUTCFullYear()),
    m: String(next.getUTCMonth() + 1),
    date: undefined,
    page: undefined,
  });

  const allHref = buildHref(searchParams, {
    tag: undefined,
    date: undefined,
    page: undefined,
    y: undefined,
    m: undefined,
  });

  const filtersActive = Boolean(activeTag || selectedDate);

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <aside className="flex flex-col gap-6 lg:w-72 xl:w-80">
        <section className="card-block space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-mc text-[0.8rem] uppercase tracking-[0.14em]">
              Tags
            </h2>
            <Link
              href={allHref}
              className="text-[0.65rem] uppercase tracking-[0.18em] text-mc-stone hover:underline"
            >
              All posts
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => {
              const isActive = activeTag?.id === tag.id;
              const href = buildHref(searchParams, {
                tag: tag.slug,
                page: undefined,
              });
              return (
                <Link
                  key={tag.id}
                  href={href}
                  className={`btn-mc-secondary ${
                    isActive ? "ring-2 ring-mc-wood-dark" : ""
                  }`}
                >
                  {tag.name}
                </Link>
              );
            })}
          </div>
        </section>

        <section className="card-block space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-mc text-[0.8rem] uppercase tracking-[0.14em]">
              Calendar
            </h2>
            <div className="flex items-center gap-1">
              <Link className="btn-mc px-2" href={prevHref}>
                ‹
              </Link>
              <div className="text-[0.7rem] uppercase tracking-[0.12em] text-mc-stone">
                {monthLabel}
              </div>
              <Link className="btn-mc px-2" href={nextHref}>
                ›
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[0.6rem] uppercase tracking-[0.12em]">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="py-1 text-mc-stone">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const key = toLondonDateKey(day);
              const inMonth = day.getUTCMonth() === monthIdx;
              const count = postsByDay.get(key)?.length ?? 0;
              const displayDay = new Date(
                day.toLocaleString("en-GB", { timeZone: TIMEZONE })
              ).getDate();
              const dayHref = buildHref(searchParams, {
                date: key,
                y: String(year),
                m: String(monthIdx + 1),
                page: undefined,
              });
              const isSelected = selectedDate === key;

              return (
                <Link
                  key={key + String(displayDay)}
                  href={dayHref}
                  className={`flex min-h-[52px] flex-col items-center justify-center rounded border-2 border-mc-wood-dark px-1 py-1 text-[0.65rem] transition hover:brightness-105 ${
                    inMonth ? "bg-mc-parchment" : "bg-mc-sand/40 text-mc-stone"
                  } ${isSelected ? "ring-2 ring-mc-wood-dark" : ""}`}
                >
                  <span>{displayDay}</span>
                  {count > 0 && (
                    <span className="mt-1 rounded-sm bg-mc-wood-light px-1 text-[0.55rem] text-mc-parchment">
                      {count}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
          {selectedDate && (
            <div className="rounded-md border border-mc-wood-dark bg-mc-parchment px-2 py-1 text-[0.68rem] text-mc-dirt">
              Selected day: {formatDayLabel(selectedDate)}
            </div>
          )}
        </section>
      </aside>

      <section className="flex-1 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-mc text-base uppercase tracking-[0.18em] sm:text-lg">
            Blog Posts
          </h1>
          {filtersActive && (
            <Link href={allHref} className="btn-mc-secondary">
              Clear filters
            </Link>
          )}
          {activeTag && (
            <span className="rounded-full border border-mc-wood-dark bg-mc-sand px-3 py-1 text-[0.7rem] uppercase tracking-[0.12em] text-mc-dirt">
              Tag: {activeTag.name}
            </span>
          )}
          {selectedDate && (
            <span className="rounded-full border border-mc-wood-dark bg-mc-sand px-3 py-1 text-[0.7rem] uppercase tracking-[0.12em] text-mc-dirt">
              Date: {formatDayLabel(selectedDate)}
            </span>
          )}
        </div>

        {postsError && (
          <div className="card-block border-red-500 text-red-700">
            Failed to load posts: {postsError}
          </div>
        )}

        {!postsError && posts.length === 0 && (
          <div className="card-block text-sm text-mc-stone">
            No posts found for these filters.
          </div>
        )}

        <div className="space-y-4">
          {postSummaries.map((post) => (
            <PostCard
              key={post.id}
              id={post.id}
              title={post.title}
              excerpt={post.excerpt}
            />
          ))}
        </div>

        <div className="flex gap-2 pt-2">
          {page > 1 && (
            <Link
              href={buildHref(searchParams, { page: String(page - 1) })}
              className="btn-mc-secondary"
            >
              Previous
            </Link>
          )}
          {posts.length === PER_PAGE && (
            <Link
              href={buildHref(searchParams, { page: String(page + 1) })}
              className="btn-mc-secondary"
            >
              Next
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
