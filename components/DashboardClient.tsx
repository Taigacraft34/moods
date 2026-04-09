'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import BottomNav from './BottomNav'
import type { MoodEntry, Profile } from '@/lib/types'

const SCORE_COLORS = ['','#f07070','#f07070','#f0a855','#f0a855','#f0a855','#8b7cf8','#8b7cf8','#4ecba0','#4ecba0','#4ecba0']
const SCORE_LABELS: Record<number, string> = {
  1:'Très mal',2:'Mal',3:'Pas bien',4:'Bof',5:'Moyen',
  6:'Ça va',7:'Bien',8:'Très bien',9:'Super',10:'Excellent'
}

interface Props {
  user: { id: string; email?: string }
  profile: Profile | null
  todayMoods: MoodEntry[]
  streak: number
}

function timeToInput(time: string) {
  return time ? time.slice(0, 5) : new Date().toTimeString().slice(0, 5)
}

export default function DashboardClient({ user, profile, todayMoods, streak }: Props) {
  const [score, setScore] = useState<number | null>(null)
  const [comment, setComment] = useState('')
  const [entryTime, setEntryTime] = useState(new Date().toTimeString().slice(0, 5))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [moods, setMoods] = useState<MoodEntry[]>(todayMoods)
  const [editingId, setEditingId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const name = profile?.display_name || user.email?.split('@')[0] || 'vous'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'
  const avgToday = moods.length ? (moods.reduce((s, m) => s + m.score, 0) / moods.length).toFixed(1) : null

  function startEdit(m: MoodEntry) {
    setEditingId(m.id)
    setScore(m.score)
    setComment(m.comment ?? '')
    setEntryTime(timeToInput(m.entry_time))
  }

  function cancelEdit() {
    setEditingId(null)
    setScore(null)
    setComment('')
    setEntryTime(new Date().toTimeString().slice(0, 5))
  }

  async function handleSave() {
    if (!score) return
    setSaving(true)
    if (editingId) {
      const { data } = await supabase.from('moods')
        .update({ score, comment: comment || null, entry_time: entryTime + ':00' })
        .eq('id', editingId).select().single()
      if (data) setMoods(prev => prev.map(m => m.id === editingId ? data : m))
      setEditingId(null)
    } else {
      const { data } = await supabase.from('moods')
        .insert({ user_id: user.id, score, comment: comment || null, entry_time: entryTime + ':00' })
        .select().single()
      if (data) setMoods(prev => [...prev, data].sort((a, b) => a.entry_time.localeCompare(b.entry_time)))
    }
    setScore(null)
    setComment('')
    setEntryTime(new Date().toTimeString().slice(0, 5))
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleDelete(id: string) {
    await supabase.from('moods').delete().eq('id', id)
    setMoods(prev => prev.filter(m => m.id !== id))
  }

  return (
    <div className="page">
      <div style={{ padding: '56px 20px 20px' }}>
        {/* Header */}
        <div className="animate-up" style={{ marginBottom: '20px' }}>
          <p style={{ fontSize: '13px', color: 'var(--text3)', marginBottom: '4px' }}>
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <h1 className="serif" style={{ fontSize: '28px', fontWeight: 400, letterSpacing: '-0.02em' }}>
            {greeting}, {name}
          </h1>
        </div>

        {/* Streak + avg */}
        <div className="animate-up delay-1" style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {streak > 0 && (
            <div className="flame-badge">
              <span style={{ fontSize: '18px' }}>🔥</span>
              <span>{streak} jour{streak > 1 ? 's' : ''} de suite</span>
            </div>
          )}
          {avgToday && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'var(--accent-soft)', border: '0.5px solid var(--accent-glow)', borderRadius: '20px', fontSize: '13px', color: 'var(--accent)', fontWeight: 500 }}>
              Moyenne aujourd'hui : {avgToday}/10
            </div>
          )}
        </div>

        {/* Formulaire */}
        <div className="card animate-up delay-2" style={{ marginBottom: '16px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '16px' }}>
            {editingId ? 'Modifier une humeur' : 'Ajouter une humeur'}
          </h2>

          {/* Heure */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text2)', display: 'block', marginBottom: '5px' }}>Heure</label>
            <input className="input" type="time" value={entryTime} onChange={e => setEntryTime(e.target.value)} style={{ width: 'auto' }} />
          </div>

          {/* Score */}
          <p style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '8px' }}>
            {score ? `${score}/10 — ${SCORE_LABELS[score]}` : 'Score'}
          </p>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
            {[1,2,3,4,5,6,7,8,9,10].map(n => (
              <button key={n} className={`score-pill${score === n ? ' selected' : ''}`} onClick={() => setScore(n)}
                style={score === n ? { background: SCORE_COLORS[n], borderColor: SCORE_COLORS[n] } : {}}>
                {n}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text3)', marginBottom: '14px' }}>
            <span>😞 Très mal</span><span>😊 Excellent</span>
          </div>

          <textarea className="input" rows={2} placeholder="Commentaire optionnel..." value={comment}
            onChange={e => setComment(e.target.value)} style={{ marginBottom: '12px' }} />

          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-primary" onClick={handleSave} disabled={!score || saving} style={{ flex: 1 }}>
              {saving ? 'Enregistrement...' : saved ? '✓ Enregistré !' : editingId ? 'Mettre à jour' : 'Ajouter'}
            </button>
            {editingId && (
              <button className="btn-ghost" onClick={cancelEdit}>Annuler</button>
            )}
          </div>
        </div>

        {/* Liste des humeurs du jour */}
        {moods.length > 0 && (
          <div className="card animate-up delay-3">
            <h3 style={{ fontSize: '14px', color: 'var(--text2)', marginBottom: '14px', fontWeight: 400 }}>
              Aujourd'hui — {moods.length} entrée{moods.length > 1 ? 's' : ''}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {moods.map(m => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: 'var(--surface)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: SCORE_COLORS[m.score] + '22', border: `1.5px solid ${SCORE_COLORS[m.score]}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 600, color: SCORE_COLORS[m.score], flexShrink: 0 }}>
                    {m.score}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '12px', color: 'var(--text3)' }}>{timeToInput(m.entry_time)}</p>
                    {m.comment && <p style={{ fontSize: '13px', color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.comment}</p>}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    <button className="btn-ghost" onClick={() => startEdit(m)} style={{ padding: '5px 10px', fontSize: '12px' }}>✏️</button>
                    <button onClick={() => handleDelete(m.id)} style={{ padding: '5px 10px', fontSize: '12px', border: '0.5px solid rgba(240,112,112,0.3)', borderRadius: 'var(--radius-sm)', color: 'var(--red)', background: 'var(--red-soft)' }}>✕</button>
                  </div>
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
