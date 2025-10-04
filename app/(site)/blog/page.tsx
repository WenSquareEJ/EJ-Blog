/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import supabaseServer from "@/lib/supabaseServer";
import CalendarWidget from "@/components/CalendarWidget";
import TagsWidget from "@/components/TagsWidget";
import { buildExcerpt, extractPostContent } from "@/lib/postContent";

const POSTS_PER_PAGE = 3;

type BlogSearchParams = {
  page?: string | string[];
  year?: string | string[];
  month?: string | string[];
  date?: string | string[];
};

type BlogPostRow = {
  id: string;
  title: string;
  content: string;
  content_html: string | null;
  image_url: string | null;
  created_at: string | null;
  published_at: string | null;
};

function parsePageParam(input: string | string[] | undefined): number {
  const raw = Array.isArray(input) ? input[0] : input;
  const parsed = parseInt(raw ?? "1", 10);
  if (Number.isNaN(parsed) || parsed < 1) {
    return 1;
  }
  return parsed;
}

function coerceSingleValue(input: string | string[] | undefined): string | null {
  if (Array.isArray(input)) {
    return typeof input[0] === "string" ? input[0] : null;
  }
  if (typeof input === "string") {
    return input;
  }
  return null;
}

function parseYearParam(
  input: string | string[] | undefined,
  minYear: number,
  maxYear: number
): number | null {
  const raw = coerceSingleValue(input)?.trim();
  if (!raw) return null;
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed)) return null;
  if (parsed < minYear || parsed > maxYear) return null;
  return parsed;
}

function parseMonthParam(input: string | string[] | undefined): number | null {
  const raw = coerceSingleValue(input)?.trim();
  if (!raw) return null;
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed) || parsed < 1 || parsed > 12) return null;
  return parsed;
}

function parseDateParam(
  input: string | string[] | undefined
): { iso: string; year: number; month: number; day: number } | null {
  const raw = coerceSingleValue(input)?.trim();
  if (!raw) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  const [yearStr, monthStr, dayStr] = raw.split("-");
  const year = Number.parseInt(yearStr, 10);
  const month = Number.parseInt(monthStr, 10);
  const day = Number.parseInt(dayStr, 10);
  if (
    Number.isNaN(year) ||
    Number.isNaN(month) ||
    Number.isNaN(day) ||
    month < 1 ||
    month > 12
  ) {
    return null;
  }

  const testDate = new Date(Date.UTC(year, month - 1, day));
  if (
    testDate.getUTCFullYear() !== year ||
    testDate.getUTCMonth() !== month - 1 ||
    testDate.getUTCDate() !== day
  ) {
    return null;
  }

  return { iso: raw, year, month, day };
}

function startOfDayUtc(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day));
}

function endOfDayUtc(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day + 1));
}

function buildDateFilterExpression(
  startIso: string,
  endIso: string
): string {
  return `and(published_at.gte.${startIso},published_at.lt.${endIso}),and(published_at.is.null,created_at.gte.${startIso},created_at.lt.${endIso})`;
}

function buildBlogHref({
  page,
  year,
  month,
  date,
}: {
  page?: number | null;
  year: number;
  month: number;
  date?: string | null;
}): string {
  const params = new URLSearchParams();
  params.set("year", String(year));
  params.set("month", String(month).padStart(2, "0"));
  if (date) {
    params.set("date", date);
  }
  if (page && page > 1) {
    params.set("page", String(page));
  }
  const queryString = params.toString();
  return queryString.length > 0 ? `/blog?${queryString}` : "/blog";
}

function formatPublishedDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function pickPostHref(post: { id: string }) {
  return `/post/${post.id}`;
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams?: BlogSearchParams;
}) {
  const sb = supabaseServer();
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const minYear = currentYear - 5;
  const maxYear = currentYear + 2;

  const parsedDate = parseDateParam(searchParams?.date);
  const selectedDate =
    parsedDate && parsedDate.year >= minYear && parsedDate.year <= maxYear
      ? parsedDate
      : null;

  const parsedYear = parseYearParam(searchParams?.year, minYear, maxYear);
  const parsedMonth = parseMonthParam(searchParams?.month);

  let viewYear = selectedDate?.year ?? parsedYear ?? currentYear;
  if (viewYear < minYear) {
    viewYear = minYear;
  } else if (viewYear > maxYear) {
    viewYear = maxYear;
  }

  let viewMonth = selectedDate?.month ?? parsedMonth ?? currentMonth;
  if (viewMonth < 1 || viewMonth > 12) {
    viewMonth = currentMonth;
  }

  const selectedDateIso = selectedDate?.iso ?? null;
  const dateFilterRange = selectedDate
    ? {
        start: startOfDayUtc(selectedDate.year, selectedDate.month, selectedDate.day).toISOString(),
        end: endOfDayUtc(selectedDate.year, selectedDate.month, selectedDate.day).toISOString(),
      }
    : null;

  const dateFilterExpression = dateFilterRange
    ? buildDateFilterExpression(dateFilterRange.start, dateFilterRange.end)
    : null;

  const page = parsePageParam(searchParams?.page);
  const from = (page - 1) * POSTS_PER_PAGE;
  const to = from + POSTS_PER_PAGE - 1;

  let postsQuery = sb
    .from("posts")
    .select(
      "id, title, content, content_html, image_url, created_at, published_at"
    )
    .eq("status", "approved");

  if (dateFilterExpression) {
    postsQuery = postsQuery.or(dateFilterExpression);
  }

  postsQuery = postsQuery.order("created_at", { ascending: false });

  const {
    data: postsData,
    error: postsError,
  } = await postsQuery.range(from, to);

  let countQuery = sb
    .from("posts")
    .select("id", { count: "exact", head: true })
    .eq("status", "approved");

  if (dateFilterExpression) {
    countQuery = countQuery.or(dateFilterExpression);
  }

  const {
    count: totalCount,
    error: countError,
  } = await countQuery;

  if (postsError) {
    console.error("[blog] failed to load posts", postsError);
  }

  if (countError) {
    console.error("[blog] failed to count posts", countError);
  }

  const rawPosts = (postsData ?? []) as BlogPostRow[];

  const posts = rawPosts.map((post) => {
    const { text } = extractPostContent({
      content: post.content,
      content_html: post.content_html,
    });

    return {
      id: post.id,
      title: post.title && post.title.trim().length > 0 ? post.title : "Untitled",
      href: pickPostHref(post),
      excerpt: buildExcerpt(text),
      imageUrl: post.image_url ?? null,
      createdAt: post.published_at ?? post.created_at ?? null,
    };
  });

  const totalPages = totalCount ? Math.max(1, Math.ceil(totalCount / POSTS_PER_PAGE)) : 1;
  const hasPrevPage = page > 1;
  const hasNextPage = page < totalPages;

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="font-mc text-3xl">Latest Stories</h1>
        <p className="text-sm text-mc-stone">
          Explore Erik&apos;s newest tales, builds, and adventures.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <section className="space-y-6">
          {postsError ? (
            <div className="card-block border border-red-400 bg-red-50 text-red-700">
              We couldn&apos;t load posts right now. Please try again later.
            </div>
          ) : posts.length === 0 ? (
            <div className="card-block text-mc-stone">
              No stories yet. Check back soon!
            </div>
          ) : (
            <ul className="space-y-4">
              {posts.map((post) => {
                const publishedLabel = formatPublishedDate(post.createdAt);
                return (
                  <li key={post.id} className="card-block space-y-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Link href={post.href} className="font-mc text-xl hover:underline">
                          {post.title}
                        </Link>
                        {publishedLabel && (
                          <span className="text-xs uppercase tracking-[0.18em] text-mc-stone">
                            {publishedLabel}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-mc-ink/80">{post.excerpt}</p>
                    </div>
                    {post.imageUrl && (
                      <div className="overflow-hidden rounded-lg border-2 border-mc-wood-dark">
                        <img
                          src={post.imageUrl}
                          alt={post.title}
                          className="h-auto w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <Link href={post.href} className="btn-mc">
                      Read Post
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {hasPrevPage ? (
              <Link
                href={buildBlogHref({
                  page: page - 1,
                  year: viewYear,
                  month: viewMonth,
                  date: selectedDateIso,
                })}
                className="btn-mc-secondary"
              >
                Previous
              </Link>
            ) : (
              <span className="btn-mc-secondary cursor-not-allowed opacity-50">
                Previous
              </span>
            )}
            <span className="text-xs uppercase tracking-[0.18em] text-mc-stone">
              Page {page} of {totalPages}
            </span>
            {hasNextPage ? (
              <Link
                href={buildBlogHref({
                  page: page + 1,
                  year: viewYear,
                  month: viewMonth,
                  date: selectedDateIso,
                })}
                className="btn-mc-secondary"
              >
                Next
              </Link>
            ) : (
              <span className="btn-mc-secondary cursor-not-allowed opacity-50">
                Next
              </span>
            )}
          </div>
        </section>

        <aside className="space-y-4">
          <CalendarWidget
            viewYear={viewYear}
            viewMonth={viewMonth}
            selectedDate={selectedDateIso}
            yearBounds={{ min: minYear, max: maxYear }}
          />
          <TagsWidget />
        </aside>
      </div>
    </div>
  );
}
