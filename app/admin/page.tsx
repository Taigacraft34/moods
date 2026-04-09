export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase-server'
import AdminClient from '@/components/AdminClient'

export default async function AdminPage() {
  const supabase = await createServerSupabase()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')
  const user = session.user

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile?.is_admin) redirect('/dashboard')

  const { data: users } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })

  const { data: moodCounts } = await supabase.from('moods').select('user_id')
  const counts: Record<string, number> = {}
  moodCounts?.forEach((m: { user_id: string }) => { counts[m.user_id] = (counts[m.user_id] || 0) + 1 })

  return <AdminClient users={users ?? []} moodCounts={counts} />
}
