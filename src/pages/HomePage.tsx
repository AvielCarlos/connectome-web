/**
 * HomePage — iDo's philosophical entry point.
 *
 * Two paths, every session:
 *   "I know what I want to do" → Aura goal creation/clarification + directed feed
 *   "I don't know what I want to do" → randomized/recommended IOO feed discovery
 *
 * "I know" path also A/B tested:
 *   Variant A (immediate): straight to input
 *   Variant B (clarifying): Aura asks "What does success look like?" first
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuraClient } from '../lib/AuraClient';
import { useAuth } from '../context/AuthContext';
import { useExperiment } from '../lib/useExperiment';

// ─── A/B variant helpers (client-side, deterministic per user) ────────────────

/** "I know" path: A = immediate input, B = clarifying question first */
function getKnowVariant(userId: string): 'immediate' | 'clarifying' {
  try {
    const hash = parseInt(userId.slice(-6), 16);
    return hash % 2 === 0 ? 'immediate' : 'clarifying';
  } catch {
    return 'immediate';
  }
}

/** "Show me" path: deep = 3 questions, instant = straight to feed, one_q = one prompt */
function getExploreVariant(userId: string): 'deep' | 'instant' | 'one_q' {
  try {
    const hash = parseInt(userId.slice(-6), 16);
    const variants = ['deep', 'instant', 'one_q'] as const;
    return variants[hash % 3];
  } catch {
    return 'instant';
  }
}

// ─── State machine ────────────────────────────────────────────────────────────

type HomeView =
  | 'choice'
  | 'goal-input'
  | 'creating'
  | 'intake-deep'
  | 'intake-one-q';

// ─── Sub-components ───────────────────────────────────────────────────────────

const SHARED_STYLES = {
  pageBase: {
    minHeight: 'var(--visual-viewport-height, 100dvh)',
    background: '#0a0a0f',
    color: '#f8f8fc',
  } as React.CSSProperties,
  centered: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 20px',
  },
  backBtn: {
    background: 'transparent',
    border: 'none',
    color: 'rgba(248,248,252,0.4)',
    fontSize: 14,
    cursor: 'pointer',
    padding: '8px 0',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  } as React.CSSProperties,
};

// ─── Main component ───────────────────────────────────────────────────────────

export default function HomePage() {
  const navigate = useNavigate();
  const { userId } = useAuth();

  // ─── A/B experiments ────────────────────────────────────────────────────
  const { variant: homeEntryVariant } = useExperiment('home_entry_state');
  const { variant: homeIntakeVariant } = useExperiment('home_intake_depth');
  // Note: knowVariant / exploreVariant still use local hash helpers below for backwards compat

  const [view, setView] = useState<HomeView>('choice');
  const [knowVariant, setKnowVariant] = useState<'immediate' | 'clarifying'>('immediate');
  const [exploreVariant, setExploreVariant] = useState<'deep' | 'instant' | 'one_q'>('instant');
  const [selectedChoice, setSelectedChoice] = useState<'know' | 'explore' | null>(null);

  // Goal input state
  const [goalInput, setGoalInput] = useState('');
  const [clarifyAnswer, setClarifyAnswer] = useState('');
  const [creatingGoalTitle, setCreatingGoalTitle] = useState('');
  const [goalError, setGoalError] = useState('');

  // Deep intake state
  const [mood, setMood] = useState('');
  const [lifeArea, setLifeArea] = useState('');
  const [timeAvail, setTimeAvail] = useState('');

  // One-Q intake state
  const [oneQAnswer, setOneQAnswer] = useState('');

  const goalInputRef = useRef<HTMLInputElement>(null);
  const oneQRef = useRef<HTMLInputElement>(null);

  // Resolve variants when userId available
  useEffect(() => {
    if (userId) {
      setKnowVariant(getKnowVariant(userId));
      setExploreVariant(getExploreVariant(userId));
    }
  }, [userId]);

  // Auto-focus inputs
  useEffect(() => {
    if (view === 'goal-input') {
      setTimeout(() => goalInputRef.current?.focus(), 120);
    }
    if (view === 'intake-one-q') {
      setTimeout(() => oneQRef.current?.focus(), 120);
    }
  }, [view]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleKnow = () => {
    AuraClient.trackAbEvent('home_session_v1', 'know', 'home_choice').catch(() => {});
    setSelectedChoice('know');
    // TODO(IOO): persist this low-friction selection into the user preference
    // vector/profile. Avoid typed questionnaires; learn from taps/swipes over time.
    setTimeout(() => setView('goal-input'), 180);
  };

  const handleExplore = () => {
    AuraClient.trackAbEvent('home_session_v1', 'explore', 'home_choice').catch(() => {});
    setSelectedChoice('explore');
    // TODO(IOO): seed randomized/recommended discovery using the user's current
    // IOO vector, then refine it from not interested / do later / do now taps.

    if (exploreVariant === 'instant') {
      AuraClient.trackAbEvent('home_intake_v1', 'instant', 'intake_depth').catch(() => {});
      setTimeout(() => navigate('/app/ido'), 180);
      return;
    }

    setTimeout(() => setView(exploreVariant === 'deep' ? 'intake-deep' : 'intake-one-q'), 180);
  };

  const handleGoalSubmit = async () => {
    const title = goalInput.trim();
    if (!title) return;

    setCreatingGoalTitle(title);
    setView('creating');
    setGoalError('');

    // Track A/B
    AuraClient.trackAbEvent('home_know_v1', knowVariant, 'goal_submitted').catch(() => {});

    try {
      // Create the goal (include clarifying answer as description if provided)
      const goal = await AuraClient.createGoal(
        title,
        clarifyAnswer.trim() || undefined,
      );

      // Kick off breakdown (best-effort — feed can still load without it)
      AuraClient.breakdownGoal(goal.id).catch(() => {});

      // Navigate to goal-directed feed
      navigate(`/feed?goal=${goal.id}`);
    } catch (e: any) {
      const msg = e?.response?.data?.detail || 'Could not create goal. Try again.';
      setGoalError(msg);
      setView('goal-input');
    }
  };

  const handleIntakeSubmit = () => {
    const variant = exploreVariant === 'deep' ? 'deep' : 'one_q';
    AuraClient.trackAbEvent('home_intake_v1', variant, 'intake_depth').catch(() => {});
    navigate('/app/ido');
  };

  // ── View: creating ─────────────────────────────────────────────────────────
  if (view === 'creating') {
    return (
      <div style={{ ...SHARED_STYLES.pageBase, ...SHARED_STYLES.centered }}>
        <div style={{ fontSize: 48, color: '#8b5cf6', animation: 'oraFade 1.4s ease-in-out infinite', marginBottom: 24 }}>◈</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#f8f8fc', marginBottom: 10 }}>
          Building your path…
        </div>
        <div style={{ fontSize: 14, color: 'rgba(248,248,252,0.4)', textAlign: 'center', maxWidth: 300, lineHeight: 1.6 }}>
          Aura is breaking down{' '}
          <em style={{ color: 'rgba(248,248,252,0.7)' }}>"{creatingGoalTitle}"</em>{' '}
          into concrete steps
        </div>
        <GlobalStyles />
      </div>
    );
  }

  // ── View: goal input ───────────────────────────────────────────────────────
  if (view === 'goal-input') {
    return (
      <div style={{ ...SHARED_STYLES.pageBase, display: 'flex', flexDirection: 'column', padding: '0 20px' }}>
        {/* Back */}
        <div style={{ paddingTop: 60 }}>
          <button style={SHARED_STYLES.backBtn} onClick={() => setView('choice')}>
            ← Back
          </button>
        </div>

        {/* Content, vertically centered */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          maxWidth: 560,
          margin: '0 auto',
          width: '100%',
          paddingBottom: 'calc(var(--bottom-nav-height, 80px) + 24px)',
        }}>
          {/* Aura mark */}
          <div style={{ fontSize: 26, color: '#8b5cf6', marginBottom: 18, animation: 'oraFade 3s ease-in-out infinite' }}>✦</div>

          {/* Heading */}
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.5, marginBottom: 8, lineHeight: 1.2 }}>
            What do you want to do?
          </h1>
          <p style={{ fontSize: 15, color: 'rgba(248,248,252,0.45)', marginBottom: 32, lineHeight: 1.6, margin: '0 0 32px' }}>
            Tell Aura your goal. She'll build a breakdown and guide every step.
          </p>

          {/* Clarifying question — Variant B only */}
          {knowVariant === 'clarifying' && (
            <div style={{ marginBottom: 20 }} className="ora-fade-in">
              <label style={{
                display: 'block', fontSize: 13, fontWeight: 600,
                color: 'rgba(248,248,252,0.5)', marginBottom: 10, letterSpacing: 0.3,
              }}>
                What does success look like for you? <span style={{ opacity: 0.5 }}>(optional)</span>
              </label>
              <input
                value={clarifyAnswer}
                onChange={(e) => setClarifyAnswer(e.target.value)}
                placeholder="e.g. I want to feel confident in the kitchen"
                style={{
                  width: '100%', background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12,
                  padding: '13px 16px', fontSize: 14, color: '#f8f8fc', outline: 'none',
                  boxSizing: 'border-box', marginBottom: 4,
                }}
              />
            </div>
          )}

          {/* Main input row */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{
              flex: 1,
              background: 'rgba(139,92,246,0.06)',
              border: '1.5px solid rgba(139,92,246,0.3)',
              borderRadius: 16,
              padding: '16px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              transition: 'border-color 0.2s',
            }}>
              <span style={{ fontSize: 18, color: '#8b5cf6', flexShrink: 0 }}>✦</span>
              <input
                ref={goalInputRef}
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && goalInput.trim()) handleGoalSubmit();
                }}
                placeholder="I want to…"
                style={{
                  background: 'transparent', border: 'none', outline: 'none',
                  fontSize: 18, fontWeight: 600, color: '#f8f8fc', flex: 1, minWidth: 0,
                }}
              />
            </div>

            {goalInput.trim() && (
              <button
                onClick={handleGoalSubmit}
                style={{
                  width: 52, height: 52, borderRadius: 14,
                  background: '#8b5cf6', border: 'none',
                  cursor: 'pointer', fontSize: 22,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, color: '#fff',
                  boxShadow: '0 4px 20px rgba(139,92,246,0.4)',
                  transition: 'transform 0.1s, box-shadow 0.1s',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.05)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
              >
                →
              </button>
            )}
          </div>

          {/* Error */}
          {goalError && (
            <div style={{
              marginTop: 12, fontSize: 13, color: '#ef4444',
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 10, padding: '10px 14px',
            }}>{goalError}</div>
          )}

          {/* Example prompts */}
          <div style={{ marginTop: 28 }}>
            <div style={{
              fontSize: 11, color: 'rgba(248,248,252,0.25)', fontWeight: 600,
              letterSpacing: 1, marginBottom: 12, textTransform: 'uppercase',
            }}>
              Try something like
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {[
                'I want to get fit',
                'I want to learn to cook',
                'I want to start a business',
                'I want to read more',
                'I want to meditate daily',
                'I want to save money',
              ].map((ex) => (
                <button
                  key={ex}
                  onClick={() => {
                    setGoalInput(ex);
                    setTimeout(() => goalInputRef.current?.focus(), 50);
                  }}
                  style={{
                    background: 'rgba(139,92,246,0.08)',
                    border: '1px solid rgba(139,92,246,0.18)',
                    borderRadius: 20, padding: '7px 14px', fontSize: 13,
                    color: 'rgba(248,248,252,0.5)', cursor: 'pointer', transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.color = 'rgba(248,248,252,0.8)';
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(139,92,246,0.4)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.color = 'rgba(248,248,252,0.5)';
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(139,92,246,0.18)';
                  }}
                >{ex}</button>
              ))}
            </div>
          </div>
        </div>

        <GlobalStyles />
      </div>
    );
  }

  // ── View: intake-deep (3 questions) ───────────────────────────────────────
  if (view === 'intake-deep') {
    return (
      <div style={{ ...SHARED_STYLES.pageBase, display: 'flex', flexDirection: 'column', padding: '0 20px' }}>
        <div style={{ paddingTop: 60 }}>
          <button style={SHARED_STYLES.backBtn} onClick={() => setView('choice')}>← Back</button>
        </div>

        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
          maxWidth: 480, margin: '0 auto', width: '100%', paddingBottom: 'calc(var(--bottom-nav-height, 80px) + 24px)',
        }}>
          <div style={{ fontSize: 26, color: '#00d4aa', marginBottom: 18, animation: 'oraFade 3s ease-in-out infinite' }}>◈</div>
          <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.4, marginBottom: 4 }}>
            Quick check-in
          </h2>
          <p style={{ fontSize: 14, color: 'rgba(248,248,252,0.4)', marginBottom: 32, lineHeight: 1.6 }}>
            Help Aura tune your feed for this session.
          </p>

          {/* Q1: Mood */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'rgba(248,248,252,0.7)', marginBottom: 14 }}>
              How are you feeling right now?
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              {[
                { key: 'low',      emoji: '😔', label: 'Low' },
                { key: 'neutral',  emoji: '😐', label: 'Neutral' },
                { key: 'good',     emoji: '😊', label: 'Good' },
                { key: 'energized',emoji: '⚡', label: 'Energized' },
              ].map(({ key, emoji, label }) => (
                <button key={key} onClick={() => setMood(key)} style={{
                  flex: 1, padding: '12px 6px', borderRadius: 12,
                  background: mood === key ? 'rgba(0,212,170,0.12)' : 'rgba(255,255,255,0.04)',
                  border: mood === key ? '1px solid rgba(0,212,170,0.4)' : '1px solid rgba(255,255,255,0.08)',
                  cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  transition: 'all 0.15s',
                }}>
                  <span style={{ fontSize: 22 }}>{emoji}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: mood === key ? '#00d4aa' : 'rgba(248,248,252,0.4)' }}>
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Q2: Life area */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'rgba(248,248,252,0.7)', marginBottom: 14 }}>
              What area of life feels most alive right now?
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {['Career', 'Health', 'Relationships', 'Learning', 'Creative', 'Financial'].map((area) => (
                <button key={area} onClick={() => setLifeArea(area)} style={{
                  padding: '9px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  background: lifeArea === area ? 'rgba(0,212,170,0.12)' : 'rgba(255,255,255,0.04)',
                  border: lifeArea === area ? '1px solid rgba(0,212,170,0.4)' : '1px solid rgba(255,255,255,0.08)',
                  color: lifeArea === area ? '#00d4aa' : 'rgba(248,248,252,0.5)',
                  transition: 'all 0.15s',
                }}>{area}</button>
              ))}
            </div>
          </div>

          {/* Q3: Time */}
          <div style={{ marginBottom: 36 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'rgba(248,248,252,0.7)', marginBottom: 14 }}>
              How much time do you have?
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              {['5 min', '30 min', 'I have time'].map((t) => (
                <button key={t} onClick={() => setTimeAvail(t)} style={{
                  flex: 1, padding: '12px 8px', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  background: timeAvail === t ? 'rgba(0,212,170,0.12)' : 'rgba(255,255,255,0.04)',
                  border: timeAvail === t ? '1px solid rgba(0,212,170,0.4)' : '1px solid rgba(255,255,255,0.08)',
                  color: timeAvail === t ? '#00d4aa' : 'rgba(248,248,252,0.5)',
                  transition: 'all 0.15s',
                }}>{t}</button>
              ))}
            </div>
          </div>

          <button onClick={handleIntakeSubmit} style={{
            background: '#00d4aa', border: 'none', borderRadius: 14,
            padding: '16px', fontSize: 16, fontWeight: 700,
            color: '#0a0a0f', cursor: 'pointer', width: '100%',
            boxShadow: '0 4px 20px rgba(0,212,170,0.25)',
            transition: 'transform 0.1s',
          }}>
            Show me what to do →
          </button>
        </div>

        <GlobalStyles />
      </div>
    );
  }

  // ── View: intake-one-q (single prompt) ────────────────────────────────────
  if (view === 'intake-one-q') {
    return (
      <div style={{ ...SHARED_STYLES.pageBase, ...SHARED_STYLES.centered }}>
        <div style={{ maxWidth: 480, width: '100%' }}>
          <div style={{ fontSize: 32, color: '#00d4aa', textAlign: 'center', marginBottom: 24, animation: 'oraFade 3s ease-in-out infinite' }}>◈</div>
          <h2 style={{ fontSize: 24, fontWeight: 800, textAlign: 'center', marginBottom: 8, letterSpacing: -0.4 }}>
            What's on your mind?
          </h2>
          <p style={{ fontSize: 14, color: 'rgba(248,248,252,0.4)', textAlign: 'center', marginBottom: 28, lineHeight: 1.6 }}>
            Aura will use this to personalise your feed — or skip and she'll figure it out.
          </p>

          <input
            ref={oneQRef}
            value={oneQAnswer}
            onChange={(e) => setOneQAnswer(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleIntakeSubmit()}
            placeholder="Anything on your mind…"
            style={{
              width: '100%', background: 'rgba(0,212,170,0.06)',
              border: '1.5px solid rgba(0,212,170,0.25)', borderRadius: 14,
              padding: '16px 18px', fontSize: 16, color: '#f8f8fc', outline: 'none',
              boxSizing: 'border-box', marginBottom: 16,
            }}
          />

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleIntakeSubmit} style={{
              flex: 1, background: '#00d4aa', border: 'none', borderRadius: 12,
              padding: '14px', fontSize: 15, fontWeight: 700, color: '#0a0a0f', cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(0,212,170,0.25)',
            }}>
              Show me what to do →
            </button>
            <button onClick={handleIntakeSubmit} style={{
              padding: '14px 18px', background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12,
              fontSize: 14, color: 'rgba(248,248,252,0.4)', cursor: 'pointer',
            }}>
              Skip
            </button>
          </div>
        </div>

        <GlobalStyles />
      </div>
    );
  }

  // ── View: choice (default) ─────────────────────────────────────────────────
  return (
    <div style={{ ...SHARED_STYLES.pageBase, ...SHARED_STYLES.centered }}>
      {/* Aura's mark */}
      <div style={{
        fontSize: 52,
        color: '#8b5cf6',
        marginBottom: 36,
        animation: 'oraFloat 3s ease-in-out infinite',
        userSelect: 'none',
        cursor: 'default',
      }}>
        ◈
      </div>

      {/* Session prompt */}
      <p style={{
        fontSize: 14,
        color: 'rgba(248,248,252,0.28)',
        marginBottom: 44,
        letterSpacing: 0.4,
        textAlign: 'center',
      }}>
        What kind of session is this?
      </p>

      {/* Two choice cards */}
      <div style={{ width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ── "I know what I want" card ── */}
        <ChoiceCard
          icon="✦"
          iconColor="#8b5cf6"
          iconBg="rgba(139,92,246,0.15)"
          iconBorder="rgba(139,92,246,0.3)"
          accentColor="rgba(139,92,246,0.5)"
          hoverBorder="rgba(139,92,246,0.4)"
          title="I know what I want to do"
          subtitle="Tell Aura your goal. She builds your path and gets you moving."
          onClick={handleKnow}
          selected={selectedChoice === 'know'}
        />

        {/* ── "I don't know what I want to do" card ── */}
        <ChoiceCard
          icon="◈"
          iconColor="#00d4aa"
          iconBg="rgba(0,212,170,0.1)"
          iconBorder="rgba(0,212,170,0.25)"
          accentColor="rgba(0,212,170,0.4)"
          hoverBorder="rgba(0,212,170,0.4)"
          title="I don't know what I want to do"
          subtitle="Aura reads the moment and picks what's right for you, right now."
          onClick={handleExplore}
          selected={selectedChoice === 'explore'}
        />
      </div>

      {/* Footnote */}
      <div style={{
        marginTop: 32,
        fontSize: 12,
        color: 'rgba(248,248,252,0.18)',
        textAlign: 'center',
        letterSpacing: 0.2,
      }}>
        Aura remembers your choice and learns from it
      </div>

      <GlobalStyles />
    </div>
  );
}

// ─── ChoiceCard ───────────────────────────────────────────────────────────────

interface ChoiceCardProps {
  icon: string;
  iconColor: string;
  iconBg: string;
  iconBorder: string;
  accentColor: string;
  hoverBorder: string;
  title: string;
  subtitle: string;
  onClick: () => void;
  selected?: boolean;
}

function ChoiceCard({
  icon, iconColor, iconBg, iconBorder, accentColor, hoverBorder,
  title, subtitle, onClick, selected = false,
}: ChoiceCardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: selected ? `${iconColor}14` : hovered ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${selected ? iconColor : hovered ? hoverBorder : 'rgba(255,255,255,0.1)'}`,
        borderRadius: 16,
        padding: '24px 20px',
        textAlign: 'left',
        cursor: 'pointer',
        transition: 'all 0.2s cubic-bezier(.25,.8,.25,1)',
        position: 'relative',
        overflow: 'hidden',
        transform: hovered ? 'translateY(-1px)' : 'none',
        boxShadow: selected ? `0 0 32px ${iconColor}33` : hovered ? `0 8px 32px rgba(0,0,0,0.3)` : 'none',
      }}
    >
      {selected && (
        <div style={{
          position: 'absolute', right: 14, top: 14,
          color: iconColor, fontSize: 18, fontWeight: 900,
        }}>✓</div>
      )}
      {/* Left accent line */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
        background: accentColor,
        borderRadius: '0 2px 2px 0',
        opacity: hovered ? 1 : 0.6,
        transition: 'opacity 0.2s',
      }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
        {/* Icon bubble */}
        <div style={{
          width: 46, height: 46, borderRadius: 13,
          background: iconBg, border: `1px solid ${iconBorder}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, flexShrink: 0, color: iconColor,
          transition: 'transform 0.2s',
          transform: hovered ? 'scale(1.05)' : 'scale(1)',
        }}>
          {icon}
        </div>

        <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
          <div style={{
            fontSize: 20, fontWeight: 800, color: '#f8f8fc',
            marginBottom: 7, letterSpacing: -0.3, lineHeight: 1.2,
          }}>
            {title}
          </div>
          <div style={{ fontSize: 14, color: 'rgba(248,248,252,0.45)', lineHeight: 1.55 }}>
            {subtitle}
          </div>
        </div>

        {/* Arrow */}
        <div style={{
          fontSize: 20, color: hovered ? iconColor : 'rgba(248,248,252,0.2)',
          transition: 'all 0.2s', flexShrink: 0, paddingTop: 10,
          transform: hovered ? 'translateX(2px)' : 'none',
        }}>
          ›
        </div>
      </div>
    </button>
  );
}

// ─── Global animation styles ──────────────────────────────────────────────────

function GlobalStyles() {
  return (
    <style>{`
      @keyframes oraFloat {
        0%, 100% { transform: translateY(0) scale(1); opacity: 1; }
        50% { transform: translateY(-5px) scale(1.03); opacity: 0.75; }
      }
      @keyframes oraFade {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.45; }
      }
      .ora-fade-in {
        animation: oraFadeIn 0.3s ease-out;
      }
      @keyframes oraFadeIn {
        from { opacity: 0; transform: translateY(8px); }
        to   { opacity: 1; transform: translateY(0);   }
      }
    `}</style>
  );
}
