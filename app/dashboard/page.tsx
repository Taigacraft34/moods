import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase-server'
import DashboardClient from '@/components/DashboardClient'

export default async function DashboardPage() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Get today's entry
  const today = new Date().toISOString().split('T')[0]
  const { data: todayEntry } = await supabase
    .from('moods')
    .select('*')
    .eq('user_id', user.id)
    .gte('created_at', today + 'T00:00:00')
    .lte('created_at', today + 'T23:59:59')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  // Calculate streak
  const { data: allMoods } = await supabase
    .from('moods')
    .select('created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  let streak = 0
  if (allMoods && allMoods.length > 0) {
    const days = new Set(allMoods.map(m => m.created_at.split('T')[0]))
    const d = new Date()
    while (true) {
      const key = d.toISOString().split('T')[0]
      if (days.has(key)) { streak++; d.setDate(d.getDate() - 1) }
      else break
    }
  }

  return (
    <DashboardClient
      user={user}
      profile={profile}
      todayEntry={todayEntry ?? null}
      streak={streak}
    />
  )
}
