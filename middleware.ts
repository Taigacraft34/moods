import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

const PROTECTED_PREFIXES = ['/dashboard', '/journal', '/stats', '/profile', '/admin', '/api/admin']

function isProtectedPath(pathname: string) {
  return PROTECTED_PREFIXES.some(p => pathname === p || pathname.startsWith(p + '/'))
}

function isAdminPath(pathname: string) {
  return pathname === '/admin' || pathname.startsWith('/admin/') || pathname.startsWith('/api/admin')
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  if (!user && isProtectedPath(pathname)) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  if (user && isAdminPath(pathname)) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    const admin = url && serviceKey
      ? createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
      : null

    const { data: profile } = admin
      ? await admin.from('profiles').select('is_admin').eq('id', user.id).single()
      : await supabase.from('profiles').select('is_admin').eq('id', user.id).single()

    if (!profile?.is_admin) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Accès interdit' }, { status: 403 })
      }
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|icon-192.png|icon-512.png).*)',
  ],
}

