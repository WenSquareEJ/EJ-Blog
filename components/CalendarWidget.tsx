import CalendarGrid from "@/components/CalendarGrid";
import supabaseServer from "@/lib/supabaseServer";

type CalendarPostRow = {
  id: string;
  published_at: string | null;
  created_at: string | null;
};

function buildPostDate(rawPublished: string | null, rawCreated: string | null) {
  const value = rawPublished ?? rawCreated;
  if (!value) return null;
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return null;
  return parsed;
}

export default async function CalendarWidget() {
  const sb = supabaseServer();
  const now = new Date();
  const year = now.getFullYear();
  const monthIndex = now.getMonth();
  const monthNumber = monthIndex + 1;

  const startOfMonth = new Date(Date.UTC(year, monthIndex, 1));
  const startOfNextMonth = new Date(Date.UTC(year, monthIndex + 1, 1));

  const { data, error } = await sb
    .from("posts")
    .select("id, published_at, created_at")
    .eq("status", "approved")
    .gte("created_at", startOfMonth.toISOString())
    .lt("created_at", startOfNextMonth.toISOString());

  if (error) {
    console.error("[blog/calendar] failed to load posts for calendar", error);
  }

  const counts: Record<number, number> = {};
  let totalCount = 0;

  for (const post of (data ?? []) as CalendarPostRow[]) {
    const date = buildPostDate(post.published_at, post.created_at);
    if (!date) continue;
    const localYear = date.getFullYear();
    const localMonth = date.getMonth();
    if (localYear !== year || localMonth !== monthIndex) continue;
    const day = date.getDate();
    counts[day] = (counts[day] ?? 0) + 1;
    totalCount += 1;
  }

  return (
    <section className="card-block space-y-4">
      <div>
        <h2 className="font-mc text-lg">Post Calendar</h2>
        <p className="text-xs text-mc-stone">
          {now.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </p>
      </div>
      <CalendarGrid year={year} month={monthNumber} counts={counts} />
      {totalCount === 0 && (
        <p className="text-xs text-mc-stone">No posts yet this month.</p>
      )}
    </section>
  );
}
