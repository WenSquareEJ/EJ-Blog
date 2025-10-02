// /app/(site)/calendar/page.tsx
export const dynamic = "force-dynamic";

import Link from "next/link";
import { supabaseServer } from "@/lib/supabaseServer";

function toISO(d: Date) {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString();
}
function pad(n: number) {
  return n.toString().padStart(2, "0");
}
function monthLabel(y: number, m: number) {
  return new Date(y, m - 1, 1).toLocaleString(undefined, {
    month: "long",
    year: "numeric",
  });
}
function prevMonth(y: number, m: number) {
  return m === 1 ? { y: y - 1, m: 12 } : { y, m: m - 1 };
}
function nextMonth(y: number, m: number) {
  return m === 12 ? { y: y + 1, m: 1 } : { y, m: m + 1 };
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams?: { year?: string; month?: string; day?: string };
}) {
  const now = new Date();
  const year = Number(searchParams?.year || now.getFullYear());
  const month = Number(searchParams?.month || now.getMonth() + 1);
  const selectedDay = searchParams?.day ? Number(searchParams.day) : undefined;

  const monthStart = new Date(year, month - 1, 1);
  const nextStart = new Date(year, month, 1);

  const sb = supabaseServer();

  // Count posts by CREATED time so the badge/pin always shows
  const { data: postsInMonth } = await sb
    .from("posts")
    .select("id,title,created_at,status,published_at")
    .eq("status", "approved")
    .gte("created_at", toISO(monthStart))
    .lt("created_at", toISO(nextStart));

  const counts = new Map<number, number>();
  (postsInMonth || []).forEach((p: any) => {
    const d = new Date(p.created_at);
    counts.set(d.getDate(), (counts.get(d.getDate()) || 0) + 1);
  });

  // Posts for a selected day (by CREATED time)
  let postsForDay: any[] = [];
  if (selectedDay) {
    const dayStart = new Date(year, month - 1, selectedDay, 0, 0, 0);
    const dayEnd = new Date(year, month - 1, selectedDay + 1, 0, 0, 0);
    const { data } = await sb
      .from("posts")
      .select("id,title,content,created_at,published_at")
      .eq("status", "approved")
      .gte("created_at", toISO(dayStart))
      .lt("created_at", toISO(dayEnd))
      .order("created_at", { ascending: false });
    postsForDay = data || [];
  }

  const firstWeekday = monthStart.getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: Array<{ day?: number }> = [];
  for (let i = 0; i < firstWeekday; i++) cells.push({});
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d });
  while (cells.length % 7) cells.push({});

  const prev = prevMonth(year, month);
  const next = nextMonth(year, month);

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            href={`/calendar?year=${prev.y}&month=${prev.m}`}
            className="btn-mc"
          >
            ← {monthLabel(prev.y, prev.m)}
          </Link>
          <h1 className="font-mc text-base md:text-lg">
            {monthLabel(year, month)}
          </h1>
          <Link
            href={`/calendar?year=${next.y}&month=${next.m}`}
            className="btn-mc"
          >
            {monthLabel(next.y, next.m)} →
          </Link>
        </div>

        {/* month/year picker */}
        <form className="flex items-center gap-2" action="/calendar">
          <input type="hidden" name="day" value="" />
          <select
            name="month"
            defaultValue={month}
            className="border rounded-block px-2 py-1 font-mc text-xs"
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(2000, i, 1).toLocaleString(undefined, {
                  month: "long",
                })}
              </option>
            ))}
          </select>
          <select
            name="year"
            defaultValue={year}
            className="border rounded-block px-2 py-1 font-mc text-xs"
          >
            {Array.from({ length: 7 }).map((_, i) => {
              const y = now.getFullYear() - 3 + i;
              return (
                <option key={y} value={y}>
                  {y}
                </option>
              );
            })}
          </select>
          <button className="btn-mc" type="submit">
            Go
          </button>
        </form>
      </div>

      {/* Weekday labels (consistent font) */}
      <div className="grid grid-cols-7 text-[11px] font-mc text-mc-stone">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="px-2 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid with corner pins */}
      <div className="grid grid-cols-7 gap-2">
        {cells.map((cell, idx) => {
          const d = cell.day;
          const count = d ? counts.get(d) || 0 : 0;
          const isSelected = d && selectedDay === d;

          return (
            <div
              key={idx}
              className={`relative border rounded-block bg-white p-2 min-h-[76px] ${
                isSelected ? "ring-2 ring-mc-grass" : ""
              }`}
            >
              {typeof d === "number" && (
                <>
                  {/* day number */}
                  <div className="text-sm font-mc">{d}</div>

                  {/* corner pin with count */}
                  {count > 0 && (
                    <Link
                      href={`/calendar?year=${year}&month=${month}&day=${d}`}
                      className="absolute top-1 right-1 inline-flex items-center justify-center min-w-[22px] h-[18px] px-1 rounded-full bg-mc-grass text-white border border-black text-[11px] font-mc"
                      title={`${count} post${count > 1 ? "s" : ""}`}
                    >
                      {count}
                    </Link>
                  )}

                  {/* "View day" link */}
                  <Link
                    href={`/calendar?year=${year}&month=${month}&day=${d}`}
                    className="block mt-4 text-xs text-mc-stone link-underline"
                  >
                    View day →
                  </Link>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected day posts (body uses readable pixel font) */}
      {selectedDay && (
        <div className="mt-6">
          <h2 className="font-mc text-base">
            Posts on {year}-{pad(month)}-{pad(selectedDay)}
          </h2>
          <div className="mt-3 space-y-3">
            {postsForDay.length === 0 && (
              <p className="text-sm text-mc-stone">No posts on this day.</p>
            )}
            {postsForDay.map((p) => (
              <div key={p.id} className="card-block">
                <div className="flex items-center justify-between">
                  <h3 className="font-mc text-sm">{p.title}</h3>
                  <span className="text-[11px] text-mc-stone">
                    {new Date(p.published_at || p.created_at).toLocaleTimeString(
                      [],
                      { hour: "2-digit", minute: "2-digit" }
                    )}
                  </span>
                </div>
                <p className="post-body mt-1 line-clamp-3 whitespace-pre-wrap">
                  {p.content}
                </p>
                <Link
                  href={`/post/${p.id}`}
                  className="mt-2 inline-block link-underline text-sm"
                >
                  Open post
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
