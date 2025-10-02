export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { supabaseServer } from '@/lib/supabaseServer'

// Helpers
function toISO(d: Date) { return new Date(d.getTime() - d.getTimezoneOffset()*60000).toISOString() }
function pad(n: number) { return n.toString().padStart(2, '0') }
function monthLabel(y: number, m: number) {
  return new Date(y, m-1, 1).toLocaleString(undefined, { month: 'long', year: 'numeric' })
}
function prevMonth(y: number, m: number) { return m === 1 ? { y: y-1, m: 12 } : { y, m: m-1 } }
function nextMonth(y: number, m: number) { return m === 12 ? { y: y+1, m: 1 } : { y, m: m+1 } }

export default async function CalendarPage({
  searchParams,
}: {
  searchParams?: { year?: string; month?: string; day?: string }
}) {
  const now = new Date()
  const year = Number(searchParams?.year || now.getFullYear())
  const month = Number(searchParams?.month || (now.getMonth() + 1))
  const selectedDay = searchParams?.day ? Number(searchParams.day) : undefined

  // Range for the month [start, nextStart)
  const monthStart = new Date(year, month - 1, 1)
  const nextStart = new Date(year, month, 1)

  // Fetch all approved posts within the month
  const sb = supabaseServer()
  const { data: postsInMonth } = await sb
    .from('posts')
    .select('id,title,published_at,created_at,status')
    .eq('status', 'approved')
    .gte('published_at', toISO(monthStart))
    .lt('published_at', toISO(nextStart))

  // Count posts per day
  const counts = new Map<number, number>()
  ;(postsInMonth || []).forEach(p => {
    const d = new Date(p.published_at || p.created_at)
    const day = d.getDate()
    counts.set(day, (counts.get(day) || 0) + 1)
  })

  // If a day is selected, fetch posts for that specific day
  let postsForDay: any[] = []
  if (selectedDay) {
    const dayStart = new Date(year, month - 1, selectedDay, 0, 0, 0)
    const dayEnd = new Date(year, month - 1, selectedDay + 1, 0, 0, 0)
    const { data } = await sb
      .from('posts')
      .select('id,title,published_at,created_at,content')
      .eq('status', 'approved')
      .gte('published_at', toISO(dayStart))
      .lt('published_at', toISO(dayEnd))
      .order('published_at', { ascending: false })
    postsForDay = data || []
  }

  // Build calendar grid: start on Sunday
  const firstWeekday = monthStart.getDay() // 0=Sun..6=Sat
  const daysInMonth = new Date(year, month, 0).getDate()
  const cells: Array<{ day?: number }> = []
  for (let i = 0; i < firstWeekday; i++) cells.push({})
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d })
  while (cells.length % 7 !== 0) cells.push({})

  const prev = prevMonth(year, month)
  const next = nextMonth(year, month)

  return (
    <div className="space-y-6">
      {/* Top controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/calendar?year=${prev.y}&month=${prev.m}`}
            className="px-3 py-2 rounded-block border hover:bg-gray-50"
          >
            ← {monthLabel(prev.y, prev.m)}
          </Link>
          <h1 className="text-2xl font-semibold">{monthLabel(year, month)}</h1>
          <Link
            href={`/calendar?year=${next.y}&month=${next.m}`}
            className="px-3 py-2 rounded-block border hover:bg-gray-50"
          >
            {monthLabel(next.y, next.m)} →
          </Link>
        </div>

        {/* Quick pickers */}
        <form className="flex items-center gap-2"
          action="/calendar"
        >
          <input type="hidden" name="day" value="" />
          <select
            name="month"
            defaultValue={month}
            className="border rounded-block px-2 py-1"
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <option key={i+1} value={i+1}>
                {new Date(2000, i, 1).toLocaleString(undefined, { month: 'long' })}
              </option>
            ))}
          </select>
          <select
            name="year"
            defaultValue={year}
            className="border rounded-block px-2 py-1"
          >
            {Array.from({ length: 7 }).map((_, i) => {
              const y = now.getFullYear() - 3 + i
              return <option key={y} value={y}>{y}</option>
            })}
          </select>
          <button className="btn-block" type="submit">Go</button>
        </form>
      </div>

      {/* Weekday labels */}
      <div className="grid grid-cols-7 text-xs text-mc-stone">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
          <div key={d} className="px-2 py-1">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {cells.map((cell, idx) => {
          const d = cell.day
          const count = d ? (counts.get(d) || 0) : 0
          const isSelected = d && selectedDay === d
          return (
            <div
              key={idx}
              className={`border rounded-block bg-white p-2 min-h-[72px] ${isSelected ? 'ring-2 ring-mc-grass' : ''}`}
            >
              {typeof d === 'number' ? (
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">{d}</div>
                  {count > 0 && (
                    <Link
                      href={`/calendar?year=${year}&month=${month}&day=${d}`}
                      className="text-xs bg-mc-grass text-white rounded-full px-2 py-0.5"
                    >
                      {count} post{count>1?'s':''}
                    </Link>
                  )}
                </div>
              ) : null}

              {/* Click anywhere in a day to select it */}
              {typeof d === 'number' && (
                <Link
                  href={`/calendar?year=${year}&month=${month}&day=${d}`}
                  className="block mt-4 text-xs text-mc-stone hover:underline"
                >
                  View day →
                </Link>
              )}
            </div>
          )
        })}
      </div>

      {/* Selected day’s posts */}
      {selectedDay && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold">
            Posts on {year}-{pad(month)}-{pad(selectedDay)}
          </h2>
          <div className="mt-3 space-y-3">
            {postsForDay.length === 0 && (
              <p className="text-sm text-mc-stone">No posts on this day.</p>
            )}
            {postsForDay.map(p => (
              <div key={p.id} className="card-block p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{p.title}</h3>
                  <span className="text-xs text-mc-stone">
                    {new Date(p.published_at || p.created_at).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                  </span>
                </div>
                <p className="text-sm mt-1 line-clamp-3 whitespace-pre-wrap">{p.content}</p>
                <Link href={`/post/${p.id}`} className="mt-2 inline-block underline text-sm">
                  Open post
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
