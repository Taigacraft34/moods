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
  todayEntry: MoodEntry | null
  streak: number
}

export default function DashboardClient({ user, profile, todayEntry, streak }: Props) {
  const [score, setScore] = useState<number | null>(todayEntry?.score ?? null)
  const [comment, setComment] = useState(todayEntry?.comment ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [hasEntry, setHasEntry] = useState(!!todayEntry)
  const router = useRouter()
  const supabase = createClient()

  const name = profile?.display_name || user.email?.split('@')[0] || 'vous'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'

  async function handleSave() {
    if (!score) return
    setSaving(true)
    const today = new Date().toISOString().split('T')[0]
    if (hasEntry && todayEntry) {
      await supabase.from('moods').update({ score, comment: comment || null })
        .eq('id', todayEntry.id)
    } else {
      await supabase.from('moods').insert({ user_id: user.id, score, comment: comment || null })
    }
    setSaving(false)
    setSaved(true)
    setHasEntry(true)
    setTimeout(() => setSaved(false), 2500)
    router.refresh()
  }

  return (
    <div className="page">
      <div style={{ padding: '56px 20px 20px' }}>
        {/* Header */}
        <div className="animate-up" style={{ marginBottom: '28px' }}>
          <p style={{ fontSize: '13px', color: 'var(--text3)', marginBottom: '4px' }}>
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <h1 className="serif" style={{ fontSize: '28px', fontWeight: 400, letterSpacing: '-0.02em' }}>
            {greeting}, {name}
          </h1>
        </div>

        {/* Streak */}
        {streak > 0 && (
          <div className="animate-up delay-1" style={{ marginBottom: '24px' }}>
            <div className="flame-badge">
              <span style={{ fontSize: '18px' }}>🔥</span>
              <span>{streak} jour{streak > 1 ? 's' : ''} de suite</span>
              {streak >= 7 && <span style={{ fontSize: '11px', opacity: 0.8 }}>· Incroyable !</span>}
            </div>
          </div>
        )}

        {/* Main card */}
        <div className="card animate-up delay-2" style={{ marginBottom: '16px' }}>
          <h2 style={{ fontSize: '17px', fontWeight: 500, marginBottom: '6px' }}>
            {hasEntry ? 'Modifier ton humeur' : 'Comment tu te sens aujourd\'hui ?'}
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '20px' }}>
            {score ? `${score}/10 — ${SCORE_LABELS[score]}` : 'Choisis un score de 1 à 10'}
          </p>

          {/* Score grid */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
            {[1,2,3,4,5,6,7,8,9,10].map(n => (
              <button
                key={n}
                className={`score-pill${score === n ? ' selected' : ''}`}
                onClick={() => setScore(n)}
                style={score === n ? { background: SCORE_COLORS[n], borderColor: SCORE_COLORS[n] } : {}}
              >
                {n}
              </button>
            ))}
          </div>

          {/* Emoji scale labels */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text3)', marginBottom: '20px' }}>
            <span>😞 Très mal</span>
            <span>😊 Excellent</span>
          </div>

          {/* Comment */}
          <textarea
            className="input"
            rows={3}
            placeholder="Ajouter un commentaire... (optionnel)"
            value={comment}
            onChange={e => setComment(e.target.value)}
            style={{ marginBottom: '16px' }}
          />

          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={!score || saving}
          >
            {saving ? 'Enregistrement...' : saved ? '✓ Enregistré !' : hasEntry ? 'Mettre à jour' : 'Enregistrer'}
          </button>
        </div>

        {/* Quick tip */}
        {!hasEntry && (
          <div className="animate-up delay-3" style={{ padding: '14px 16px', background: 'var(--accent-soft)', border: '0.5px solid var(--accent-glow)', borderRadius: 'var(--radius-sm)', fontSize: '13px', color: 'var(--text2)' }}>
            💡 Prends 30 secondes chaque soir pour noter ton humeur. C'est suffisant pour construire une habitude.
          </div>
        )}

        {hasEntry && score && (
          <div className="animate-up delay-3" style={{ padding: '14px 16px', background: 'var(--green-soft)', border: '0.5px solid rgba(78,203,160,0.3)', borderRadius: 'var(--radius-sm)', fontSize: '13px', color: 'var(--green)' }}>
            ✓ Humeur enregistrée pour aujourd'hui. À demain !
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  )
}
