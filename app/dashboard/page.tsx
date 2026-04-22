import { redirect } from 'next/navigation'
import DashboardClient from '@/components/DashboardClient'
import { createServerSupabase } from '@/lib/supabase-server'
import type { MoodEntry, Profile } from '@/lib/types'

function isoDate(d: Date) {
  return d.toISOString().split('T')[0]
}

async function computeStreak(supabase: ReturnType<typeof createServerSupabase>, userId: string) {
  // On limite pour éviter des payloads énormes; suffisant pour une série longue.
  const { data } = await supabase
    .from('moods')
    .select('created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(400)

  const days = new Set<string>()
  for (const m of data ?? []) {
    const day = (m as any).created_at?.split?.('T')?.[0]
    if (day) days.add(day)
  }

  let streak = 0
  const cursor = new Date()
  while (true) {
    const day = isoDate(cursor)
    if (!days.has(day)) break
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

export default async function DashboardPage() {
  const supabase = createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single<Profile>()

  const now = new Date()
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)

  const { data: todayMoods } = await supabase
    .from('moods')
    .select('*')
    .eq('user_id', user.id)
    .gte('created_at', start.toISOString())
    .lt('created_at', end.toISOString())
    .order('entry_time', { ascending: true })
    .returns<MoodEntry[]>()

  const streak = await computeStreak(supabase, user.id)

  return (
    <DashboardClient
      user={{ id: user.id, email: user.email ?? undefined }}
      profile={profile ?? null}
      todayMoods={todayMoods ?? []}
      streak={streak}
    />
  )
}

