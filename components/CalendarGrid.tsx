import Link from 'next/link'
function daysInMonth(year: number, month: number) { return new Date(year, month, 0).getDate() }
export default function CalendarGrid({ year, month, counts }: { year: number, month: number, counts: Record<number, number> }) {
  const totalDays = daysInMonth(year, month)
  const first = new Date(year, month-1, 1)
  const startWeekday = (first.getDay()+6)%7
  const cells = [] as JSX.Element[]
  for (let i=0;i<startWeekday;i++) cells.push(<div key={'pad'+i} />)
  for (let d=1; d<=totalDays; d++) {
    const c = counts[d]||0
    cells.push(
      <Link key={d} href={`/calendar/${year}/${String(month).padStart(2,'0')}/${String(d).padStart(2,'0')}`} className="border rounded-lg p-3 hover:bg-gray-50 relative">
        <div className="text-sm font-medium">{d}</div>
        {c>0 && <span className="absolute top-2 right-2 inline-flex items-center justify-center text-xs bg-brand text-white rounded-full w-5 h-5">{c}</span>}
      </Link>
    )
  }
  return <div className="grid grid-cols-7 gap-2">{cells}</div>
}
