export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase-server'
import ProfileClient from '@/components/ProfileClient'

export default async function ProfilePage() {
  const supabase = await createServerSupabase()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')
  const user = session.user

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  return <ProfileClient user={user} profile={profile} />
}
