'use client'
import { useMemo, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts'
import BottomNav from './BottomNav'
import type { MoodEntry } from '@/lib/types'

type Period = '7j' | '30j' | 'tout'

const SCORE_COLORS = ['','#f07070','#f07070','#f0a855','#f0a855','#f0a855','#8b7cf8','#8b7cf8','#4ecba0','#4ecba0','#4ecba0']

function scoreColor(score: number) { return SCORE_COLORS[Math.round(score)] || '#8b7cf8' }

export default function StatsClient({ moods, streak }: { moods: MoodEntry[]; streak: number }) {
  const [period, setPeriod] = useState<Period>('30j')

  const filtered = useMemo(() => {
    const now = new Date()
    if (period === '7j') { const d = new Date(now); d.setDate(d.getDate()-7); return moods.filter(m => new Date(m.created_at) >= d) }
    if (period === '30j') { const d = new Date(now); d.setDate(d.getDate()-30); return moods.filter(m => new Date(m.created_at) >= d) }
    return moods
  }, [moods, period])

  const avg = useMemo(() => filtered.length ? filtered.reduce((s, m) => s + m.score, 0) / filtered.length : 0, [filtered])
  const best = useMemo(() => filtered.length ? Math.max(...filtered.map(m => m.score)) : 0, [filtered])
  const worst = useMemo(() => filtered.length ? Math.min(...filtered.map(m => m.score)) : 0, [filtered])

  const chartData = useMemo(() => {
    const byDay: Record<string, number[]> = {}
    filtered.forEach(m => {
      const day = m.created_at.split('T')[0]
      if (!byDay[day]) byDay[day] = []
      byDay[day].push(m.score)
    })
    return Object.entries(byDay).map(([date, scores]) => ({
      date,
      label: new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
      score: parseFloat((scores.reduce((a,b)=>a+b,0)/scores.length).toFixed(1))
    }))
  }, [filtered])

  const distribution = useMemo(() => {
    const dist = Array.from({length: 10}, (_, i) => ({ score: i+1, count: 0 }))
    filtered.forEach(m => { if (m.score >= 1 && m.score <= 10) dist[m.score-1].count++ })
    return dist
  }, [filtered])

  const recent = useMemo(() => [...moods].reverse().slice(0, 15), [moods])

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload?.length) {
      return (
        <div style={{ background: 'var(--surface)', border: '0.5px solid var(--border2)', borderRadius: '8px', padding: '8px 12px', fontSize: '13px' }}>
          <p style={{ color: 'var(--text2)', marginBottom: '2px' }}>{payload[0].payload.label}</p>
          <p style={{ color: 'var(--accent)', fontWeight: 500 }}>{payload[0].value}/10</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="page">
      <div style={{ padding: '56px 20px 20px' }}>
        <div className="animate-up" style={{ marginBottom: '24px' }}>
          <h1 className="serif" style={{ fontSize: '28px', fontWeight: 400, letterSpacing: '-0.02em' }}>Statistiques</h1>
          <p style={{ color: 'var(--text2)', fontSize: '14px', marginTop: '4px' }}>{moods.length} entrées au total</p>
        </div>

        {/* Period selector */}
        <div className="animate-up delay-1" style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          {(['7j','30j','tout'] as Period[]).map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{
              padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 500,
              background: period === p ? 'var(--accent)' : 'var(--surface)',
              color: period === p ? 'white' : 'var(--text2)',
              border: period === p ? 'none' : '0.5px solid var(--border)',
              transition: 'all 0.2s'
            }}>{p === 'tout' ? 'Tout' : `${p}`}</button>
          ))}
        </div>

        {/* Stats cards */}
        <div className="animate-up delay-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginBottom: '20px' }}>
          {[
            { label: 'Moyenne', value: avg ? avg.toFixed(1) : '—', color: scoreColor(avg) },
            { label: 'Meilleur', value: best || '—', color: 'var(--green)' },
            { label: 'Série 🔥', value: streak || '—', color: 'var(--amber)' },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 'var(--radius)', padding: '14px 12px', textAlign: 'center' }}>
              <p style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '6px' }}>{s.label}</p>
              <p style={{ fontSize: '22px', fontWeight: 500, color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Line chart */}
        {chartData.length > 1 && (
          <div className="card animate-up delay-3" style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', color: 'var(--text2)', marginBottom: '16px', fontWeight: 400 }}>Évolution de l'humeur</h3>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 4, left: -24 }}>
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--text3)' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis domain={[1,10]} tick={{ fontSize: 10, fill: 'var(--text3)' }} tickLine={false} axisLine={false} ticks={[1,5,10]} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="score" stroke="var(--accent)" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: 'var(--accent)', strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Distribution */}
        {filtered.length > 0 && (
          <div className="card animate-up delay-4" style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', color: 'var(--text2)', marginBottom: '16px', fontWeight: 400 }}>Distribution des scores</h3>
            <ResponsiveContainer width="100%" height={100}>
              <BarChart data={distribution} margin={{ top: 4, right: 4, bottom: 4, left: -24 }}>
                <XAxis dataKey="score" tick={{ fontSize: 10, fill: 'var(--text3)' }} tickLine={false} axisLine={false} />
                <YAxis hide />
                <Tooltip content={({ active, payload }: any) => active && payload?.length ? (
                  <div style={{ background: 'var(--surface)', border: '0.5px solid var(--border2)', borderRadius: '8px', padding: '6px 10px', fontSize: '12px', color: 'var(--text)' }}>
                    Score {payload[0].payload.score}: {payload[0].value}×
                  </div>
                ) : null} />
                <Bar dataKey="count" radius={[4,4,0,0]}>
                  {distribution.map((entry) => (
                    <Cell key={entry.score} fill={SCORE_COLORS[entry.score]} opacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Recent entries */}
        <div className="card animate-up delay-5">
          <h3 style={{ fontSize: '14px', color: 'var(--text2)', marginBottom: '16px', fontWeight: 400 }}>Dernières entrées</h3>
          {recent.length === 0 && (
            <p style={{ color: 'var(--text3)', fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>Aucune entrée encore.</p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recent.map(entry => (
              <div key={entry.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: SCORE_COLORS[entry.score] + '22', border: `1.5px solid ${SCORE_COLORS[entry.score]}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '13px', fontWeight: 600, color: SCORE_COLORS[entry.score] }}>
                  {entry.score}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '2px' }}>
                    {new Date(entry.created_at).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </p>
                  {entry.comment && <p style={{ fontSize: '13px', color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>"{entry.comment}"</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
