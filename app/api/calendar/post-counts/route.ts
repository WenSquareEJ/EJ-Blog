import supabaseServer from "@/lib/supabaseServer";
import { NextResponse } from "next/server";

type CalendarPostRow = {
  id: string;
  published_at: string | null;
  created_at: string | null;
};

function parseInteger(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function buildDateFilterExpression(startIso: string, endIso: string): string {
  return `and(published_at.gte.${startIso},published_at.lt.${endIso}),and(published_at.is.null,created_at.gte.${startIso},created_at.lt.${endIso})`;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const yearParam = parseInteger(url.searchParams.get("year"));
  const monthParam = parseInteger(url.searchParams.get("month"));

  if (!yearParam || !monthParam || monthParam < 1 || monthParam > 12) {
    return NextResponse.json({ error: "Invalid year or month." }, { status: 400 });
  }

  const now = new Date();
  const minYear = now.getFullYear() - 5;
  const maxYear = now.getFullYear() + 2;

  if (yearParam < minYear || yearParam > maxYear) {
    return NextResponse.json({ error: "Year out of range." }, { status: 400 });
  }

  const monthIndex = monthParam - 1;
  const startOfMonth = new Date(Date.UTC(yearParam, monthIndex, 1));
  const startOfNextMonth = new Date(Date.UTC(yearParam, monthIndex + 1, 1));

  const startIso = startOfMonth.toISOString();
  const endIso = startOfNextMonth.toISOString();

  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("posts")
    .select("id, published_at, created_at")
    .eq("status", "approved")
    .or(buildDateFilterExpression(startIso, endIso));

  if (error) {
    console.error("[blog/calendar] failed to fetch counts via API", error);
    return NextResponse.json({ counts: {}, error: "Failed to load month." }, { status: 500 });
  }

  const counts: Record<number, number> = {};
  for (const row of (data ?? []) as CalendarPostRow[]) {
    const reference = row.published_at ?? row.created_at;
    if (!reference) continue;
    const parsed = new Date(reference);
    if (!Number.isFinite(parsed.getTime())) continue;
    if (
      parsed.getUTCFullYear() !== yearParam ||
      parsed.getUTCMonth() !== monthIndex
    ) {
      continue;
    }
    const day = parsed.getUTCDate();
    counts[day] = (counts[day] ?? 0) + 1;
  }

  return NextResponse.json(
    { counts },
    {
      status: 200,
      headers: {
        "cache-control": "no-store",
      },
    }
  );
}
