'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import BottomNav from './BottomNav'
import type { JournalEntry } from '@/lib/types'

interface Props {
  user: { id: string }
  todayEntry: JournalEntry | null
  history: JournalEntry[]
}

export default function JournalClient({ user, todayEntry, history }: Props) {
  const [title, setTitle] = useState(todayEntry?.title ?? '')
  const [content, setContent] = useState(todayEntry?.content ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [viewEntry, setViewEntry] = useState<JournalEntry | null>(null)
  const [currentEntry, setCurrentEntry] = useState<JournalEntry | null>(todayEntry)
  const [historyList, setHistoryList] = useState<JournalEntry[]>(history)
  const supabase = createClient()

  const today = new Date().toISOString().split('T')[0]

  async function handleSave() {
    if (!content.trim()) { setError('La description est obligatoire'); return }
    setError('')
    setSaving(true)
    const payload = { user_id: user.id, title: title.trim() || null, content: content.trim(), entry_date: today }

    let saved_entry: JournalEntry | null = null
    if (currentEntry) {
      const { data } = await supabase.from('journal').update({ title: payload.title, content: payload.content, updated_at: new Date().toISOString() })
        .eq('id', currentEntry.id).select().single()
      saved_entry = data
    } else {
      const { data } = await supabase.from('journal').insert(payload).select().single()
      saved_entry = data
    }

    if (saved_entry) {
      setCurrentEntry(saved_entry)
      setHistoryList(prev => {
        const filtered = prev.filter(e => e.id !== saved_entry!.id)
        return [saved_entry!, ...filtered]
      })
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  }

  function getPreview(entry: JournalEntry) {
    if (entry.title) return entry.title
    return entry.content.slice(0, 60) + (entry.content.length > 60 ? '...' : '')
  }

  return (
    <div className="page">
      {/* Modal vue entrée */}
      {viewEntry && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }} onClick={() => setViewEntry(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg2)', borderRadius: '20px 20px 0 0', padding: '24px 20px 40px', width: '100%', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <p style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '4px' }}>{formatDate(viewEntry.entry_date)}</p>
                {viewEntry.title && <h2 className="serif" style={{ fontSize: '22px', fontWeight: 400 }}>{viewEntry.title}</h2>}
              </div>
              <button onClick={() => setViewEntry(null)} style={{ color: 'var(--text3)', fontSize: '20px', padding: '4px' }}>✕</button>
            </div>
            <p style={{ fontSize: '15px', color: 'var(--text)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{viewEntry.content}</p>
          </div>
        </div>
      )}

      <div style={{ padding: '56px 20px 20px' }}>
        <div className="animate-up" style={{ marginBottom: '24px' }}>
          <p style={{ fontSize: '13px', color: 'var(--text3)', marginBottom: '4px' }}>
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <h1 className="serif" style={{ fontSize: '28px', fontWeight: 400, letterSpacing: '-0.02em' }}>Carnet de bord</h1>
        </div>

        {/* Formulaire du jour */}
        <div className="card desktop-center animate-up delay-1" style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 500, marginBottom: '14px' }}>
            {currentEntry ? "Modifier l'entrée d'aujourd'hui" : "Écrire l'entrée du jour"}
          </h2>
          <input className="input" placeholder="Titre (optionnel)" value={title} onChange={e => setTitle(e.target.value)} style={{ marginBottom: '10px' }} />
          <textarea className="input" rows={6} placeholder="Décris ta journée..." value={content} onChange={e => setContent(e.target.value)} style={{ marginBottom: '10px' }} />
          {error && <p style={{ fontSize: '13px', color: 'var(--red)', marginBottom: '8px' }}>{error}</p>}
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Enregistrement...' : saved ? '✓ Enregistré !' : currentEntry ? 'Mettre à jour' : 'Enregistrer'}
          </button>
        </div>

        {/* Historique */}
        {historyList.length > 0 && (
          <div className="card desktop-center animate-up delay-2">
            <h3 style={{ fontSize: '14px', color: 'var(--text2)', marginBottom: '14px', fontWeight: 400 }}>Historique</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {historyList.map(entry => (
                <div key={entry.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'var(--surface)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '2px' }}>
                      {entry.entry_date === today ? "Aujourd'hui" : formatDate(entry.entry_date)}
                    </p>
                    <p className="desktop-clamp-2" style={{ fontSize: '13px', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {getPreview(entry)}
                    </p>
                  </div>
                  <button className="btn-ghost" onClick={() => setViewEntry(entry)} style={{ flexShrink: 0, padding: '5px 12px', fontSize: '12px' }}>
                    Voir
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  )
}
