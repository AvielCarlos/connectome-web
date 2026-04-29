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
      case 'finance_tracker': return <FinanceTracker spec={surface} onAction={handleAction} />
      default:               return <FallbackSurface spec={surface} onAction={handleAction} />
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
