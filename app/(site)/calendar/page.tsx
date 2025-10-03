// app/(site)/calendar/page.tsx
import Link from "next/link";
import { createServerClient } from "@/lib/supabaseServer";

// ---- helpers ---------------------------------------------------------------

function toISO(d: Date) {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString();
}

function monthName(year: number, monthIdx: number) {
  return new Date(year, monthIdx, 1).toLocaleString("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "Europe/London",
  });
}

function startOfMonth(year: number, monthIdx: number) {
  return new Date(Date.UTC(year, monthIdx, 1, 0, 0, 0));
}
function endOfMonth(year: number, monthIdx: number) {
  // last day of month at 23:59:59.999 UTC
  return new Date(Date.UTC(year, monthIdx + 1, 0, 23, 59, 59, 999));
}

function startOfCalendarGrid(firstOfMonth: Date) {
  // Sunday-start grid
  const js = new Date(firstOfMonth);
  const day = js.getUTCDay(); // 0..6 (Sun..Sat)
  js.setUTCDate(js.getUTCDate() - day);
  return js;
}

function addDays(d: Date, n: number) {
  const copy = new Date(d);
  copy.setUTCDate(copy.getUTCDate() + n);
  return copy;
}

function ymd(d: Date) {
  // YYYY-MM-DD in London
  const ld = new Date(d.toLocaleString("en-GB", { timeZone: "Europe/London" }));
  const y = ld.getFullYear();
  const m = String(ld.getMonth() + 1).padStart(2, "0");
  const dd = String(ld.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

// ---- page ------------------------------------------------------------------

export default async function CalendarPage({
  searchParams,
}: {
  searchParams?: { y?: string; m?: string; day?: string };
}) {
  // Choose the month to display
  const now = new Date();
  const year = Number(searchParams?.y) || now.getFullYear();
  // user can pass 1–12; convert to 0–11
  const monthIdx =
    (searchParams?.m ? Number(searchParams.m) - 1 : now.getMonth()) ?? 0;

  const dayParam = searchParams?.day ? Number(searchParams.day) : undefined;

  // Month boundaries (London)
  const monthStart = startOfMonth(year, monthIdx);
  const monthEnd = endOfMonth(year, monthIdx);

  // Fetch all APPROVED posts in this month (single query)
  const sb = createServerClient();
  const { data: posts, error } = await sb
    .from("posts")
    .select("id,title,created_at,status")
    .eq("status", "approved")
    .gte("created_at", toISO(monthStart))
    .lte("created_at", toISO(monthEnd))
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-3 py-6">
        <h1 className="font-mc text-lg mb-2">Calendar</h1>
        <p className="text-red-700">Error loading posts: {error.message}</p>
      </div>
    );
  }

  // Group posts by YYYY-MM-DD (London)
  const byDay = new Map<string, { id: string; title: string; created_at: string }[]>();
  (posts ?? []).forEach((p) => {
    const k = ymd(new Date(p.created_at));
    const arr = byDay.get(k) || [];
    arr.push(p as any);
    byDay.set(k, arr);
  });

  // Build a 6x7 grid (always 42 days) starting on Sunday
  const firstOfMonth = startOfMonth(year, monthIdx);
  const gridStart = startOfCalendarGrid(firstOfMonth);
  const days: Date[] = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));

  // Prev / next month links
  const prev = new Date(Date.UTC(year, monthIdx, 1));
  prev.setUTCMonth(prev.getUTCMonth() - 1);
  const next = new Date(Date.UTC(year, monthIdx, 1));
  next.setUTCMonth(next.getUTCMonth() + 1);
  const prevHref = `/calendar?y=${prev.getUTCFullYear()}&m=${prev.getUTCMonth() + 1}`;
  const nextHref = `/calendar?y=${next.getUTCFullYear()}&m=${next.getUTCMonth() + 1}`;
  const headerLabel = monthName(year, monthIdx);

  // If a day is selected, get that day's posts
  let selectedDayPosts:
    | { id: string; title: string; created_at: string }[]
    | undefined;
  if (dayParam && dayParam >= 1 && dayParam <= 31) {
    const key = ymd(new Date(Date.UTC(year, monthIdx, dayParam)));
    selectedDayPosts = byDay.get(key);
  }

  return (
    <div className="max-w-5xl mx-auto px-3 py-5">
      <div className="mb-4 flex items-center justify-between">
        <Link className="btn-mc" href={prevHref}>
          ‹ Prev
        </Link>
        <h1 className="font-mc text-base md:text-lg">{headerLabel}</h1>
        <Link className="btn-mc" href={nextHref}>
          Next ›
        </Link>
      </div>

      <div className="grid grid-cols-7 text-center text-xs font-bold uppercase tracking-wide mb-1">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="py-2">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((d) => {
          const inMonth = d.getUTCMonth() === monthIdx;
          const key = ymd(d);
          const count = byDay.get(key)?.length ?? 0;
          const dayNum = new Date(d.toLocaleString("en-GB", { timeZone: "Europe/London" })).getDate();
          const href = `/calendar?y=${year}&m=${monthIdx + 1}&day=${dayNum}`;
          return (
            <Link
              href={href}
              key={key}
              className={[
                "block rounded border p-2 min-h-[64px] hover:brightness-95",
                inMonth ? "bg-white" : "bg-gray-100 text-gray-400",
                "border-black",
              ].join(" ")}
            >
              <div className="flex items-start justify-between">
                <span className="text-[11px]">{dayNum}</span>
                {count > 0 && (
                  <span className="inline-flex items-center justify-center text-[10px] px-1.5 py-[1px] border border-black rounded bg-[var(--mc-sky)]">
                    {count}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Selected day panel */}
      {dayParam && (
        <div className="mt-6">
          <h2 className="font-mc text-sm mb-2">
            Posts on {year}-{String(monthIdx + 1).padStart(2, "0")}-
            {String(dayParam).padStart(2, "0")}
          </h2>

          {!selectedDayPosts || selectedDayPosts.length === 0 ? (
            <p className="text-sm">No posts this day.</p>
          ) : (
            <ul className="space-y-2">
              {selectedDayPosts.map((p) => (
                <li
                  key={p.id}
                  className="border border-black rounded p-2 bg-white hover:brightness-95"
                >
                  <Link className="underline" href={`/post/${p.id}`}>
                    {p.title || "Untitled"}
                  </Link>
                  <div className="text-[11px] opacity-70">
                    {new Date(p.created_at).toLocaleString("en-GB", {
                      timeZone: "Europe/London",
                    })}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
