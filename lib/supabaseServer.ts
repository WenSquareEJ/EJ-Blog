import { cookies } from 'next/headers'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/database.types' // optional if you generated types

export const supabaseServer = () => {
  return createServerComponentClient<Database>({ cookies })
}
