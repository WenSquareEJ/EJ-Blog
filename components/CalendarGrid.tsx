'use client';

type CalendarGridProps = {
  year: number;
  month: number; // 1-indexed
  counts: Record<number, number>;
  selectedDate: string | null;
  onSelectDay: (day: number) => void;
  isLoading?: boolean;
  today: { year: number; month: number; day: number };
};

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function leadingOffset(year: number, month: number): number {
  const firstDay = new Date(Date.UTC(year, month - 1, 1));
  const weekday = firstDay.getUTCDay();
  return (weekday + 6) % 7; // convert Sunday-first to Monday-first
}

function trailingOffset(totalCells: number): number {
  const remainder = totalCells % 7;
  return remainder === 0 ? 0 : 7 - remainder;
}

function formatIsoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function describeDay(year: number, month: number, day: number, count: number): string {
  const date = new Date(Date.UTC(year, month - 1, day));
  const label = date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  if (count === 0) return label;
  return `${label} – ${count} post${count === 1 ? "" : "s"}`;
}

export default function CalendarGrid({
  year,
  month,
  counts,
  selectedDate,
  onSelectDay,
  isLoading = false,
  today,
}: CalendarGridProps) {
  const totalDays = daysInMonth(year, month);
  const startPadding = leadingOffset(year, month);
  const totalCellsBeforeTrailing = startPadding + totalDays;
  const endPadding = trailingOffset(totalCellsBeforeTrailing);

  const activeIso = selectedDate ?? null;
  const isTodayMonth = today.year === year && today.month === month;

  const gridCells: JSX.Element[] = [];

  for (let i = 0; i < startPadding; i += 1) {
    gridCells.push(
      <div
        key={`pad-${i}`}
        aria-hidden="true"
        className="h-14 rounded-md border-2 border-dashed border-[rgba(74,40,19,0.3)] bg-[rgba(244,237,224,0.4)]"
      />
    );
  }

  for (let day = 1; day <= totalDays; day += 1) {
    const count = counts[day] ?? 0;
    const iso = formatIsoDate(year, month, day);
    const isActive = activeIso === iso;
    const isToday = isTodayMonth && today.day === day;

    const baseClasses =
      "group relative flex h-14 flex-col justify-between rounded-md border-2 px-2 py-1 text-left transition duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B2F1B] focus-visible:ring-offset-2 focus-visible:ring-offset-mc-parchment";
    const stateClasses = isActive
      ? "border-mc-wood-dark bg-mc-wood text-mc-parchment shadow-pixel"
      : "border-mc-wood-dark bg-mc-parchment text-[#3B2F1B] hover:bg-mc-sand hover:border-[#8B5A31]";
    const todayClass = !isActive && isToday ? "border-[#3F6B38]" : "";
    const loadingClass = isLoading ? "pointer-events-none opacity-70" : "";

    gridCells.push(
      <button
        key={`day-${day}`}
        type="button"
        className={`${baseClasses} ${stateClasses} ${todayClass} ${loadingClass}`.trim()}
        onClick={() => onSelectDay(day)}
        aria-label={describeDay(year, month, day, count)}
        aria-pressed={isActive}
        aria-current={isToday ? "date" : undefined}
      >
        <span className="font-mc text-sm">{day}</span>
        {count > 0 ? (
          <span
            className={`mt-1 inline-flex w-fit items-center rounded px-[6px] py-[2px] font-mc text-[0.72rem] ${
              isActive ? "bg-[#F8E4B5] text-[#3B2F1B]" : "bg-[#F1DEC1] text-[#3B2F1B]"
            } drop-shadow-[1px_1px_0_rgba(255,255,255,0.35)]`}
          >
            {count}
          </span>
        ) : (
          <span className="mt-1 h-[1.25rem]" aria-hidden="true" />
        )}
      </button>
    );
  }

  for (let i = 0; i < endPadding; i += 1) {
    gridCells.push(
      <div
        key={`trail-${i}`}
        aria-hidden="true"
        className="h-14 rounded-md border-2 border-dashed border-[rgba(74,40,19,0.3)] bg-[rgba(244,237,224,0.4)]"
      />
    );
  }

  return (
    <div className="space-y-2" aria-live="polite" aria-busy={isLoading}>
      <div className="grid grid-cols-7 gap-1 text-center font-mc text-[0.62rem] uppercase text-mc-stone sm:text-[0.68rem]">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 sm:gap-2">{gridCells}</div>
    </div>
  );
}
