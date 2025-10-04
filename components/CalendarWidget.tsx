import CalendarWidgetClient from "@/components/CalendarWidgetClient";
import supabaseServer from "@/lib/supabaseServer";

type CalendarPostRow = {
  id: string;
  published_at: string | null;
  created_at: string | null;
};

type CalendarWidgetProps = {
  viewYear: number;
  viewMonth: number;
  selectedDate: string | null;
  yearBounds: { min: number; max: number };
};

function buildPostDate(rawPublished: string | null, rawCreated: string | null) {
  const value = rawPublished ?? rawCreated;
  if (!value) return null;
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return null;
  return parsed;
}

function buildDateFilterExpression(startIso: string, endIso: string): string {
  return `and(published_at.gte.${startIso},published_at.lt.${endIso}),and(published_at.is.null,created_at.gte.${startIso},created_at.lt.${endIso})`;
}

export default async function CalendarWidget({
  viewYear,
  viewMonth,
  selectedDate,
  yearBounds,
}: CalendarWidgetProps) {
  const sb = supabaseServer();
  const safeMonth = Math.min(Math.max(viewMonth, 1), 12);
  const monthIndex = safeMonth - 1;
  const startOfMonth = new Date(Date.UTC(viewYear, monthIndex, 1));
  const startOfNextMonth = new Date(Date.UTC(viewYear, monthIndex + 1, 1));

  const startIso = startOfMonth.toISOString();
  const endIso = startOfNextMonth.toISOString();

  let counts: Record<number, number> = {};
  let loadError = false;

  const { data, error } = await sb
    .from("posts")
    .select("id, published_at, created_at")
    .eq("status", "approved")
    .or(buildDateFilterExpression(startIso, endIso));

  if (error) {
    loadError = true;
    console.error("[blog/calendar] failed to load posts for calendar", error);
  }

  if (!loadError && Array.isArray(data)) {
    const totals: Record<number, number> = {};
    for (const row of data as CalendarPostRow[]) {
      const date = buildPostDate(row.published_at, row.created_at);
      if (!date) continue;
      const year = date.getUTCFullYear();
      const month = date.getUTCMonth();
      if (year !== viewYear || month !== monthIndex) continue;
      const day = date.getUTCDate();
      totals[day] = (totals[day] ?? 0) + 1;
    }
    counts = totals;
  }

  return (
    <section className="card-block space-y-4">
      <CalendarWidgetClient
        initialYear={viewYear}
        initialMonth={viewMonth}
        selectedDate={selectedDate}
        initialCounts={counts}
        initialErrored={loadError}
        yearBounds={yearBounds}
      />
    </section>
  );
}
