import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerSupabase } from '@/lib/supabase-server'
import { createAdminSupabase } from '@/lib/supabase-admin'

type Payload = {
  email?: unknown
  password?: unknown
  display_name?: unknown
  is_admin?: unknown
}

function asString(v: unknown) {
  return typeof v === 'string' ? v : ''
}

function asBool(v: unknown) {
  return typeof v === 'boolean' ? v : false
}

export async function POST(request: Request) {
  const supabase = createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  {
    const adminForCheck = createAdminSupabase()
    if (adminForCheck) {
      const { data: me } = await adminForCheck.from('profiles').select('is_admin').eq('id', user.id).single()
      if (!me?.is_admin) return NextResponse.json({ error: 'Accès interdit' }, { status: 403 })
    } else {
      const { data: me } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
      if (!me?.is_admin) return NextResponse.json({ error: 'Accès interdit' }, { status: 403 })
    }
  }

  const body = (await request.json().catch(() => ({}))) as Payload
  const email = asString(body.email).trim().toLowerCase()
  const password = asString(body.password)
  const display_name = asString(body.display_name).trim()
  const is_admin = asBool(body.is_admin)

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Email invalide' }, { status: 400 })
  }
  if (!password || password.length < 6) {
    return NextResponse.json({ error: 'Mot de passe trop court (min 6 caractères)' }, { status: 400 })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    return NextResponse.json({ error: 'Configuration serveur manquante (SUPABASE_SERVICE_ROLE_KEY)' }, { status: 500 })
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (error || !data.user) {
    return NextResponse.json({ error: error?.message || 'Impossible de créer le compte' }, { status: 400 })
  }

  // Le trigger peut créer un profil automatiquement, mais on force les champs nécessaires.
  const { error: profileError } = await admin.from('profiles').upsert({
    id: data.user.id,
    email,
    display_name: display_name || null,
    is_admin,
  })

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, id: data.user.id })
}

