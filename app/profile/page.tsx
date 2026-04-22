import { redirect } from 'next/navigation'
import ProfileClient from '@/components/ProfileClient'
import { createServerSupabase } from '@/lib/supabase-server'
import type { Profile } from '@/lib/types'

export default async function ProfilePage() {
  const supabase = createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single<Profile>()

  return <ProfileClient user={{ id: user.id, email: user.email ?? undefined }} profile={profile ?? null} />
}

