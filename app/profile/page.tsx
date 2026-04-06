import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase-server'
import ProfileClient from '@/components/ProfileClient'

export default async function ProfilePage() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return <ProfileClient user={user} profile={profile} />
}
