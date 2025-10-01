import Link from 'next/link'
import { supabaseServer } from '@/lib/supabaseServer'

export default async function TagsPage() {
  const sb = supabaseServer()
  const { data: tags } = await sb.from('tags').select('name, slug').order('name')
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Tags</h1>
      <div className="flex flex-wrap gap-2">
        {(tags||[]).map(t => (
          <Link key={t.slug} href={`/tags/${t.slug}`} className="bg-gray-100 px-3 py-1 rounded-full hover:bg-gray-200">
            #{t.name}
          </Link>
        ))}
      </div>
    </div>
  )
}
