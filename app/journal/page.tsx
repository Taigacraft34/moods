import { redirect } from 'next/navigation'
import JournalClient from '@/components/JournalClient'
import { createServerSupabase } from '@/lib/supabase-server'
import type { JournalEntry } from '@/lib/types'

export default async function JournalPage() {
  const supabase = createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = new Date().toISOString().split('T')[0]

  const { data: todayEntry } = await supabase
    .from('journal')
    .select('*')
    .eq('user_id', user.id)
    .eq('entry_date', today)
    .maybeSingle<JournalEntry>()

  const { data: history } = await supabase
    .from('journal')
    .select('*')
    .eq('user_id', user.id)
    .order('entry_date', { ascending: false })
    .limit(90)
    .returns<JournalEntry[]>()

  return (
    <JournalClient
      user={{ id: user.id }}
      todayEntry={todayEntry ?? null}
      history={history ?? []}
    />
  )
}

