import LoginForm from '@/components/LoginForm'
import { createServerSupabase } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function LoginPage() {
  const supabase = await createServerSupabase()
  const { data: { session } } = await supabase.auth.getSession()
  console.log('LOGIN session:', session)
  if (session) redirect('/dashboard')
  return <LoginForm />
}
