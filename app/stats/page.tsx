import { redirect } from 'next/navigation'
import StatsClient from '@/components/StatsClient'
import { createServerSupabase } from '@/lib/supabase-server'
import type { JournalEntry, MoodEntry } from '@/lib/types'

function isoDate(d: Date) {
  return d.toISOString().split('T')[0]
}

async function computeStreak(supabase: ReturnType<typeof createServerSupabase>, userId: string) {
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

export default async function StatsPage() {
  const supabase = createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: moods } = await supabase
    .from('moods')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .returns<MoodEntry[]>()

  const { data: journals } = await supabase
    .from('journal')
    .select('*')
    .eq('user_id', user.id)
    .order('entry_date', { ascending: true })
    .returns<JournalEntry[]>()

  const streak = await computeStreak(supabase, user.id)

  return <StatsClient moods={moods ?? []} journals={journals ?? []} streak={streak} />
}

