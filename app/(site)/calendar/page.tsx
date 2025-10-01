import CalendarGrid from '@/components/CalendarGrid'
import { supabaseServer } from '@/lib/supabaseServer'

export default async function CalendarPage({ searchParams }: { searchParams: { y?: string, m?: string } }) {
  const now = new Date()
  const year = Number(searchParams.y||now.getFullYear())
  const month = Number(searchParams.m||now.getMonth()+1)
  const sb = supabaseServer()
  const from = new Date(year, month-1, 1).toISOString()
  const to = new Date(year, month, 0, 23,59,59).toISOString()
  const { data } = await sb.rpc('posts_per_day', { from_ts: from, to_ts: to })
  const counts: Record<number, number> = {}
  for (const row of (data||[])) counts[row.day] = row.count
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Calendar</h1>
      <CalendarGrid year={year} month={month} counts={counts} />
    </div>
  )
}
