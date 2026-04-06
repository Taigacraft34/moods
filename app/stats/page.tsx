import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase-server'
import StatsClient from '@/components/StatsClient'

export default async function StatsPage() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: moods } = await supabase
    .from('moods')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  // Calculate streak
  let streak = 0
  if (moods && moods.length > 0) {
    const days = new Set(moods.map((m: {created_at: string}) => m.created_at.split('T')[0]))
    const d = new Date()
    while (true) {
      const key = d.toISOString().split('T')[0]
      if (days.has(key)) { streak++; d.setDate(d.getDate() - 1) }
      else break
    }
  }

  return <StatsClient moods={moods ?? []} streak={streak} />
}
