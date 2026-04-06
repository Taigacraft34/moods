'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import type { Profile } from '@/lib/types'
import Link from 'next/link'

export default function AdminClient({ users, moodCounts }: { users: Profile[]; moodCounts: Record<string, number> }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setError('')
    setSuccess('')

    const res = await fetch('/api/admin/create-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, display_name: displayName, is_admin: isAdmin }),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Erreur lors de la création')
    } else {
      setSuccess(`Compte créé pour ${email}`)
      setEmail(''); setPassword(''); setDisplayName(''); setIsAdmin(false)
      router.refresh()
    }
    setCreating(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '0 0 40px' }}>
      {/* Header */}
      <div style={{ background: 'var(--bg2)', borderBottom: '0.5px solid var(--border)', padding: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link href="/profile" style={{ color: 'var(--text2)', fontSize: '20px' }}>←</Link>
        <div>
          <h1 className="serif" style={{ fontSize: '22px', fontWeight: 400 }}>Administration</h1>
          <p style={{ fontSize: '13px', color: 'var(--text3)', marginTop: '2px' }}>{users.length} utilisateur{users.length > 1 ? 's' : ''}</p>
        </div>
      </div>

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '24px 20px' }}>
        {/* Create user */}
        <div className="card animate-up" style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '16px' }}>Créer un compte</h2>
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text2)', marginBottom: '5px' }}>Prénom / Pseudo</label>
                <input className="input" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Alice" style={{ fontSize: '14px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text2)', marginBottom: '5px' }}>Email *</label>
                <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="alice@exemple.com" required style={{ fontSize: '14px' }} />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text2)', marginBottom: '5px' }}>Mot de passe *</label>
              <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Minimum 6 caractères" required minLength={6} style={{ fontSize: '14px' }} />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px', color: 'var(--text2)' }}>
              <input type="checkbox" checked={isAdmin} onChange={e => setIsAdmin(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: 'var(--accent)' }} />
              Compte administrateur
            </label>

            {error && <div style={{ padding: '10px 14px', background: 'var(--red-soft)', border: '0.5px solid rgba(240,112,112,0.3)', borderRadius: 'var(--radius-sm)', fontSize: '13px', color: 'var(--red)' }}>{error}</div>}
            {success && <div style={{ padding: '10px 14px', background: 'var(--green-soft)', border: '0.5px solid rgba(78,203,160,0.3)', borderRadius: 'var(--radius-sm)', fontSize: '13px', color: 'var(--green)' }}>✓ {success}</div>}

            <button className="btn-primary" type="submit" disabled={creating} style={{ marginTop: '4px' }}>
              {creating ? 'Création...' : 'Créer le compte'}
            </button>
          </form>
        </div>

        {/* Users list */}
        <div className="card animate-up delay-2">
          <h2 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '16px' }}>Utilisateurs</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {users.map(u => {
              const initials = (u.display_name || u.email || 'U').slice(0, 2).toUpperCase()
              return (
                <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--surface)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'var(--accent-soft)', border: '0.5px solid var(--accent-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 500, color: 'var(--accent)', flexShrink: 0 }}>
                    {initials}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '14px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {u.display_name || '—'}
                      {u.is_admin && <span style={{ marginLeft: '6px', fontSize: '10px', padding: '2px 6px', background: 'var(--amber-soft)', color: 'var(--amber)', borderRadius: '6px' }}>admin</span>}
                    </p>
                    <p style={{ fontSize: '12px', color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--accent)' }}>{moodCounts[u.id] || 0}</p>
                    <p style={{ fontSize: '11px', color: 'var(--text3)' }}>entrées</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
