'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import BottomNav from './BottomNav'
import type { Profile } from '@/lib/types'

export default function ProfileClient({ user, profile }: { user: { id: string; email?: string }; profile: Profile | null }) {
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSave() {
    setSaving(true)
    await supabase.from('profiles')
      .upsert({ id: user.id, display_name: displayName || null, email: user.email ?? '' })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
    router.refresh()
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const initials = (displayName || user.email || 'U').slice(0, 2).toUpperCase()

  return (
    <div className="page">
      <div style={{ padding: '56px 20px 20px' }}>
        <div className="animate-up" style={{ marginBottom: '32px' }}>
          <h1 className="serif" style={{ fontSize: '28px', fontWeight: 400, letterSpacing: '-0.02em' }}>Profil</h1>
        </div>

        {/* Avatar */}
        <div className="animate-up delay-1" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'var(--accent-soft)', border: '2px solid var(--accent-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: 500, color: 'var(--accent)', marginBottom: '12px' }}>
            {initials}
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text3)' }}>{user.email}</p>
          {profile?.is_admin && (
            <span style={{ marginTop: '6px', fontSize: '11px', padding: '3px 10px', background: 'var(--amber-soft)', border: '0.5px solid rgba(240,168,85,0.3)', borderRadius: '12px', color: 'var(--amber)' }}>
              Administrateur
            </span>
          )}
        </div>

        {/* Edit form */}
        <div className="card animate-up delay-2" style={{ marginBottom: '16px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 500, marginBottom: '16px' }}>Informations</h3>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text2)', marginBottom: '6px' }}>Prénom ou pseudo</label>
            <input
              className="input"
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Comment tu t'appelles ?"
            />
          </div>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Enregistrement...' : saved ? '✓ Sauvegardé !' : 'Enregistrer'}
          </button>
        </div>

        {/* Admin link */}
        {profile?.is_admin && (
          <div className="card animate-up delay-3" style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 500, marginBottom: '12px' }}>Administration</h3>
            <a href="/admin" style={{ display: 'block', padding: '12px 14px', background: 'var(--surface)', borderRadius: 'var(--radius-sm)', fontSize: '14px', color: 'var(--text2)' }}>
              → Gérer les utilisateurs
            </a>
          </div>
        )}

        {/* Logout */}
        <div className="animate-up delay-4">
          <button onClick={handleLogout} style={{ width: '100%', padding: '14px', border: '0.5px solid rgba(240,112,112,0.3)', borderRadius: 'var(--radius-sm)', color: 'var(--red)', fontSize: '15px', background: 'var(--red-soft)', transition: 'all 0.2s' }}>
            Se déconnecter
          </button>
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
