// /app/(site)/calendar/page.tsx
import { supabaseServer } from "@/lib/supabaseServer"

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

export default async function CalendarPage() {
  const sb = supabaseServer()
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const days = getDaysInMonth(year, month)

  // fetch posts grouped by date
  const { data: posts } = await sb
    .from("posts")
    .select("id, created_at")

  const counts: Record<string, number> = {}
  posts?.forEach((p) => {
    const d = new Date(p.created_at).toLocaleDateString("en-GB", { timeZone: "Europe/London" })
    counts[d] = (counts[d] || 0) + 1
  })

  return (
    <div>
      <h1 className="font-mc text-lg md:text-xl mb-4">Calendar</h1>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: days }).map((_, i) => {
          const day = i + 1
          const dateStr = new Date(year, month, day).toLocaleDateString("en-GB")
          const count = counts[dateStr] || 0
          return (
            <div key={day} className="relative card-block h-24 flex items-center justify-center">
              <span className="font-mc">{day}</span>
              {count > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {count}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
