import { redirect } from 'next/navigation'
import AdminClient from '@/components/AdminClient'
import { createServerSupabase } from '@/lib/supabase-server'
import { createAdminSupabase } from '@/lib/supabase-admin'
import type { Profile } from '@/lib/types'

export default async function AdminPage() {
  const supabase = createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminSupabase()
  if (admin) {
    const { data: me } = await admin.from('profiles').select('is_admin').eq('id', user.id).single()
    if (!me?.is_admin) redirect('/dashboard')
  } else {
    const { data: me } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
    if (!me?.is_admin) redirect('/dashboard')
  }

  const { data: users } = await supabase.from('profiles').select('*').order('created_at', { ascending: false }).returns<Profile[]>()

  const { data: moodRows } = await supabase.from('moods').select('user_id').returns<{ user_id: string }[]>()
  const moodCounts: Record<string, number> = {}
  for (const row of moodRows ?? []) {
    moodCounts[row.user_id] = (moodCounts[row.user_id] ?? 0) + 1
  }

  return <AdminClient users={users ?? []} moodCounts={moodCounts} />
}

