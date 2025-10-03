// /app/(site)/calendar/page.tsx
export const dynamic = "force-dynamic";

import Link from "next/link";
import { supabaseServer } from "@/lib/supabaseServer";

function toISO(d: Date) { return new Date(d.getTime() - d.getTimezoneOffset()*60000).toISOString(); }
function pad(n: number) { return n.toString().padStart(2, "0"); }
function monthLabel(y: number, m: number) {
  return new Date(y, m - 1, 1).toLocaleString(undefined, { month: "long", year: "numeric" });
}
function prevMonth(y: number, m: number) { return m === 1 ? { y: y - 1, m: 12 } : { y, m: m - 1 }; }
function nextMonth(y: number, m: number) { return m === 12 ? { y: y + 1, m: 1 } : { y, m: m + 1 }; }

export default async function CalendarPage({ searchParams }: {
  searchParams?: { year?: string; month?: string; day?: string }
}) {
  const now = new Date();
  const year = Number(searchParams?.year || now.getFullYear());
  const month = Number(searchParams?.month || (now.getMonth() + 1));
  const selectedDay = searchParams?.day ? Number(searchParams.day) : undefined;

  const monthStart = new Date(year, month - 1, 1);
  const nextStart  = new Date(year, month, 1);

  const sb = supabaseServer();

  // Count posts by CREATED time so the badge always shows
  const { data: postsInMonth } = await sb
    .from("posts")
    .select("id,title,created_at,status,published_at")
    .eq("status", "approved")
    .gte("created_at", toISO(monthStart))
    .lt("created_at", toISO(nextStart));

  const counts = new Map<number, number>();
  (postsInMonth || []).forEach(p => {
    const d = new Date(p.created_at);
    counts.set(d.getDate(), (counts.get(d.getDate()) || 0) + 1);
  });

  // Posts for a selected day (by CREATED time)
  let postsForDay: any[] = [];
  if (selectedDay) {
    const dayStart = new Date(year, month - 1, selectedDay, 0, 0, 0);
    const dayEnd   = new Date(year, month - 1, selectedDay + 1, 0, 0, 0);
    const { data } = await sb
      .from("posts")
      .select("id,title,content,created_at,published_at")
      .eq("status","approved")
      .gte("created_at", toISO(dayStart))
      .lt("created_at", toISO(dayEnd))
      .order("created_at", { ascending: false });
    postsForDay = data || [];
  }