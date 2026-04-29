/**
 * MiniAppSurface — renders any Ora surface spec as a dynamic mini-app.
 *
 * Supported templates:
 *   habit_tracker  | checklist     | challenge
 *   booking_flow   | info_card     | social_invite
 *   finance_tracker
 *
 * Each primary action records an interaction via POST /api/ioo/surfaces/{id}/interact.
 */

import React, { useEffect, useState } from 'react'

const API = 'https://connectome-api-production.up.railway.app'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SurfaceSpec {
  template: string
  title: string
  description?: string
  components: string[]
  config?: Record<string, any>
  node_id?: string
  open_mechanism?: string
  tags?: string[]
  domain?: string
  // surface-level fields (returned by API)
  id?: string
  surface_id?: string
}

interface Props {
  surface: SurfaceSpec & { id?: string }
  token: string
  onClose: () => void
  onComplete?: () => void
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const s = {
  sheet: {
    background: 'linear-gradient(160deg, #0d0d18 0%, #111122 100%)',
    borderRadius: '24px 24px 0 0',
    padding: '28px 24px 40px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 20,
    maxHeight: '85vh',
    overflowY: 'auto' as const,
  },
  title: {
    fontWeight: 800,
    fontSize: 20,
    letterSpacing: -0.4,
    lineHeight: 1.25,
    margin: 0,
  },
  description: {
    fontSize: 14,
    color: 'rgba(248,248,252,0.5)',
    lineHeight: 1.55,
    margin: 0,
  },
  primaryBtn: (color = '#00d4aa') => ({
    background: `linear-gradient(135deg, ${color}22, ${color}40)`,
    border: `1px solid ${color}55`,
    color: color,
    borderRadius: 14,
    padding: '12px 20px',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    width: '100%',
    transition: 'all 0.15s',
  }),
  secondaryBtn: {
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.1)',
    color: 'rgba(248,248,252,0.45)',
    borderRadius: 14,
    padding: '10px 20px',
    fontSize: 13,
    cursor: 'pointer',
    width: '100%',
  },
  progressBar: (pct: number, color = '#00d4aa') => ({
    height: 6,
    background: 'rgba(255,255,255,0.07)',
    borderRadius: 3,
    overflow: 'hidden' as const,
    position: 'relative' as const,
    child: {
      width: `${Math.min(100, Math.max(0, pct))}%`,
      height: '100%',
      background: color,
      borderRadius: 3,
      transition: 'width 0.4s ease',
    },
  }),
  tag: {
    fontSize: 11,
    color: 'rgba(248,248,252,0.3)',
    background: 'rgba(255,255,255,0.05)',
    padding: '2px 10px',
    borderRadius: 12,
  },
  divider: {
    height: 1,
    background: 'rgba(255,255,255,0.06)',
  },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ProgressBar({ value, total, color = '#00d4aa' }: { value: number; total: number; color?: string }) {
  const pct = total > 0 ? (value / total) * 100 : 0
  return (
    <div style={{ height: 6, background: 'rgba(255,255,255,0.07)', borderRadius: 3, overflow: 'hidden' }}>
      <div style={{
        width: `${Math.min(100, pct)}%`,
        height: '100%',
        background: color,
        borderRadius: 3,
        transition: 'width 0.4s ease',
      }} />
    </div>
  )
}

function StatPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      background: 'rgba(255,255,255,0.04)', borderRadius: 12,
      padding: '10px 16px', flex: 1, gap: 4,
    }}>
      <div style={{ fontSize: 18, fontWeight: 800, color: '#00d4aa' }}>{value}</div>
      <div style={{ fontSize: 11, color: 'rgba(248,248,252,0.35)', letterSpacing: 0.4 }}>{label}</div>
    </div>
  )
}

// ─── Template renderers ───────────────────────────────────────────────────────

function HabitTracker({ spec, onAction }: { spec: SurfaceSpec; onAction: (a: string) => void }) {
  const [checkedIn, setCheckedIn] = useState(false)
  const cfg = spec.config || {}
  const streakGoal = cfg.streak_goal || 30
  const label = cfg.check_in_label || "Did you do this today?"

  const quotes = [
    "Small steps, consistently taken, change everything.",
    "Showing up is 80% of the battle.",
    "Progress is progress — no matter how small.",
    "Each check-in is a vote for who you want to be.",
  ]
  const quote = quotes[Math.floor(Date.now() / 86400000) % quotes.length]

  return (
    <>
      <div style={{ display: 'flex', gap: 12 }}>
        <StatPill label="Streak goal" value={`${streakGoal}d`} />
        <StatPill label="Template" value="🔥 Habit" />
      </div>
      <div style={s.divider} />
      <div style={{ fontSize: 15, fontWeight: 600 }}>{label}</div>
      <ProgressBar value={0} total={streakGoal} />
      <button
        style={s.primaryBtn(checkedIn ? '#10b981' : '#00d4aa')}
        onClick={() => { setCheckedIn(true); onAction('interact') }}
        disabled={checkedIn}
      >
        {checkedIn ? '✓ Checked in today!' : '✅ Check in'}
      </button>
      <div style={s.divider} />
      <div style={{ fontSize: 12, fontStyle: 'italic', color: 'rgba(248,248,252,0.35)', lineHeight: 1.5 }}>
        "{quote}"
      </div>
    </>
  )
}

function Checklist({ spec, onAction }: { spec: SurfaceSpec; onAction: (a: string) => void }) {
  const cfg = spec.config || {}
  const steps: string[] = cfg.steps || [
    "Research what you need",
    "Block time in your calendar",
    "Complete any preparation",
    "Take the first step",
    "Reflect and celebrate",
  ]
  const [checked, setChecked] = useState<Record<number, boolean>>({})
  const doneCount = Object.values(checked).filter(Boolean).length
  const allDone = doneCount === steps.length

  function toggle(i: number) {
    setChecked(prev => ({ ...prev, [i]: !prev[i] }))
    onAction('interact')
  }

  return (
    <>
      <ProgressBar value={doneCount} total={steps.length} />
      <div style={{ fontSize: 12, color: 'rgba(248,248,252,0.35)' }}>
        {doneCount} / {steps.length} steps done
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {steps.map((step, i) => (
          <div
            key={i}
            onClick={() => toggle(i)}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              cursor: 'pointer', padding: '10px 14px',
              background: checked[i] ? 'rgba(0,212,170,0.07)' : 'rgba(255,255,255,0.03)',
              borderRadius: 12,
              border: `1px solid ${checked[i] ? 'rgba(0,212,170,0.2)' : 'rgba(255,255,255,0.06)'}`,
              transition: 'all 0.15s',
            }}
          >
            <div style={{
              width: 20, height: 20, borderRadius: 6, flexShrink: 0,
              border: `2px solid ${checked[i] ? '#00d4aa' : 'rgba(255,255,255,0.2)'}`,
              background: checked[i] ? '#00d4aa' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, color: '#0a0a0f', fontWeight: 800,
            }}>
              {checked[i] ? '✓' : ''}
            </div>
            <div style={{
              fontSize: 14,
              color: checked[i] ? 'rgba(248,248,252,0.5)' : 'rgba(248,248,252,0.85)',
              textDecoration: checked[i] ? 'line-through' : 'none',
            }}>
              {step}
            </div>
          </div>
        ))}
      </div>
      {allDone && (
        <button style={s.primaryBtn('#10b981')} onClick={() => onAction('complete')}>
          🎉 Complete!
        </button>
      )}
    </>
  )
}

function Challenge({ spec, onAction }: { spec: SurfaceSpec; onAction: (a: string) => void }) {
  const cfg = spec.config || {}
  const durationDays = cfg.duration_days || 7
  const [accepted, setAccepted] = useState(false)

  return (
    <>
      <div style={{
        background: 'rgba(168,85,247,0.08)',
        border: '1px solid rgba(168,85,247,0.2)',
        borderRadius: 16, padding: '16px 18px',
      }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8, color: '#a855f7' }}>
          🏆 {durationDays}-Day Challenge
        </div>
        <div style={{ fontSize: 13, color: 'rgba(248,248,252,0.55)', lineHeight: 1.5 }}>
          {cfg.challenge_description || spec.description || 'Commit to this challenge and unlock your potential.'}
        </div>
      </div>
      <ProgressBar value={0} total={durationDays} color="#a855f7" />
      <div style={{ fontSize: 12, color: 'rgba(248,248,252,0.3)' }}>
        Day 0 of {durationDays}
      </div>
      {!accepted ? (
        <button
          style={s.primaryBtn('#a855f7')}
          onClick={() => { setAccepted(true); onAction('interact') }}
        >
          ⚡ Accept Challenge
        </button>
      ) : (
        <div style={{ textAlign: 'center', padding: '12px 0' }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>💪</div>
          <div style={{ fontWeight: 700, color: '#a855f7' }}>Challenge accepted!</div>
          <div style={{ fontSize: 13, color: 'rgba(248,248,252,0.4)', marginTop: 4 }}>
            Come back tomorrow to log your progress.
          </div>
        </div>
      )}
      <button
        style={s.secondaryBtn}
        onClick={() => {
          if (navigator.share) {
            navigator.share({ title: spec.title, text: 'I just accepted a challenge!' })
          }
          onAction('interact')
        }}
      >
        📲 Share challenge
      </button>
    </>
  )
}

function BookingFlow({ spec, onAction }: { spec: SurfaceSpec; onAction: (a: string) => void }) {
  const cfg = spec.config || {}
  const cost = cfg.estimated_cost_usd

  return (
    <>
      {spec.description && (
        <div style={s.description}>{spec.description}</div>
      )}
      <div style={{ display: 'flex', gap: 12 }}>
        {cost != null && <StatPill label="Est. cost" value={`$${cost}`} />}
        <StatPill label="Type" value="📅 Booking" />
      </div>
      <div style={s.divider} />
      <div style={{ fontSize: 14, color: 'rgba(248,248,252,0.5)', lineHeight: 1.5 }}>
        Find a time that works for you and take action. Don't overthink it — just book it.
      </div>
      <button
        style={s.primaryBtn('#3b82f6')}
        onClick={() => {
          onAction('interact')
          if (cfg.booking_url) window.open(cfg.booking_url, '_blank')
        }}
      >
        📅 {cfg.book_button_label || 'Book Now'}
      </button>
    </>
  )
}

function InfoCard({ spec, onAction }: { spec: SurfaceSpec; onAction: (a: string) => void }) {
  const cfg = spec.config || {}
  const links: Array<{ label: string; url: string }> = cfg.resource_links || []

  return (
    <>
      {(spec.description || cfg.body) && (
        <div style={s.description}>{spec.description || cfg.body}</div>
      )}
      {links.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {links.map((lnk, i) => (
            <a
              key={i}
              href={lnk.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#00d4aa', fontSize: 13,
                textDecoration: 'none',
                padding: '8px 12px',
                background: 'rgba(0,212,170,0.05)',
                borderRadius: 10,
                border: '1px solid rgba(0,212,170,0.15)',
              }}
              onClick={() => onAction('interact')}
            >
              🔗 {lnk.label || lnk.url}
            </a>
          ))}
        </div>
      )}
      {spec.tags && spec.tags.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {spec.tags.slice(0, 5).map(t => (
            <span key={t} style={s.tag}>#{t}</span>
          ))}
        </div>
      )}
      <button style={s.primaryBtn()} onClick={() => onAction('complete')}>
        {cfg.start_button_label || "Let's go →"}
      </button>
    </>
  )
}

function SocialInvite({ spec, onAction }: { spec: SurfaceSpec; onAction: (a: string) => void }) {
  const cfg = spec.config || {}
  const shareMsg = cfg.share_message || `Join me: ${spec.title}`

  function handleShare() {
    onAction('interact')
    if (navigator.share) {
      navigator.share({ title: spec.title, text: shareMsg })
    } else {
      navigator.clipboard?.writeText(shareMsg)
    }
  }

  return (
    <>
      {spec.description && <div style={s.description}>{spec.description}</div>}
      <div style={{
        background: 'rgba(244,63,94,0.07)',
        border: '1px solid rgba(244,63,94,0.2)',
        borderRadius: 14, padding: '14px 16px', fontSize: 14,
        color: 'rgba(248,248,252,0.6)', lineHeight: 1.5,
      }}>
        {shareMsg}
      </div>
      <button style={s.primaryBtn('#f43f5e')} onClick={handleShare}>
        📲 Invite friends
      </button>
    </>
  )
}

function FinanceTracker({ spec, onAction }: { spec: SurfaceSpec; onAction: (a: string) => void }) {
  const cfg = spec.config || {}
  const budget = cfg.budget_usd || 0
  const [saved, setSaved] = useState(0)
  const pct = budget > 0 ? (saved / budget) * 100 : 0

  function addSavings() {
    const amt = parseFloat(prompt('Amount saved towards this goal ($):') || '0')
    if (amt > 0) {
      setSaved(prev => prev + amt)
      onAction('interact')
    }
  }

  return (
    <>
      <div style={{ display: 'flex', gap: 12 }}>
        <StatPill label="Goal" value={budget > 0 ? `$${budget}` : 'Set goal'} />
        <StatPill label="Saved" value={`$${saved.toFixed(0)}`} />
        <StatPill label="Progress" value={`${pct.toFixed(0)}%`} />
      </div>
      {budget > 0 && <ProgressBar value={saved} total={budget} color="#f59e0b" />}
      <div style={{ fontSize: 13, color: 'rgba(248,248,252,0.4)' }}>
        {cfg.savings_label || 'Track your savings toward this goal.'}
      </div>
      <button style={s.primaryBtn('#f59e0b')} onClick={addSavings}>
        💰 Log savings
      </button>
    </>
  )
}

// ─── 15 new template renderers ──────────────────────────────────────────────

function Poll({ spec, onAction }: { spec: SurfaceSpec; onAction: (a: string) => void }) {
  const cfg = spec.config || {}
  const question: string = cfg.question || spec.description || 'What do you think?'
  const options: string[] = cfg.options || ['Yes', 'No', 'Maybe', 'Not sure']
  const [voted, setVoted] = useState<number | null>(null)
  const [votes, setVotes] = useState<number[]>(() => options.map(() => Math.floor(Math.random() * 20) + 1))

  function vote(i: number) {
    if (voted !== null) return
    setVoted(i)
    setVotes(prev => prev.map((v, idx) => idx === i ? v + 1 : v))
    onAction('interact')
  }

  const total = votes.reduce((a, b) => a + b, 0)

  return (
    <>
      <div style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.4 }}>{question}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {options.map((opt, i) => {
          const pct = total > 0 ? Math.round((votes[i] / total) * 100) : 0
          return (
            <div key={i} onClick={() => vote(i)} style={{
              position: 'relative', cursor: voted !== null ? 'default' : 'pointer',
              border: `1px solid ${voted === i ? '#00d4aa' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: 12, overflow: 'hidden', padding: '12px 14px',
              background: 'rgba(255,255,255,0.03)',
            }}>
              {voted !== null && (
                <div style={{
                  position: 'absolute', left: 0, top: 0, bottom: 0,
                  width: `${pct}%`, background: voted === i ? 'rgba(0,212,170,0.15)' : 'rgba(255,255,255,0.04)',
                  transition: 'width 0.5s ease',
                }} />
              )}
              <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14, fontWeight: voted === i ? 700 : 400 }}>{opt}</span>
                {voted !== null && (
                  <span style={{ fontSize: 13, color: voted === i ? '#00d4aa' : 'rgba(248,248,252,0.4)' }}>{pct}%</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
      {voted !== null && (
        <div style={{ fontSize: 12, color: 'rgba(248,248,252,0.35)', textAlign: 'center' }}>
          {total} votes
        </div>
      )}
    </>
  )
}

function Countdown({ spec, onAction }: { spec: SurfaceSpec; onAction: (a: string) => void }) {
  const cfg = spec.config || {}
  const targetDate = cfg.target_date ? new Date(cfg.target_date) : new Date(Date.now() + 7 * 86400000)

  function getRemaining() {
    const diff = targetDate.getTime() - Date.now()
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 }
    return {
      days: Math.floor(diff / 86400000),
      hours: Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
      seconds: Math.floor((diff % 60000) / 1000),
    }
  }

  const [time, setTime] = useState(getRemaining())
  useEffect(() => {
    const id = setInterval(() => setTime(getRemaining()), 1000)
    return () => clearInterval(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const pad = (n: number) => String(n).padStart(2, '0')
  const isDone = time.days === 0 && time.hours === 0 && time.minutes === 0 && time.seconds === 0

  return (
    <>
      <div style={{ fontSize: 13, color: 'rgba(248,248,252,0.45)', marginBottom: -8 }}>
        {cfg.event_name || 'Countdown to'}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700 }}>{targetDate.toLocaleDateString()}</div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
        {([{ v: time.days, l: 'DAYS' }, { v: time.hours, l: 'HRS' }, { v: time.minutes, l: 'MIN' }, { v: time.seconds, l: 'SEC' }] as Array<{v:number;l:string}>).map(({ v, l }) => (
          <div key={l} style={{
            flex: 1, background: 'rgba(0,212,170,0.07)', border: '1px solid rgba(0,212,170,0.2)',
            borderRadius: 14, padding: '16px 8px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 28, fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: '#00d4aa' }}>{pad(v)}</div>
            <div style={{ fontSize: 10, color: 'rgba(248,248,252,0.3)', marginTop: 4, letterSpacing: 1 }}>{l}</div>
          </div>
        ))}
      </div>
      {isDone ? (
        <button style={s.primaryBtn('#10b981')} onClick={() => onAction('complete')}>🎉 It&apos;s time!</button>
      ) : (
        <button style={s.primaryBtn()} onClick={() => onAction('interact')}>
          {cfg.action_label || 'Set reminder'}
        </button>
      )}
    </>
  )
}

function Leaderboard({ spec, onAction }: { spec: SurfaceSpec; onAction: (a: string) => void }) {
  const cfg = spec.config || {}
  const entries: Array<{ name: string; score: number; isMe?: boolean }> = cfg.entries || [
    { name: 'You', score: 420, isMe: true },
    { name: 'Alex', score: 380 },
    { name: 'Jordan', score: 305 },
    { name: 'Sam', score: 210 },
    { name: 'Riley', score: 175 },
  ]
  const sorted = [...entries].sort((a, b) => b.score - a.score)
  const medalColors = ['#f59e0b', '#9ca3af', '#b45309']
  const medals = ['🥇', '🥈', '🥉']

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {sorted.map((entry, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 14px', borderRadius: 12,
            background: entry.isMe ? 'rgba(0,212,170,0.08)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${entry.isMe ? 'rgba(0,212,170,0.25)' : 'rgba(255,255,255,0.06)'}`,
          }}>
            <div style={{ width: 28, textAlign: 'center', fontSize: i < 3 ? 18 : 13,
              color: i < 3 ? medalColors[i] : 'rgba(248,248,252,0.3)', fontWeight: 700 }}>
              {i < 3 ? medals[i] : `#${i + 1}`}
            </div>
            <div style={{ flex: 1, fontSize: 14, fontWeight: entry.isMe ? 700 : 400,
              color: entry.isMe ? '#00d4aa' : '#f8f8fc' }}>
              {entry.name}{entry.isMe ? ' (you)' : ''}
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: i < 3 ? medalColors[i] : 'rgba(248,248,252,0.5)' }}>
              {entry.score.toLocaleString()}
            </div>
          </div>
        ))}
      </div>
      <button style={s.primaryBtn()} onClick={() => onAction('interact')}>
        {cfg.action_label || '🏃 Improve my rank'}
      </button>
    </>
  )
}

function MediaCard({ spec, onAction }: { spec: SurfaceSpec; onAction: (a: string) => void }) {
  const cfg = spec.config || {}
  const imageUrl: string = cfg.image_url || ''
  const tags: string[] = cfg.tags || spec.tags || []

  return (
    <>
      {imageUrl && (
        <div style={{ borderRadius: 16, overflow: 'hidden', maxHeight: 200 }}>
          <img src={imageUrl} alt={spec.title} style={{ width: '100%', objectFit: 'cover', display: 'block' }} />
        </div>
      )}
      {(cfg.body || spec.description) && (
        <div style={s.description}>{cfg.body || spec.description}</div>
      )}
      {tags.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
          {tags.slice(0, 5).map((t: string) => <span key={t} style={s.tag}>#{t}</span>)}
        </div>
      )}
      <div style={{ display: 'flex', gap: 10 }}>
        <button style={{ ...s.primaryBtn(), flex: 1 }} onClick={() => onAction('complete')}>
          {cfg.cta_label || '▶ View content'}
        </button>
        <button
          style={{ ...s.secondaryBtn, width: 'auto', padding: '12px 16px' }}
          onClick={() => {
            if (navigator.share) navigator.share({ title: spec.title, url: cfg.share_url || window.location.href })
            onAction('interact')
          }}
        >
          📤
        </button>
      </div>
    </>
  )
}

function QuizSurface({ spec, onAction }: { spec: SurfaceSpec; onAction: (a: string) => void }) {
  const cfg = spec.config || {}
  const defaultQuestions = [
    { q: 'What is the first step?', options: ['Plan', 'Act', 'Reflect', 'Skip'], correct: 0 },
    { q: 'How often should you review?', options: ['Daily', 'Weekly', 'Monthly', 'Never'], correct: 1 },
    { q: 'What matters most?', options: ['Speed', 'Consistency', 'Perfection', 'Luck'], correct: 1 },
  ]
  const questions: Array<{ q: string; options: string[]; correct: number }> = cfg.questions || defaultQuestions
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [answers, setAnswers] = useState<(number | null)[]>(() => questions.map(() => null))
  const [done, setDone] = useState(false)

  function pick(i: number) {
    if (selected !== null) return
    setSelected(i)
    const next = [...answers]
    next[current] = i
    setAnswers(next)
    onAction('interact')
  }

  function advance() {
    if (current < questions.length - 1) {
      setCurrent(current + 1)
      setSelected(answers[current + 1])
    } else {
      setDone(true)
      onAction('complete')
    }
  }

  const score = answers.filter((a, i) => a === questions[i]?.correct).length

  if (done) {
    const pct = Math.round((score / questions.length) * 100)
    return (
      <>
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>{pct >= 70 ? '🎉' : '📚'}</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#00d4aa' }}>{score}/{questions.length}</div>
          <div style={{ fontSize: 14, color: 'rgba(248,248,252,0.5)', marginTop: 6 }}>
            {pct >= 70 ? 'Great job!' : 'Keep learning!'}
          </div>
        </div>
        <ProgressBar value={score} total={questions.length} />
        <button style={s.primaryBtn()} onClick={() => {
          setCurrent(0); setSelected(null)
          setAnswers(questions.map(() => null)); setDone(false)
        }}>
          🔄 Try again
        </button>
      </>
    )
  }

  const q = questions[current]
  const optionLetters = ['A', 'B', 'C', 'D']

  return (
    <>
      <ProgressBar value={current} total={questions.length} />
      <div style={{ fontSize: 12, color: 'rgba(248,248,252,0.35)' }}>Question {current + 1} of {questions.length}</div>
      <div style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.4 }}>{q.q}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {q.options.map((opt, i) => {
          let bg = 'rgba(255,255,255,0.03)'
          let border = 'rgba(255,255,255,0.08)'
          let textColor = '#f8f8fc'
          if (selected !== null) {
            if (i === q.correct) { bg = 'rgba(0,212,170,0.1)'; border = '#00d4aa'; textColor = '#00d4aa' }
            else if (i === selected) { bg = 'rgba(239,68,68,0.1)'; border = '#ef4444'; textColor = '#ef4444' }
          }
          return (
            <div key={i} onClick={() => pick(i)} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              cursor: selected !== null ? 'default' : 'pointer',
              padding: '11px 14px', borderRadius: 12,
              background: bg, border: `1px solid ${border}`, transition: 'all 0.2s',
            }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: textColor, opacity: 0.7, width: 16 }}>{optionLetters[i]}</span>
              <span style={{ fontSize: 14, color: textColor }}>{opt}</span>
            </div>
          )
        })}
      </div>
      {selected !== null && (
        <button style={s.primaryBtn()} onClick={advance}>
          {current < questions.length - 1 ? 'Next →' : 'See results'}
        </button>
      )}
    </>
  )
}

function JournalPrompt({ spec, onAction }: { spec: SurfaceSpec; onAction: (a: string) => void }) {
  const cfg = spec.config || {}
  const prompt: string = cfg.prompt || spec.description || 'What\'s one thing you want to achieve today?'
  const minWords: number = cfg.min_words || 0
  const [text, setText] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0
  const canSubmit = wordCount >= Math.max(1, minWords) && text.trim().length > 0

  function submit() {
    if (!canSubmit) return
    setSubmitted(true)
    onAction('complete')
  }

  if (submitted) {
    return (
      <div style={{ textAlign: 'center', padding: '24px 0' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>✍️</div>
        <div style={{ fontWeight: 700, fontSize: 16, color: '#00d4aa' }}>Entry saved!</div>
        <div style={{ fontSize: 13, color: 'rgba(248,248,252,0.4)', marginTop: 6 }}>
          {wordCount} words · Keep reflecting.
        </div>
      </div>
    )
  }

  return (
    <>
      <div style={{
        background: 'rgba(0,212,170,0.05)', border: '1px solid rgba(0,212,170,0.15)',
        borderRadius: 14, padding: '14px 16px',
      }}>
        <div style={{ fontSize: 13, fontStyle: 'italic', color: 'rgba(248,248,252,0.6)', lineHeight: 1.6 }}>
          {prompt}
        </div>
      </div>
      <textarea
        value={text}
        onChange={e => { setText(e.target.value); onAction('interact') }}
        placeholder="Write your thoughts here..."
        style={{
          width: '100%', minHeight: 120, background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12,
          color: '#f8f8fc', fontSize: 14, padding: '12px 14px',
          resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6,
          boxSizing: 'border-box',
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: 'rgba(248,248,252,0.3)' }}>
          {wordCount} word{wordCount !== 1 ? 's' : ''}{minWords > 0 ? ` / ${minWords} min` : ''}
        </span>
        <button
          style={{ ...s.primaryBtn(), width: 'auto', padding: '10px 20px', opacity: canSubmit ? 1 : 0.4 }}
          onClick={submit}
          disabled={!canSubmit}
        >
          Save entry →
        </button>
      </div>
    </>
  )
}

function LocationMap({ spec, onAction }: { spec: SurfaceSpec; onAction: (a: string) => void }) {
  const cfg = spec.config || {}
  const address: string = cfg.address || 'Location not specified'
  const distance: number | undefined = cfg.distance_km
  const lat: number | undefined = cfg.lat
  const lng: number | undefined = cfg.lng

  const mapsUrl = lat != null && lng != null
    ? `https://www.google.com/maps?q=${lat},${lng}`
    : `https://www.google.com/maps/search/${encodeURIComponent(address)}`

  return (
    <>
      {spec.description && <div style={s.description}>{spec.description}</div>}
      <div style={{
        background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.2)',
        borderRadius: 16, padding: '16px 18px',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ fontSize: 24, lineHeight: 1 }}>📍</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.4 }}>{address}</div>
            {distance != null && (
              <div style={{ fontSize: 12, color: 'rgba(248,248,252,0.4)', marginTop: 4 }}>
                ~{distance} km away
              </div>
            )}
          </div>
        </div>
      </div>
      {cfg.notes && (
        <div style={{ fontSize: 13, color: 'rgba(248,248,252,0.5)', lineHeight: 1.5 }}>{cfg.notes}</div>
      )}
      <button
        style={s.primaryBtn('#3b82f6')}
        onClick={() => {
          window.open(mapsUrl, '_blank')
          onAction('interact')
        }}
      >
        🗺️ Get directions
      </button>
    </>
  )
}

function EventCard({ spec, onAction }: { spec: SurfaceSpec; onAction: (a: string) => void }) {
  const cfg = spec.config || {}
  const dateStr = cfg.date
    ? new Date(cfg.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    : cfg.date_text || 'Date TBA'
  const timeStr: string = cfg.time || 'Time TBA'
  const venue: string = cfg.venue || 'Venue TBA'
  const eventUrl: string | undefined = cfg.event_url
  const [rsvped, setRsvped] = useState(false)

  function rsvp() {
    setRsvped(true)
    onAction('interact')
    if (eventUrl) window.open(eventUrl, '_blank')
  }

  return (
    <>
      {spec.description && <div style={s.description}>{spec.description}</div>}
      <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8 }}>
        {([{ icon: '📅', text: dateStr }, { icon: '🕐', text: timeStr }, { icon: '📍', text: venue }] as Array<{icon:string;text:string}>).map(({ icon, text }) => (
          <div key={text} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(255,255,255,0.05)', borderRadius: 10,
            padding: '6px 12px', fontSize: 13, color: 'rgba(248,248,252,0.7)',
          }}>
            <span>{icon}</span><span>{text}</span>
          </div>
        ))}
      </div>
      {cfg.capacity != null && (
        <div style={{ fontSize: 12, color: 'rgba(248,248,252,0.35)' }}>
          {cfg.spots_left != null ? `${cfg.spots_left} spots left` : `Capacity: ${cfg.capacity}`}
        </div>
      )}
      <button
        style={s.primaryBtn(rsvped ? '#10b981' : '#f59e0b')}
        onClick={rsvp}
        disabled={rsvped}
      >
        {rsvped ? '✓ RSVP confirmed!' : (cfg.rsvp_label || '🎟️ RSVP now')}
      </button>
    </>
  )
}

function ProductCard({ spec, onAction }: { spec: SurfaceSpec; onAction: (a: string) => void }) {
  const cfg = spec.config || {}
  const price: number | undefined = cfg.price
  const currency: string = cfg.currency || '$'
  const rating: number = cfg.rating || 0
  const reviewCount: number = cfg.review_count || 0
  const imageUrl: string = cfg.image_url || ''
  const buyUrl: string = cfg.buy_url || cfg.booking_url || ''

  function renderStars(r: number) {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} style={{ color: i < Math.round(r) ? '#f59e0b' : 'rgba(255,255,255,0.15)', fontSize: 16 }}>★</span>
    ))
  }

  return (
    <>
      {imageUrl && (
        <div style={{ borderRadius: 16, overflow: 'hidden', maxHeight: 180 }}>
          <img src={imageUrl} alt={spec.title} style={{ width: '100%', objectFit: 'cover', display: 'block' }} />
        </div>
      )}
      {spec.description && <div style={s.description}>{spec.description}</div>}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {rating > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ display: 'flex' }}>{renderStars(rating)}</div>
            {reviewCount > 0 && (
              <span style={{ fontSize: 12, color: 'rgba(248,248,252,0.4)' }}>({reviewCount})</span>
            )}
          </div>
        )}
        {price != null && (
          <div style={{ fontSize: 22, fontWeight: 800, color: '#f8f8fc' }}>
            {currency}{price}
          </div>
        )}
      </div>
      <button
        style={s.primaryBtn('#f59e0b')}
        onClick={() => {
          onAction('interact')
          if (buyUrl) window.open(buyUrl, '_blank')
        }}
      >
        {cfg.buy_label || '🛍️ Buy now'}
      </button>
    </>
  )
}

function ConversationStarter({ spec, onAction }: { spec: SurfaceSpec; onAction: (a: string) => void }) {
  const cfg = spec.config || {}
  const prompts: string[] = cfg.prompts || [
    "What's one thing you've been avoiding that could change everything?",
    'If you could master one skill in 30 days, what would it be?',
    "What would you do today if you knew you couldn't fail?",
    'Who in your life deserves more of your attention?',
    "What's a belief you hold that most people would disagree with?",
  ]
  const [idx, setIdx] = useState(0)

  function next() {
    setIdx(prev => (prev + 1) % prompts.length)
    onAction('interact')
  }

  return (
    <>
      <div style={{
        background: 'rgba(168,85,247,0.07)', border: '1px solid rgba(168,85,247,0.2)',
        borderRadius: 18, padding: '24px 20px', minHeight: 120,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.6, textAlign: 'center', color: '#f8f8fc' }}>
          &ldquo;{prompts[idx]}&rdquo;
        </div>
      </div>
      <div style={{ fontSize: 12, color: 'rgba(248,248,252,0.3)', textAlign: 'center' }}>
        {idx + 1} / {prompts.length}
      </div>
      <button style={s.primaryBtn('#a855f7')} onClick={next}>
        ✨ Next prompt
      </button>
      <button style={s.secondaryBtn} onClick={() => {
        if (navigator.share) navigator.share({ title: 'Conversation Starter', text: prompts[idx] })
        onAction('interact')
      }}>
        📤 Share this prompt
      </button>
    </>
  )
}

function SkillTree({ spec, onAction }: { spec: SurfaceSpec; onAction: (a: string) => void }) {
  const cfg = spec.config || {}
  type NodeStatus = 'locked' | 'in_progress' | 'unlocked'
  const defaultNodes: Array<{ id: string; label: string; status: NodeStatus; xp?: number }> = [
    { id: '1', label: 'Foundations', status: 'unlocked', xp: 100 },
    { id: '2', label: 'Core Skills', status: 'unlocked', xp: 150 },
    { id: '3', label: 'Intermediate', status: 'in_progress', xp: 200 },
    { id: '4', label: 'Advanced', status: 'locked', xp: 250 },
    { id: '5', label: 'Mastery', status: 'locked', xp: 500 },
  ]
  const nodes: Array<{ id: string; label: string; status: NodeStatus; xp?: number }> = cfg.nodes || defaultNodes

  const statusStyle: Record<NodeStatus, { bg: string; border: string; textColor: string; icon: string }> = {
    locked: { bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.06)', textColor: 'rgba(248,248,252,0.3)', icon: '🔒' },
    in_progress: { bg: 'rgba(0,212,170,0.08)', border: 'rgba(0,212,170,0.3)', textColor: '#00d4aa', icon: '⚡' },
    unlocked: { bg: 'rgba(16,185,129,0.07)', border: 'rgba(16,185,129,0.25)', textColor: '#10b981', icon: '✅' },
  }

  const currentNode = nodes.find(n => n.status === 'in_progress')

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {nodes.map((node, i) => {
          const st = statusStyle[node.status] || statusStyle.locked
          return (
            <div key={node.id} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '12px 16px', borderRadius: 14,
              background: st.bg, border: `1px solid ${st.border}`,
            }}>
              <div style={{ fontSize: 18, width: 24, textAlign: 'center', flexShrink: 0 }}>{st.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: st.textColor }}>{node.label}</div>
                {node.xp != null && (
                  <div style={{ fontSize: 11, color: 'rgba(248,248,252,0.3)', marginTop: 2 }}>{node.xp} XP</div>
                )}
              </div>
              {i < nodes.length - 1 && node.status === 'unlocked' && (
                <div style={{ fontSize: 10, color: 'rgba(248,248,252,0.2)' }}>▼</div>
              )}
            </div>
          )
        })}
      </div>
      {currentNode && (
        <button style={s.primaryBtn()} onClick={() => onAction('interact')}>
          ⚡ Continue: {currentNode.label}
        </button>
      )}
    </>
  )
}

function VisionBoard({ spec, onAction }: { spec: SurfaceSpec; onAction: (a: string) => void }) {
  const cfg = spec.config || {}
  const images: string[] = cfg.images || []
  const affirmation: string = cfg.affirmation || spec.description || 'Your vision is your reality in progress.'

  return (
    <>
      {images.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {images.slice(0, 4).map((src, i) => (
            <div key={i} style={{ aspectRatio: '1', overflow: 'hidden', borderRadius: 12 }}>
              <img src={src} alt={`vision ${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ))}
          {Array.from({ length: Math.max(0, 4 - images.length) }, (_, i) => (
            <div key={`empty-${i}`} style={{
              aspectRatio: '1', borderRadius: 12, background: 'rgba(255,255,255,0.03)',
              border: '2px dashed rgba(255,255,255,0.08)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontSize: 24, color: 'rgba(255,255,255,0.15)',
            }}>+</div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {['🌟', '🚀', '💎', '🌈'].map((em, i) => (
            <div key={i} style={{
              aspectRatio: '1', borderRadius: 12, background: 'rgba(168,85,247,0.07)',
              border: '1px solid rgba(168,85,247,0.15)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontSize: 36,
            }}>{em}</div>
          ))}
        </div>
      )}
      <div style={{
        background: 'rgba(168,85,247,0.07)', border: '1px solid rgba(168,85,247,0.2)',
        borderRadius: 14, padding: '14px 18px',
        fontSize: 14, fontStyle: 'italic', color: 'rgba(248,248,252,0.7)', lineHeight: 1.6, textAlign: 'center',
      }}>
        ✨ {affirmation}
      </div>
      <button style={s.primaryBtn('#a855f7')} onClick={() => {
        if (navigator.share) navigator.share({ title: spec.title, text: affirmation })
        onAction('interact')
      }}>
        📤 Share my vision
      </button>
    </>
  )
}

function DailyRitual({ spec, onAction }: { spec: SurfaceSpec; onAction: (a: string) => void }) {
  const cfg = spec.config || {}
  type RitualStep = { label: string; duration?: string }
  const steps: RitualStep[] = (cfg.steps as Array<string | RitualStep> | undefined)?.map(
    (rawStep: string | RitualStep) => typeof rawStep === 'string' ? { label: rawStep } : rawStep
  ) || [
    { label: 'Breathe deeply for 1 minute', duration: '1 min' },
    { label: 'Set your intention', duration: '2 min' },
    { label: 'Move your body', duration: '5 min' },
    { label: 'Review your goals', duration: '3 min' },
    { label: 'Take one action', duration: '10 min' },
  ]
  const [checked, setChecked] = useState<Record<number, boolean>>({})
  const doneCount = Object.values(checked).filter(Boolean).length
  const allDone = doneCount === steps.length
  const circumference = 2 * Math.PI * 20
  const strokeDashoffset = steps.length > 0 ? circumference * (1 - doneCount / steps.length) : circumference

  function toggle(i: number) {
    setChecked(prev => ({ ...prev, [i]: !prev[i] }))
    onAction('interact')
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '4px 0' }}>
        <svg width={56} height={56} viewBox="0 0 56 56">
          <circle cx={28} cy={28} r={20} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={4} />
          <circle
            cx={28} cy={28} r={20} fill="none"
            stroke={allDone ? '#10b981' : '#00d4aa'} strokeWidth={4}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform="rotate(-90 28 28)"
            style={{ transition: 'stroke-dashoffset 0.4s ease' }}
          />
          <text x={28} y={33} textAnchor="middle" fill="#f8f8fc" fontSize={13} fontWeight={700}>
            {doneCount}/{steps.length}
          </text>
        </svg>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{allDone ? '🎉 Ritual complete!' : cfg.ritual_name || 'Daily Ritual'}</div>
          <div style={{ fontSize: 12, color: 'rgba(248,248,252,0.35)', marginTop: 2 }}>
            {allDone ? 'Great work today.' : `${steps.length - doneCount} steps remaining`}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {steps.map((step, i) => (
          <div key={i} onClick={() => toggle(i)} style={{
            display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
            padding: '10px 14px', borderRadius: 12,
            background: checked[i] ? 'rgba(0,212,170,0.07)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${checked[i] ? 'rgba(0,212,170,0.2)' : 'rgba(255,255,255,0.06)'}`,
          }}>
            <div style={{
              width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
              border: `2px solid ${checked[i] ? '#00d4aa' : 'rgba(255,255,255,0.2)'}`,
              background: checked[i] ? '#00d4aa' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, color: '#0a0a0f', fontWeight: 900,
            }}>
              {checked[i] ? '✓' : ''}
            </div>
            <div style={{ flex: 1, fontSize: 14, color: checked[i] ? 'rgba(248,248,252,0.45)' : '#f8f8fc', textDecoration: checked[i] ? 'line-through' : 'none' }}>
              {step.label}
            </div>
            {step.duration && (
              <span style={{ fontSize: 11, color: 'rgba(248,248,252,0.25)' }}>{step.duration}</span>
            )}
          </div>
        ))}
      </div>
      {allDone && (
        <button style={s.primaryBtn('#10b981')} onClick={() => onAction('complete')}>
          ✅ Done for today!
        </button>
      )}
    </>
  )
}

function Comparison({ spec, onAction }: { spec: SurfaceSpec; onAction: (a: string) => void }) {
  const cfg = spec.config || {}
  const optionA: { title: string; description?: string; image_url?: string } = cfg.option_a || { title: 'Option A', description: 'The first choice' }
  const optionB: { title: string; description?: string; image_url?: string } = cfg.option_b || { title: 'Option B', description: 'The second choice' }
  const [voted, setVoted] = useState<'a' | 'b' | null>(null)
  const [votesA, setVotesA] = useState<number>(() => (cfg.votes_a as number | undefined) ?? Math.floor(Math.random() * 30) + 10)
  const [votesB, setVotesB] = useState<number>(() => (cfg.votes_b as number | undefined) ?? Math.floor(Math.random() * 30) + 10)

  function vote(side: 'a' | 'b') {
    if (voted) return
    setVoted(side)
    if (side === 'a') setVotesA(v => v + 1)
    else setVotesB(v => v + 1)
    onAction('interact')
  }

  const total = votesA + votesB
  const pctA = total > 0 ? Math.round((votesA / total) * 100) : 50
  const pctB = 100 - pctA

  return (
    <>
      {spec.description && <div style={s.description}>{spec.description}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {([
          { side: 'a' as const, opt: optionA, pct: pctA, color: '#3b82f6' },
          { side: 'b' as const, opt: optionB, pct: pctB, color: '#a855f7' },
        ]).map(({ side, opt, pct, color }) => (
          <div key={side} onClick={() => vote(side)} style={{
            cursor: voted ? 'default' : 'pointer',
            background: voted === side ? `${color}18` : 'rgba(255,255,255,0.03)',
            border: `1px solid ${voted === side ? color : 'rgba(255,255,255,0.08)'}`,
            borderRadius: 16, padding: 14, transition: 'all 0.2s',
            display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            {opt.image_url && (
              <div style={{ borderRadius: 10, overflow: 'hidden', aspectRatio: '1' }}>
                <img src={opt.image_url} alt={opt.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
            <div style={{ fontSize: 14, fontWeight: 700, color: voted === side ? color : '#f8f8fc' }}>{opt.title}</div>
            {opt.description && (
              <div style={{ fontSize: 12, color: 'rgba(248,248,252,0.45)', lineHeight: 1.4 }}>{opt.description}</div>
            )}
            {voted && (
              <div style={{ fontSize: 18, fontWeight: 800, color, textAlign: 'center' }}>{pct}%</div>
            )}
          </div>
        ))}
      </div>
      {voted
        ? <div style={{ fontSize: 12, color: 'rgba(248,248,252,0.3)', textAlign: 'center' }}>{total} votes total</div>
        : <div style={{ fontSize: 13, color: 'rgba(248,248,252,0.35)', textAlign: 'center' }}>Tap to vote</div>
      }
    </>
  )
}

function Celebration({ spec, onAction }: { spec: SurfaceSpec; onAction: (a: string) => void }) {
  const cfg = spec.config || {}
  const achievement: string = cfg.achievement || spec.title
  const xp: number = cfg.xp_earned ?? cfg.xp ?? 0
  const emoji: string = cfg.emoji || '🏆'
  const [shared, setShared] = useState(false)
  const confettiColors = ['#00d4aa', '#a855f7', '#f59e0b', '#f43f5e', '#3b82f6']

  useEffect(() => { onAction('interact') }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <div style={{
        textAlign: 'center', padding: '24px 0',
        background: 'radial-gradient(ellipse at 50% 0%, rgba(0,212,170,0.1) 0%, transparent 70%)',
        borderRadius: 20,
      }}>
        <div style={{ fontSize: 72, lineHeight: 1, marginBottom: 8 }}>{emoji}</div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 16 }}>
          {Array.from({ length: 10 }, (_, i) => (
            <span key={i} style={{
              width: 6, height: 6, borderRadius: '50%',
              background: confettiColors[i % confettiColors.length],
              display: 'inline-block', opacity: 0.6,
            }} />
          ))}
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#f8f8fc', marginBottom: 8 }}>{achievement}</div>
        {xp > 0 && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(0,212,170,0.12)', border: '1px solid rgba(0,212,170,0.3)',
            borderRadius: 20, padding: '6px 16px', fontSize: 14, fontWeight: 700, color: '#00d4aa',
          }}>
            ⚡ +{xp} XP earned
          </div>
        )}
        {cfg.message && (
          <div style={{ fontSize: 13, color: 'rgba(248,248,252,0.5)', lineHeight: 1.6, marginTop: 14, padding: '0 8px' }}>
            {cfg.message}
          </div>
        )}
      </div>
      <button
        style={s.primaryBtn(shared ? '#10b981' : '#00d4aa')}
        onClick={() => {
          setShared(true)
          if (navigator.share) navigator.share({ title: achievement, text: `I just earned: ${achievement}${xp ? ` (+${xp} XP!)` : ''}` })
          onAction('complete')
        }}
      >
        {shared ? '✓ Shared!' : '🎉 Share achievement'}
      </button>
    </>
  )
}

function FallbackSurface({ spec, onAction }: { spec: SurfaceSpec; onAction: (a: string) => void }) {
  return (
    <>
      {spec.description && <div style={s.description}>{spec.description}</div>}
      <button style={s.primaryBtn()} onClick={() => onAction('complete')}>
        Start →
      </button>
    </>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function MiniAppSurface({ surface, token, onClose, onComplete }: Props) {
  const surfaceId = surface.id || (surface as any).surface_id

  // Record view on mount
  useEffect(() => {
    if (!surfaceId) return
    fetch(`${API}/api/ioo/surfaces/${surfaceId}/interact`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'view' }),
    }).catch(() => {})
  }, [surfaceId])

  async function handleAction(action: string) {
    if (!surfaceId) return
    try {
      await fetch(`${API}/api/ioo/surfaces/${surfaceId}/interact`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (action === 'complete' && onComplete) {
        onComplete()
      }
    } catch {
      // best-effort
    }
  }

  const template = surface.template || 'info_card'

  function renderTemplate() {
    switch (template) {
      case 'habit_tracker':  return <HabitTracker spec={surface} onAction={handleAction} />
      case 'checklist':      return <Checklist spec={surface} onAction={handleAction} />
      case 'challenge':      return <Challenge spec={surface} onAction={handleAction} />
      case 'booking_flow':   return <BookingFlow spec={surface} onAction={handleAction} />
      case 'info_card':      return <InfoCard spec={surface} onAction={handleAction} />
      case 'social_invite':  return <SocialInvite spec={surface} onAction={handleAction} />
      case 'finance_tracker':      return <FinanceTracker spec={surface} onAction={handleAction} />
      case 'poll':                   return <Poll spec={surface} onAction={handleAction} />
      case 'countdown':              return <Countdown spec={surface} onAction={handleAction} />
      case 'leaderboard':            return <Leaderboard spec={surface} onAction={handleAction} />
      case 'media_card':             return <MediaCard spec={surface} onAction={handleAction} />
      case 'quiz':                   return <QuizSurface spec={surface} onAction={handleAction} />
      case 'journal_prompt':         return <JournalPrompt spec={surface} onAction={handleAction} />
      case 'location_map':           return <LocationMap spec={surface} onAction={handleAction} />
      case 'event_card':             return <EventCard spec={surface} onAction={handleAction} />
      case 'product_card':           return <ProductCard spec={surface} onAction={handleAction} />
      case 'conversation_starter':   return <ConversationStarter spec={surface} onAction={handleAction} />
      case 'skill_tree':             return <SkillTree spec={surface} onAction={handleAction} />
      case 'vision_board':           return <VisionBoard spec={surface} onAction={handleAction} />
      case 'daily_ritual':           return <DailyRitual spec={surface} onAction={handleAction} />
      case 'comparison':             return <Comparison spec={surface} onAction={handleAction} />
      case 'celebration':            return <Celebration spec={surface} onAction={handleAction} />
      default:                       return <FallbackSurface spec={surface} onAction={handleAction} />
    }
  }

  const templateEmoji: Record<string, string> = {
    habit_tracker: '🔥',
    checklist: '✅',
    challenge: '🏆',
    booking_flow: '📅',
    info_card: '💡',
    social_invite: '👥',
    finance_tracker: '💰',
    poll: '📊',
    countdown: '⏱️',
    leaderboard: '🏅',
    media_card: '🎬',
    quiz: '🧠',
    journal_prompt: '✍️',
    location_map: '📍',
    event_card: '🎟️',
    product_card: '🛍️',
    conversation_starter: '💬',
    skill_tree: '🌳',
    vision_board: '🌟',
    daily_ritual: '🌅',
    comparison: '⚖️',
    celebration: '🎉',
  }
  const emoji = templateEmoji[template] || '🚀'

  return (
    /* Backdrop */
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
        background: 'rgba(10,10,15,0.80)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Sheet */}
      <div style={s.sheet}>
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: -8 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)' }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ fontSize: 28, lineHeight: 1 }}>{emoji}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={s.title}>{surface.title}</h2>
            {surface.domain && (
              <div style={{ fontSize: 11, color: 'rgba(248,248,252,0.3)', marginTop: 3, letterSpacing: 0.4 }}>
                {surface.domain}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.06)', border: 'none',
              color: 'rgba(248,248,252,0.4)', fontSize: 20,
              width: 36, height: 36, borderRadius: 10, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>

        <div style={s.divider} />

        {/* Template content */}
        {renderTemplate()}

        {/* Footer */}
        <button style={{ ...s.secondaryBtn, marginTop: 4 }} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  )
}
