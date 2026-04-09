import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase-server'
import JournalClient from '@/components/JournalClient'

export default async function JournalPage() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = new Date().toISOString().split('T')[0]
  const { data: todayEntry } = await supabase
    .from('journal').select('*').eq('user_id', user.id).eq('entry_date', today).single()

  const { data: history } = await supabase
    .from('journal').select('*').eq('user_id', user.id)
    .order('entry_date', { ascending: false }).limit(50)

  return <JournalClient user={user} todayEntry={todayEntry ?? null} history={history ?? []} />
}
