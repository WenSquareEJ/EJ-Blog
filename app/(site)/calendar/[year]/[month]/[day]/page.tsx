import CalendarDayList from '@/components/CalendarDayList'
import supabaseServer from "@/lib/supabaseServer";

export default async function DayPage({ params }: { params: { year: string, month: string, day: string } }) {
  const { year, month, day } = params
  const sb = supabaseServer()
  const from = new Date(Number(year), Number(month)-1, Number(day)).toISOString()
  const to = new Date(Number(year), Number(month)-1, Number(day), 23,59,59).toISOString()
  const { data } = await sb.from('posts').select('*').eq('status','approved').gte('published_at', from).lte('published_at', to).order('published_at', { ascending: false })
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Posts on {year}-{month}-{day}</h1>
      <CalendarDayList posts={data||[]} />
    </div>
  )
}
