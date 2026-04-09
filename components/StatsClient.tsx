'use client'
import { useMemo, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts'
import BottomNav from './BottomNav'
import type { MoodEntry, JournalEntry } from '@/lib/types'

type Period = 'today' | '7j' | '30j' | 'tout'
const SCORE_COLORS = ['','#f07070','#f07070','#f0a855','#f0a855','#f0a855','#8b7cf8','#8b7cf8','#4ecba0','#4ecba0','#4ecba0']
function scoreColor(score: number) { return SCORE_COLORS[Math.round(score)] || '#8b7cf8' }
function timeStr(t: string) { return t ? t.slice(0, 5) : '' }

interface DayDetail {
  date: string
  moods: MoodEntry[]
  journal?: JournalEntry
  avg: number
}

export default function StatsClient({ moods, journals, streak }: { moods: MoodEntry[]; journals: JournalEntry[]; streak: number }) {
  const [period, setPeriod] = useState<Period>('today')
  const [selectedDay, setSelectedDay] = useState<DayDetail | null>(null)

  const today = new Date().toISOString().split('T')[0]
  const journalMap = useMemo(() => {
    const m: Record<string, JournalEntry> = {}
    journals.forEach(j => { m[j.entry_date] = j })
    return m
  }, [journals])

  const filtered = useMemo(() => {
    const now = new Date()
    if (period === 'today') return moods.filter(m => m.created_at.split('T')[0] === today)
    if (period === '7j') { const d = new Date(now); d.setDate(d.getDate()-7); return moods.filter(m => new Date(m.created_at) >= d) }
    if (period === '30j') { const d = new Date(now); d.setDate(d.getDate()-30); return moods.filter(m => new Date(m.created_at) >= d) }
    return moods
  }, [moods, period, today])

  const avg = useMemo(() => filtered.length ? filtered.reduce((s,m) => s+m.score, 0)/filtered.length : 0, [filtered])
  const best = useMemo(() => filtered.length ? Math.max(...filtered.map(m => m.score)) : 0, [filtered])

  // Group by day for non-today views
  const dayStats = useMemo<DayDetail[]>(() => {
    const byDay: Record<string, MoodEntry[]> = {}
    filtered.forEach(m => {
      const day = m.created_at.split('T')[0]
      if (!byDay[day]) byDay[day] = []
      byDay[day].push(m)
    })
    return Object.entries(byDay).map(([date, ms]) => ({
      date,
      moods: ms.sort((a,b) => a.entry_time.localeCompare(b.entry_time)),
      journal: journalMap[date],
      avg: ms.reduce((s,m) => s+m.score, 0)/ms.length
    })).sort((a,b) => b.date.localeCompare(a.date))
  }, [filtered, journalMap])

  const chartData = useMemo(() => dayStats.map(d => ({
    date: d.date,
    label: new Date(d.date+'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
    score: parseFloat(d.avg.toFixed(1))
  })).reverse(), [dayStats])

  const distribution = useMemo(() => {
    const dist = Array.from({length:10}, (_,i) => ({ score:i+1, count:0 }))
    filtered.forEach(m => { if (m.score>=1&&m.score<=10) dist[m.score-1].count++ })
    return dist
  }, [filtered])

  const todayMoods = useMemo(() => moods.filter(m => m.created_at.split('T')[0] === today)
    .sort((a,b) => a.entry_time.localeCompare(b.entry_time)), [moods, today])

  const CustomTooltip = ({ active, payload }: any) => active && payload?.length ? (
    <div style={{ background:'var(--surface)', border:'0.5px solid var(--border2)', borderRadius:'8px', padding:'8px 12px', fontSize:'13px' }}>
      <p style={{ color:'var(--text2)', marginBottom:'2px' }}>{payload[0].payload.label}</p>
      <p style={{ color:'var(--accent)', fontWeight:500 }}>{payload[0].value}/10</p>
    </div>
  ) : null

  // Modal jour
  const DayModal = ({ day }: { day: DayDetail }) => (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:100, display:'flex', alignItems:'flex-end' }} onClick={() => setSelectedDay(null)}>
      <div onClick={e => e.stopPropagation()} style={{ background:'var(--bg2)', borderRadius:'20px 20px 0 0', padding:'24px 20px 40px', width:'100%', maxHeight:'80vh', overflowY:'auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
          <div>
            <p style={{ fontSize:'12px', color:'var(--text3)', marginBottom:'2px' }}>
              {new Date(day.date+'T12:00:00').toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' })}
            </p>
            <p style={{ fontSize:'16px', fontWeight:500, color:scoreColor(day.avg) }}>Moyenne : {day.avg.toFixed(1)}/10</p>
          </div>
          <button onClick={() => setSelectedDay(null)} style={{ color:'var(--text3)', fontSize:'20px' }}>✕</button>
        </div>

        {/* Journal du jour */}
        {day.journal && (
          <div style={{ background:'var(--surface)', borderRadius:'var(--radius-sm)', padding:'12px', marginBottom:'14px' }}>
            <p style={{ fontSize:'11px', color:'var(--text3)', marginBottom:'4px' }}>📓 Carnet de bord</p>
            {day.journal.title && <p style={{ fontSize:'14px', fontWeight:500, marginBottom:'4px' }}>{day.journal.title}</p>}
            <p style={{ fontSize:'13px', color:'var(--text2)', lineHeight:1.6 }}>{day.journal.content}</p>
          </div>
        )}

        {/* Humeurs */}
        <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
          {day.moods.map(m => (
            <div key={m.id} style={{ display:'flex', alignItems:'flex-start', gap:'10px', padding:'10px', background:'var(--surface)', borderRadius:'var(--radius-sm)' }}>
              <div style={{ width:'34px', height:'34px', borderRadius:'50%', background:SCORE_COLORS[m.score]+'22', border:`1.5px solid ${SCORE_COLORS[m.score]}55`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', fontWeight:600, color:SCORE_COLORS[m.score], flexShrink:0 }}>
                {m.score}
              </div>
              <div style={{ flex:1 }}>
                <p style={{ fontSize:'12px', color:'var(--text3)' }}>{timeStr(m.entry_time)}</p>
                {m.comment && <p style={{ fontSize:'13px', color:'var(--text2)' }}>{m.comment}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div className="page">
      {selectedDay && <DayModal day={selectedDay} />}

      <div style={{ padding:'56px 20px 20px' }}>
        <div className="animate-up" style={{ marginBottom:'20px' }}>
          <h1 className="serif" style={{ fontSize:'28px', fontWeight:400, letterSpacing:'-0.02em' }}>Statistiques</h1>
          <p style={{ color:'var(--text2)', fontSize:'14px', marginTop:'4px' }}>{moods.length} entrées au total</p>
        </div>

        {/* Period selector */}
        <div className="animate-up delay-1" style={{ display:'flex', gap:'6px', marginBottom:'20px', flexWrap:'wrap' }}>
          {([['today', "Aujourd'hui"], ['7j','7 jours'], ['30j','30 jours'], ['tout','Tout']] as [Period,string][]).map(([p, label]) => (
            <button key={p} onClick={() => setPeriod(p)} style={{
              padding:'6px 14px', borderRadius:'20px', fontSize:'13px', fontWeight:500,
              background: period===p ? 'var(--accent)' : 'var(--surface)',
              color: period===p ? 'white' : 'var(--text2)',
              border: period===p ? 'none' : '0.5px solid var(--border)',
              transition:'all 0.2s'
            }}>{label}</button>
          ))}
        </div>

        {/* Stat cards */}
        <div className="animate-up delay-2" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px', marginBottom:'20px' }}>
          {[
            { label:'Moyenne', value: avg ? avg.toFixed(1):'—', color: scoreColor(avg) },
            { label:'Meilleur', value: best||'—', color:'var(--green)' },
            { label:'Série 🔥', value: streak||'—', color:'var(--amber)' },
          ].map(s => (
            <div key={s.label} style={{ background:'var(--bg2)', border:'0.5px solid var(--border)', borderRadius:'var(--radius)', padding:'14px 12px', textAlign:'center' }}>
              <p style={{ fontSize:'11px', color:'var(--text3)', marginBottom:'6px' }}>{s.label}</p>
              <p style={{ fontSize:'22px', fontWeight:500, color:s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* TODAY view */}
        {period === 'today' && (
          <div className="card animate-up delay-3">
            <h3 style={{ fontSize:'14px', color:'var(--text2)', marginBottom:'14px', fontWeight:400 }}>
              {todayMoods.length === 0 ? 'Aucune humeur aujourd\'hui' : `${todayMoods.length} humeur${todayMoods.length>1?'s':''} aujourd'hui`}
            </h3>
            <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
              {todayMoods.map(m => (
                <div key={m.id} style={{ display:'flex', alignItems:'flex-start', gap:'10px', padding:'10px', background:'var(--surface)', borderRadius:'var(--radius-sm)' }}>
                  <div style={{ width:'34px', height:'34px', borderRadius:'50%', background:SCORE_COLORS[m.score]+'22', border:`1.5px solid ${SCORE_COLORS[m.score]}55`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', fontWeight:600, color:SCORE_COLORS[m.score], flexShrink:0 }}>
                    {m.score}
                  </div>
                  <div style={{ flex:1 }}>
                    <p style={{ fontSize:'12px', color:'var(--text3)' }}>{timeStr(m.entry_time)}</p>
                    {m.comment && <p style={{ fontSize:'13px', color:'var(--text2)' }}>{m.comment}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PERIOD view */}
        {period !== 'today' && (
          <>
            {chartData.length > 1 && (
              <div className="card animate-up delay-3" style={{ marginBottom:'16px' }}>
                <h3 style={{ fontSize:'14px', color:'var(--text2)', marginBottom:'16px', fontWeight:400 }}>Évolution</h3>
                <ResponsiveContainer width="100%" height={140}>
                  <LineChart data={chartData} margin={{ top:4, right:4, bottom:4, left:-24 }}>
                    <XAxis dataKey="label" tick={{ fontSize:10, fill:'var(--text3)' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                    <YAxis domain={[1,10]} tick={{ fontSize:10, fill:'var(--text3)' }} tickLine={false} axisLine={false} ticks={[1,5,10]} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="score" stroke="var(--accent)" strokeWidth={2} dot={false} activeDot={{ r:4, fill:'var(--accent)', strokeWidth:0 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {filtered.length > 0 && (
              <div className="card animate-up delay-4" style={{ marginBottom:'16px' }}>
                <h3 style={{ fontSize:'14px', color:'var(--text2)', marginBottom:'16px', fontWeight:400 }}>Distribution</h3>
                <ResponsiveContainer width="100%" height={90}>
                  <BarChart data={distribution} margin={{ top:4, right:4, bottom:4, left:-24 }}>
                    <XAxis dataKey="score" tick={{ fontSize:10, fill:'var(--text3)' }} tickLine={false} axisLine={false} />
                    <YAxis hide />
                    <Tooltip content={({ active, payload }: any) => active&&payload?.length ? (
                      <div style={{ background:'var(--surface)', border:'0.5px solid var(--border2)', borderRadius:'8px', padding:'6px 10px', fontSize:'12px', color:'var(--text)' }}>
                        Score {payload[0].payload.score}: {payload[0].value}×
                      </div>
                    ) : null} />
                    <Bar dataKey="count" radius={[4,4,0,0]}>
                      {distribution.map(entry => <Cell key={entry.score} fill={SCORE_COLORS[entry.score]} opacity={0.8} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Par jour */}
            <div className="card animate-up delay-5">
              <h3 style={{ fontSize:'14px', color:'var(--text2)', marginBottom:'14px', fontWeight:400 }}>Par jour</h3>
              {dayStats.length === 0 && <p style={{ color:'var(--text3)', fontSize:'14px', textAlign:'center', padding:'16px 0' }}>Aucune donnée.</p>}
              <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                {dayStats.map(day => {
                  const preview = day.journal?.title || day.journal?.content?.slice(0,50) || null
                  return (
                    <div key={day.date} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px 12px', background:'var(--surface)', borderRadius:'var(--radius-sm)' }}>
                      <div style={{ width:'36px', height:'36px', borderRadius:'50%', background:scoreColor(day.avg)+'22', border:`1.5px solid ${scoreColor(day.avg)}55`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', fontWeight:600, color:scoreColor(day.avg), flexShrink:0 }}>
                        {day.avg.toFixed(1)}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontSize:'12px', color:'var(--text3)', marginBottom:'1px' }}>
                          {day.date === today ? "Aujourd'hui" : new Date(day.date+'T12:00:00').toLocaleDateString('fr-FR', { weekday:'short', day:'numeric', month:'short' })}
                          <span style={{ marginLeft:'6px', color:'var(--text3)' }}>· {day.moods.length} entrée{day.moods.length>1?'s':''}</span>
                        </p>
                        {preview && <p style={{ fontSize:'12px', color:'var(--text2)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{preview}</p>}
                      </div>
                      <button className="btn-ghost" onClick={() => setSelectedDay(day)} style={{ flexShrink:0, padding:'5px 12px', fontSize:'12px' }}>Voir</button>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>
      <BottomNav />
    </div>
  )
}
