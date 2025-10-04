'use client';

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import CalendarGrid from "@/components/CalendarGrid";

const MONTH_OPTIONS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

type CalendarCounts = Record<number, number>;

type YearBounds = { min: number; max: number };

type CalendarWidgetClientProps = {
  initialYear: number;
  initialMonth: number;
  selectedDate: string | null;
  initialCounts: CalendarCounts;
  initialErrored: boolean;
  yearBounds: YearBounds;
};

type IsoParts = {
  year: number;
  month: number;
  day: number;
};

function parseIsoDate(value: string | null): IsoParts | null {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [yearStr, monthStr, dayStr] = value.split("-");
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
  return { year, month, day };
}

function formatIsoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function normalizeCounts(value: Record<string, number> | CalendarCounts | null | undefined): CalendarCounts {
  const result: CalendarCounts = {};
  if (!value) return result;
  for (const [key, rawCount] of Object.entries(value)) {
    const day = Number.parseInt(key, 10);
    if (Number.isNaN(day) || day < 1 || day > 31) continue;
    const count = typeof rawCount === "number" && Number.isFinite(rawCount) ? rawCount : 0;
    if (count > 0) {
      result[day] = count;
    }
  }
  return result;
}

function clampYear(year: number, bounds: YearBounds): number {
  if (year < bounds.min) return bounds.min;
  if (year > bounds.max) return bounds.max;
  return year;
}

function buildAnnouncement(year: number, month: number): string {
  const option = MONTH_OPTIONS.find((entry) => entry.value === month);
  const monthName = option ? option.label : "Month";
  return `${monthName} ${year}`;
}

export default function CalendarWidgetClient({
  initialYear,
  initialMonth,
  selectedDate,
  initialCounts,
  initialErrored,
  yearBounds,
}: CalendarWidgetClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const skipFetchRef = useRef(true);

  const normalizedInitialCounts = useMemo(() => normalizeCounts(initialCounts), [initialCounts]);
  const initialActiveParts = useMemo(() => {
    const parsed = parseIsoDate(selectedDate);
    if (!parsed) return null;
    if (parsed.year !== initialYear || parsed.month !== initialMonth) return null;
    return parsed;
  }, [selectedDate, initialYear, initialMonth]);

  const [viewYear, setViewYear] = useState(initialYear);
  const [viewMonth, setViewMonth] = useState(initialMonth);
  const [activeDate, setActiveDate] = useState<string | null>(
    initialActiveParts ? formatIsoDate(initialActiveParts.year, initialActiveParts.month, initialActiveParts.day) : null
  );
  const [counts, setCounts] = useState<CalendarCounts>(normalizedInitialCounts);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    initialErrored ? "We couldn't load this month. Try again later." : null
  );

  const announcement = useMemo(() => buildAnnouncement(viewYear, viewMonth), [viewYear, viewMonth]);
  const totalPosts = useMemo(() => Object.values(counts).reduce((total, value) => total + value, 0), [counts]);

  const today = useMemo(() => {
    const now = new Date();
    return {
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      day: now.getDate(),
    } satisfies IsoParts;
  }, []);

  useEffect(() => {
    skipFetchRef.current = true;
    setViewYear(initialYear);
    setViewMonth(initialMonth);
    setCounts(normalizedInitialCounts);
    if (initialActiveParts) {
      setActiveDate(formatIsoDate(initialActiveParts.year, initialActiveParts.month, initialActiveParts.day));
    } else {
      setActiveDate(null);
    }
    setErrorMessage(initialErrored ? "We couldn't load this month. Try again later." : null);
  }, [initialYear, initialMonth, normalizedInitialCounts, initialActiveParts, initialErrored]);

  useEffect(() => {
    if (skipFetchRef.current) {
      skipFetchRef.current = false;
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);
    setErrorMessage(null);

    const monthParam = String(viewMonth).padStart(2, "0");
    fetch(`/api/calendar/post-counts?year=${viewYear}&month=${monthParam}`, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
        return response.json() as Promise<{ counts?: Record<string, number> | null }>; // minimal payload
      })
      .then((payload) => {
        if (controller.signal.aborted) return;
        setCounts(normalizeCounts(payload.counts));
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        console.error("[blog/calendar] failed to fetch counts", error);
        setCounts({});
        setErrorMessage("We couldn't load this month. Try again later.");
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [viewYear, viewMonth]);

  const activeParts = useMemo(() => parseIsoDate(activeDate), [activeDate]);

  const canGoPrev = viewYear > yearBounds.min || (viewYear === yearBounds.min && viewMonth > 1);
  const canGoNext = viewYear < yearBounds.max || (viewYear === yearBounds.max && viewMonth < 12);
  const isTodayView = viewYear === clampYear(today.year, yearBounds) && viewMonth === today.month;

  const pushSearchParams = (year: number, month: number, date: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("year", String(year));
    params.set("month", String(month).padStart(2, "0"));
    if (date) {
      params.set("date", date);
    } else {
      params.delete("date");
    }
    params.delete("page");
    const query = params.toString();
    const href = query ? `${pathname}?${query}` : pathname;
    router.replace(href, { scroll: false });
  };

  const updateView = (
    nextYear: number,
    nextMonth: number,
    options?: { clearSelection?: boolean; explicitDate?: string | null }
  ) => {
    const boundedYear = clampYear(nextYear, yearBounds);
    let boundedMonth = nextMonth;
    if (boundedMonth < 1) boundedMonth = 1;
    if (boundedMonth > 12) boundedMonth = 12;

    let nextDate: string | null = activeDate;

    if (typeof options?.explicitDate !== "undefined") {
      nextDate = options.explicitDate;
    } else if (options?.clearSelection) {
      nextDate = null;
    } else if (activeParts) {
      const desiredDay = activeParts.day;
      if (desiredDay <= daysInMonth(boundedYear, boundedMonth)) {
        nextDate = formatIsoDate(boundedYear, boundedMonth, desiredDay);
      } else {
        nextDate = null;
      }
    }

    setViewYear(boundedYear);
    setViewMonth(boundedMonth);
    setActiveDate(nextDate);
    pushSearchParams(boundedYear, boundedMonth, nextDate);
  };

  const handlePrev = () => {
    if (!canGoPrev) return;
    const nextMonth = viewMonth === 1 ? 12 : viewMonth - 1;
    const nextYear = viewMonth === 1 ? viewYear - 1 : viewYear;
    updateView(nextYear, nextMonth);
  };

  const handleNext = () => {
    if (!canGoNext) return;
    const nextMonth = viewMonth === 12 ? 1 : viewMonth + 1;
    const nextYear = viewMonth === 12 ? viewYear + 1 : viewYear;
    updateView(nextYear, nextMonth);
  };

  const handleMonthChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextMonth = Number.parseInt(event.target.value, 10);
    if (Number.isNaN(nextMonth)) return;
    updateView(viewYear, nextMonth);
  };

  const handleYearChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextYear = Number.parseInt(event.target.value, 10);
    if (Number.isNaN(nextYear)) return;
    updateView(nextYear, viewMonth);
  };

  const handleToday = () => {
    const targetYear = clampYear(today.year, yearBounds);
    updateView(targetYear, today.month, { clearSelection: true });
  };

  const handleSelectDay = (day: number) => {
    const nextDate = formatIsoDate(viewYear, viewMonth, day);
    setActiveDate(nextDate);
    pushSearchParams(viewYear, viewMonth, nextDate);
  };

  const controlButtonClass =
    "relative inline-flex h-8 shrink-0 items-center justify-center rounded-md border-2 border-mc-wood-dark bg-mc-parchment px-2 font-mc text-[0.64rem] uppercase tracking-[0.12em] leading-none text-[#3B2F1B] shadow-pixel transition-transform duration-150 hover:-translate-y-0.5 hover:brightness-[1.05] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B2F1B] focus-visible:ring-offset-2 focus-visible:ring-offset-mc-parchment sm:h-9 sm:px-3 sm:text-[0.68rem] md:h-10 md:px-4 md:text-[0.72rem]";
  const controlButtonDisabledClass = "cursor-not-allowed opacity-60 hover:translate-y-0 hover:brightness-100";
  const selectClass =
    "h-8 shrink-0 rounded-md border-2 border-mc-wood-dark bg-mc-parchment px-2 font-mc text-[0.64rem] uppercase tracking-[0.12em] leading-none text-[#3B2F1B] shadow-pixel focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B2F1B] focus-visible:ring-offset-2 focus-visible:ring-offset-mc-parchment min-w-[6.5rem] sm:h-9 sm:px-3 sm:text-[0.68rem] sm:min-w-[8rem] md:h-10 md:px-4 md:text-[0.72rem]";

  return (
    <div className="space-y-3">
      <div>
        <h2 className="font-mc text-lg">Post Calendar</h2>
        <p className="text-xs text-mc-stone">Browse stories by day.</p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-1 overflow-hidden whitespace-normal rounded-md border-2 border-mc-wood-dark bg-mc-parchment px-2 py-1 shadow-pixel md:justify-between md:gap-2 md:px-3 md:py-2 lg:gap-3 lg:px-4 lg:py-3">
        <div className="flex w-full flex-wrap items-center justify-center gap-1 md:w-auto md:flex-nowrap md:justify-start md:gap-2">
          <button
            type="button"
            className={`${controlButtonClass} ${!canGoPrev ? controlButtonDisabledClass : ""}`}
            onClick={handlePrev}
            disabled={!canGoPrev}
            aria-label="Go to previous month"
          >
            ‹
          </button>
          <select
            aria-label="Select month"
            className={`${selectClass} w-auto`}
            value={viewMonth}
            onChange={handleMonthChange}
          >
            {MONTH_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            className={`${controlButtonClass} ${!canGoNext ? controlButtonDisabledClass : ""}`}
            onClick={handleNext}
            disabled={!canGoNext}
            aria-label="Go to next month"
          >
            ›
          </button>
        </div>
        <div className="flex w-full items-center justify-center gap-1 md:w-auto md:justify-end md:gap-2">
          <select
            aria-label="Select year"
            className={`${selectClass} w-auto flex-1 min-w-[5.5rem] md:flex-none`}
            value={viewYear}
            onChange={handleYearChange}
          >
            {Array.from({ length: yearBounds.max - yearBounds.min + 1 }, (_, index) => yearBounds.min + index).map(
              (year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              )
            )}
          </select>
          <button
            type="button"
            className={`${controlButtonClass} ${
              isTodayView && !activeDate ? controlButtonDisabledClass : ""
            } w-auto flex-1 md:flex-none`}
            onClick={handleToday}
            disabled={isTodayView && !activeDate}
          >
            Today
          </button>
        </div>
        <span className="sr-only" aria-live="polite">
          {announcement}
        </span>
      </div>

      <CalendarGrid
        year={viewYear}
        month={viewMonth}
        counts={counts}
        selectedDate={activeDate}
        onSelectDay={handleSelectDay}
        isLoading={isLoading}
        today={today}
      />

      {errorMessage ? (
        <p className="text-xs text-red-700">{errorMessage}</p>
      ) : totalPosts === 0 && !isLoading ? (
        <p className="text-xs text-mc-stone">No posts yet this month.</p>
      ) : null}
    </div>
  );
}
