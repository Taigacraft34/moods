import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function createServerSupabase() {
  const cookieStore = await cookies()

  // Lire la session depuis le cookie JSON posé par createBrowserClient
  const authCookie = cookieStore.getAll().find(c => c.name.includes('auth-token'))
  
  if (authCookie) {
    try {
      const session = JSON.parse(authCookie.value)
      if (session?.access_token) {
        const client = createSupabaseClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          { auth: { persistSession: false, autoRefreshToken: false } }
        )
        await client.auth.setSession({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        })
        return client
      }
    } catch {}
  }

  // Fallback : client sans session
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}