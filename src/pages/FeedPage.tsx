/**
 * FeedPage — TikTok-style vertical snap-scroll feed.
 *
 * v2: Full-bleed visual design (Airbnb/TikTok quality), collection save,
 * backend progress signals on interaction.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { AuraClient, ScreenResponse } from '../lib/AuraClient';
import { AuraCard } from '../components/AuraCard';
import { CollectionPicker } from '../components/CollectionPicker';
import { useAuth } from '../context/AuthContext';
import { useExperiment } from '../lib/useExperiment';

// ─── Domain config ────────────────────────────────────────────────────────────
function normalizeDomain(domain?: string) { return domain === 'Rest' ? 'iVive' : domain; }

const DOMAIN_CONFIG: Record<string, { color: string; gradient: string; emoji: string }> = {
  iVive:   { color: '#10b981', gradient: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #0a0a0f 100%)', emoji: '🌱' },
  Eviva:   { color: '#3b82f6', gradient: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 50%, #0a0a0f 100%)', emoji: '🌊' },
  Aventi:  { color: '#f59e0b', gradient: 'linear-gradient(135deg, #451a03 0%, #92400e 50%, #0a0a0f 100%)', emoji: '🚀' },
};
const DEFAULT_DOMAIN = { color: '#00d4aa', gradient: 'linear-gradient(135deg, #042f2e 0%, #0f766e 50%, #0a0a0f 100%)', emoji: '◈' };

const DOMAIN_IMAGE_FALLBACK: Record<string, string> = {
  Aventi: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&auto=format&fit=crop',
  iVive: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1200&auto=format&fit=crop',
  Eviva: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&auto=format&fit=crop',
  default: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&auto=format&fit=crop',
};

const CAPABILITY_PULSE_VERSION = 'v2';

const CAPABILITY_CARDS = [
  {
    id: 'goal_current_stage',
    field: 'goal_current_stage',
    eyebrow: 'Present state',
    title: 'What kind of node would help you right now?',
    goalTitle: 'For {goal}, where are you right now?',
    body: 'Aura uses your goals, values, energy, constraints, and resources before choosing the next IOO node.',
    options: ['Just starting', 'Preparing', 'Actively doing', 'Blocked/stuck', 'Recovering / low capacity'],
  },
  {
    id: 'goal_biggest_gap',
    field: 'goal_biggest_gap',
    eyebrow: 'Bridge signal',
    title: 'What is the biggest gap between now and what matters?',
    goalTitle: 'What is the biggest gap between now and {goal}?',
    body: 'This tells Aura whether to recommend a tiny action, a bridge step, support, practice, connection, or a resource.',
    options: ['Time', 'Energy/health', 'Money/resources', 'Skill/confidence', 'People/support', 'Clarity/focus'],
  },
  {
    id: 'today_capacity',
    field: 'today_capacity',
    eyebrow: 'Capacity',
    title: 'What can you realistically do today?',
    body: 'Now cards should fit your actual day, not an idealised version of you.',
    options: ['5 minutes', '15–30 minutes', '1–2 hours', 'A deeper block'],
  },
  {
    id: 'energy_state',
    field: 'current_energy_state',
    eyebrow: 'Energy',
    title: 'Where is your energy right now?',
    body: 'This changes whether Aura should suggest action, preparation, connection, or restoration.',
    options: ['Low / need gentleness', 'Steady', 'High / ready to move', 'Scattered / need focus'],
  },
  {
    id: 'available_resources',
    field: 'available_resources_today',
    eyebrow: 'Resources',
    title: 'What do you have access to right now?',
    body: 'Money, location, tools, people, and time all affect the path.',
    options: ['Just my phone', 'Home/quiet space', 'Transport / can go out', 'Budget to spend', 'People I can contact'],
    multi: true,
  },
  {
    id: 'social_bandwidth',
    field: 'social_bandwidth',
    eyebrow: 'Social bandwidth',
    title: 'Do you want this next step to involve people?',
    body: 'Some goals need connection; some days need solitude.',
    options: ['Solo only', 'Open to messaging someone', 'Open to meeting people', 'Prefer accountability/support', 'Surprise me'],
  },
  {
    id: 'desired_next_step_style',
    field: 'desired_next_step_style',
    eyebrow: 'Next move',
    title: 'What kind of next step would help most?',
    body: 'Aura will use this to route the Now feed across your goals, values, and nearby possibilities.',
    options: ['Tiny win', 'Practical progress', 'Learning/practice', 'Restore/regulate', 'Adventure/novelty', 'Service/connection'],
  },
];

function getDomainConfig(spec: any) {
  const d = normalizeDomain(spec?.metadata?.domain || spec?.domain || '');
  return DOMAIN_CONFIG[d || ''] || DEFAULT_DOMAIN;
}

type FeedMode = 'now' | 'future';

const TIME_HORIZON_OPTIONS = [
  { id: '5m', label: '5m', context: 'The user has about 5 minutes. Recommend one tiny action that can begin immediately.' },
  { id: '30m', label: '30m', context: 'The user has about 30 minutes. Recommend a concrete short action or nearby micro-adventure.' },
  { id: '2h', label: '2h', context: 'The user has 1–2 hours. Recommend a meaningful action, outing, class, call, practice, or project block.' },
  { id: 'Day', label: 'Day', context: 'The user has most of a day. Recommend a richer experience, sequence, or mini-adventure.' },
  { id: 'Weekend', label: 'Weekend', context: 'The user has a weekend. Recommend a multi-step adventure, retreat, trip, workshop, or social/service path.' },
  { id: 'Week+', label: 'Week+', context: 'The user has a week or more. Recommend future opportunities, programs, travel, or larger life-path moves.' },
  { id: 'Freedom', label: 'Total freedom', context: 'The user has total freedom. Guide them toward the greatest adventure available: expansive, transformational, ambitious, real-world, and still executable through concrete next nodes.' },
] as const;
type TimeHorizonId = typeof TIME_HORIZON_OPTIONS[number]['id'];

function timeHorizonContext(mode: FeedMode, horizonId: TimeHorizonId) {
  const horizon = TIME_HORIZON_OPTIONS.find((item) => item.id === horizonId) || TIME_HORIZON_OPTIONS[1];
  const modeContext = mode === 'future'
    ? 'FUTURE feed vector branch: prioritize scheduled future events, classes, programs, trips, bookings, and time-bound opportunities. Do not show generic immediate micro-actions unless they are preparation for a future event.'
    : 'NOW feed vector branch: prioritize things the user can begin or complete right now/today. Do NOT show scheduled future events, upcoming classes, trips, or time-bound opportunities — those belong in the Future tab only. Only show actions that are immediately actionable today.';
  return `${modeContext} Time availability: ${horizon.label}. ${horizon.context}`;
}


function screenText(card: ScreenResponse | null | undefined) {
  const spec: any = card?.screen || {};
  const parts: string[] = [];
  const metadata = spec.metadata || {};
  const cardData = spec.card_data || {};
  for (const val of [
    spec.type, spec.layout, spec.domain, cardData.title, cardData.body, cardData.url,
    metadata.source, metadata.feed_mode, metadata.temporal_branch, metadata.opportunity_kind,
    metadata.node_type, metadata.domain, metadata.city, metadata.location_city, metadata.url,
    ...(Array.isArray(metadata.tags) ? metadata.tags : []),
  ]) {
    if (val) parts.push(String(val));
  }
  for (const component of spec.components || []) {
    if (!component || typeof component !== 'object') continue;
    for (const key of ['text', 'title', 'body', 'description', 'label', 'caption', 'subtitle', 'value']) {
      if ((component as any)[key]) parts.push(String((component as any)[key]));
    }
    const items = (component as any).items || [];
    if (Array.isArray(items)) {
      for (const item of items) {
        if (!item || typeof item !== 'object') continue;
        for (const key of ['text', 'title', 'body', 'description', 'label', 'value', 'url']) {
          if ((item as any)[key]) parts.push(String((item as any)[key]));
        }
      }
    }
  }
  return parts.join(' ').toLowerCase();
}

function cityToken(value?: string | null) {
  return String(value || '').toLowerCase().split(',')[0].replace(/[^a-z0-9]+/g, ' ').trim();
}

function cardCity(card: ScreenResponse | null | undefined) {
  const metadata: any = card?.screen?.metadata || {};
  return metadata.city || metadata.location_city || metadata.venue_city || '';
}

function isNonLocalCard(card: ScreenResponse | null | undefined, preferredCity?: string | null) {
  const preferred = cityToken(preferredCity);
  const city = cityToken(cardCity(card));
  if (!preferred || !city) return false;
  return preferred !== city && !preferred.includes(city) && !city.includes(preferred);
}

function isScheduledOpportunityCard(card: ScreenResponse | null | undefined) {
  const metadata: any = card?.screen?.metadata || {};
  if (metadata.starts_at || metadata.event_starts_at) return true;
  if (metadata.feed_mode === 'future' || metadata.temporal_branch === 'future_event') return true;
  const text = screenText(card);
  const markers = [
    'event', 'events', 'workshop', 'workshops', 'class', 'classes', 'retreat', 'festival', 'concert',
    'ticket', 'tickets', 'rsvp', 'register', 'registration', 'booking', 'book / register', 'reserve',
    'reservation', 'calendar', 'conference', 'venue', 'starts at', 'start time', 'doors open',
    'this weekend', 'this week', 'next week', 'next month', 'tomorrow',
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
  ];
  return markers.some((marker) => text.includes(marker));
}

function enforceFeedMode(cards: ScreenResponse[], mode: FeedMode, preferredCity?: string | null) {
  if (mode === 'future') return cards;
  return cards.filter((card) => !isScheduledOpportunityCard(card) && !isNonLocalCard(card, preferredCity));
}

function fallbackDeepDive(card: any, spec: any, domain: string) {
  const title = card?.title || 'this next step';
  const body = card?.body || '';
  const source = spec?.metadata?.source || '';
  const isFallback = source === 'static_fallback';
  return {
    time_to_start: spec?.metadata?.requires_time_hours ? `~${spec.metadata.requires_time_hours}h` : isFallback ? '2–10 minutes' : 'Start small',
    difficulty: 'easy',
    why_it_matters: body
      ? `This is a ${domain || 'life'} action, not just content. Aura is testing whether this kind of step fits your current capacity and direction: ${body}`
      : `Aura is testing whether ${title} fits your current capacity and direction.`,
    stat: 'Your response teaches Aura what to recommend, what to avoid, and what bridge steps you may need first.',
    steps: [
      'Check whether your current time, energy, location, and resources make this realistic.',
      'Choose the smallest version that can be done today.',
      'Tap Do now when you want Aura to turn it into a concrete pathway.',
    ],
    resources: [],
  };
}

function getCardImage(spec: any, card: any, domain: string) {
  const hero = (spec?.components || []).find((c: any) => c?.type === 'hero_image' && c?.source);
  return card?.image_url || spec?.metadata?.image_url || hero?.source || DOMAIN_IMAGE_FALLBACK[domain] || DOMAIN_IMAGE_FALLBACK.default;
}

function componentText(comp: any) {
  return comp?.text || comp?.body || comp?.label || comp?.title || '';
}

function importantChips(spec: any) {
  const chips: { label: string; value: string }[] = [];
  for (const comp of spec?.components || []) {
    if (comp?.type === 'context_strip') {
      for (const item of comp.items || []) {
        const label = String(item?.label || '').trim();
        const value = String(item?.value || '').trim();
        if (!value) continue;
        if (/^(city|when|where|price|time|money|difficulty|mode|domain)$/i.test(label)) chips.push({ label, value });
      }
    }
    if (comp?.type === 'constraint_panel') {
      for (const item of (comp.items || []).slice(0, 2)) {
        const label = String(item?.label || item || '').trim();
        if (/price|cost|fee|ticket|where|when|transport|booking/i.test(label)) chips.push({ label: 'Need', value: label.replace(/^(Price|Where|When):\s*/i, '') });
      }
    }
  }
  return chips.slice(0, 5);
}

function reviewSummary(spec: any) {
  const review = (spec?.components || []).find((c: any) => c?.type === 'review_rating');
  if (!review) return null;
  const rating = typeof review.rating === 'number' ? Math.max(0, Math.min(5, review.rating)) : null;
  return {
    rating,
    label: rating == null ? 'Review rating needed' : `${rating.toFixed(1)} / 5`,
    stars: rating == null ? '☆☆☆☆☆' : `${'★'.repeat(Math.round(rating))}${'☆'.repeat(5 - Math.round(rating))}`,
    reviewCount: review.review_count,
  };
}

function detailComponents(spec: any) {
  const hiddenOnSheet = new Set(['hero_image', 'headline', 'body', 'body_text', 'category_badge', 'type_badge', 'pattern_badge', 'meta', 'domain_badge']);
  return (spec?.components || []).filter((comp: any) => comp && !hiddenOnSheet.has(comp.type));
}

// ─── Confetti burst ───────────────────────────────────────────────────────────
function ConfettiBurst({ active }: { active: boolean }) {
  if (!active) return null;
  const pieces = Array.from({ length: 16 }, (_, i) => ({
    id: i,
    color: ['#00d4aa', '#6366f1', '#f59e0b', '#ec4899', '#10b981'][i % 5],
    x: 30 + Math.random() * 40,
    delay: Math.random() * 0.3,
    size: 6 + Math.random() * 6,
  }));
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 200, overflow: 'hidden' }}>
      {pieces.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: '30%',
            width: p.size,
            height: p.size,
            borderRadius: 2,
            background: p.color,
            animation: `confettiFall 1s ease-in ${p.delay}s forwards`,
          }}
        />
      ))}
    </div>
  );
}

function capabilityGoalToken(goalId?: string | null) {
  return goalId ? `goal_${goalId}` : 'global';
}

function todayCapabilityKey(goalId?: string | null) {
  return `ido_capability_pulse_${CAPABILITY_PULSE_VERSION}_${new Date().toISOString().slice(0, 10)}_${capabilityGoalToken(goalId)}`;
}
// Session key — cleared on window refresh, persists across tab switches, context-aware
function sessionCapabilityKey(goalId?: string | null) {
  return `ido_capability_pulse_session_${CAPABILITY_PULSE_VERSION}_${capabilityGoalToken(goalId)}`;
}

function CapabilityIntake({ goalTitle, goalId, onComplete }: { goalTitle?: string | null; goalId?: string; onComplete: (answers: Record<string, string[]>) => void }) {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);
  const card = CAPABILITY_CARDS[step];
  const chosen = selected[card.id] || [];
  const title = goalTitle && card.goalTitle ? card.goalTitle.replace('{goal}', goalTitle) : card.title;

  const choose = async (option: string) => {
    const nextChosen = card.multi
      ? (chosen.includes(option) ? chosen.filter((x) => x !== option) : [...chosen, option])
      : [option];
    setSelected((prev) => ({ ...prev, [card.id]: nextChosen }));
    if (!card.multi) await advance(nextChosen);
  };

  const advance = async (answer = chosen) => {
    if (!answer.length) return;
    setSaving(true);
    const nextSelected = { ...selected, [card.id]: answer };
    AuraClient['client'].post('/api/gamification/checkin', { reason: 'capability_pulse', ref_id: card.id }).catch(() => {});
    if (step >= CAPABILITY_CARDS.length - 1) {
      const answers = Object.fromEntries(
        CAPABILITY_CARDS.map((c) => [c.field, (nextSelected[c.id] || [])]).filter(([, value]) => Array.isArray(value) && value.length)
      );
      try {
        await AuraClient.submitNowCheckin({ answers, goal_id: goalId, feed_mode: 'now' });
      } catch {
        await Promise.allSettled(CAPABILITY_CARDS.map((c) => {
          const value = nextSelected[c.id];
          if (!value?.length) return Promise.resolve();
          return AuraClient.submitDiscoveryAnswer({
            question_id: `feed_capability_${c.id}`,
            profile_field: c.field,
            answer: value.length === 1 ? value[0] : value,
            goal_id: goalId,
          });
        }));
      }
      localStorage.setItem(todayCapabilityKey(goalId), JSON.stringify({ completed_at: new Date().toISOString(), goal_id: goalId || null, answers: nextSelected }));
      sessionStorage.setItem(sessionCapabilityKey(goalId), '1');
      onComplete(nextSelected);
      setSaving(false);
    } else {
      setTimeout(() => { setStep((s) => s + 1); setSaving(false); }, 120);
    }
  };

  return (
    <div style={{ minHeight: '100%', background: 'radial-gradient(circle at top, rgba(0,212,170,0.16), #0a0a0f 58%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 22 }}>
      <div style={{ width: '100%', maxWidth: 460, background: 'rgba(18,18,30,0.88)', border: '1px solid rgba(0,212,170,0.22)', borderRadius: 28, padding: 22, boxShadow: '0 24px 80px rgba(0,0,0,0.45)' }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: '#00d4aa', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>{card.eyebrow} · {step + 1}/{CAPABILITY_CARDS.length}</div>
        <h1 style={{ margin: 0, fontSize: 26, lineHeight: 1.12, color: '#f8f8fc', letterSpacing: -0.8 }}>{title}</h1>
        <p style={{ margin: '12px 0 20px', color: 'rgba(248,248,252,0.58)', fontSize: 15, lineHeight: 1.6 }}>{card.body}</p>
        <div style={{ display: 'grid', gap: 10 }}>
          {card.options.map((option) => {
            const active = chosen.includes(option);
            return (
              <button key={option} onClick={() => choose(option)} style={{
                width: '100%', textAlign: 'left', padding: '14px 16px', borderRadius: 18,
                background: active ? 'rgba(0,212,170,0.18)' : 'rgba(255,255,255,0.045)',
                border: active ? '1px solid rgba(0,212,170,0.55)' : '1px solid rgba(255,255,255,0.08)',
                color: active ? '#bfffee' : '#f8f8fc', fontWeight: 750, fontSize: 15,
              }}>
                {active ? '✓ ' : ''}{option}
              </button>
            );
          })}
        </div>
        {card.multi && (
          <button disabled={!chosen.length || saving} onClick={() => advance()} style={{ marginTop: 16, width: '100%', padding: '14px 18px', borderRadius: 18, border: 'none', background: chosen.length ? 'linear-gradient(135deg,#00d4aa,#14f1c1)' : 'rgba(255,255,255,0.08)', color: chosen.length ? '#06110f' : 'rgba(248,248,252,0.35)', fontWeight: 900 }}>
            Continue →
          </button>
        )}
        <div style={{ marginTop: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ color: 'rgba(248,248,252,0.34)', fontSize: 12, lineHeight: 1.55 }}>
            Aura will refresh Now around your goals, values, energy, constraints, and resources.
          </div>
          <button onClick={() => { sessionStorage.setItem(sessionCapabilityKey(goalId), '1'); onComplete(selected); }} style={{ background: 'transparent', border: 'none', color: 'rgba(248,248,252,0.3)', fontSize: 12, cursor: 'pointer', flexShrink: 0, marginLeft: 12 }}>
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Detail sheet ─────────────────────────────────────────────────────────────
function DetailSheet({ card, spec, color, onClose, onDoNow, onInvite, onAction }: { card: any; spec: any; color: string; onClose: () => void; onDoNow: () => void; onInvite: () => void; onAction: (action: any) => void }) {
  const deepDive = card?.deep_dive || null;
  const title = card?.title || card?.text || '';
  const body = card?.body || card?.body_text || '';
  const extraComponents = detailComponents(spec);
  const touchStartY = useRef<number | null>(null);
  const touchDeltaY = useRef(0);

  const difficultyColor = (d: string) =>
    d === 'easy' ? '#10b981' : d === 'medium' ? '#f59e0b' : '#ef4444';

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(10px)',
        display: 'flex', alignItems: 'flex-end',
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => { touchStartY.current = e.touches[0]?.clientY ?? null; touchDeltaY.current = 0; }}
        onTouchMove={(e) => {
          if (touchStartY.current == null) return;
          touchDeltaY.current = (e.touches[0]?.clientY ?? touchStartY.current) - touchStartY.current;
        }}
        onTouchEnd={() => {
          if (touchDeltaY.current > 90) onClose();
          touchStartY.current = null;
          touchDeltaY.current = 0;
        }}
        style={{
          width: '100%',
          height: 'min(86dvh, calc(var(--visual-viewport-height, 100dvh) - var(--shell-top-clearance) - 18px))',
          maxHeight: 'min(86dvh, calc(var(--visual-viewport-height, 100dvh) - var(--shell-top-clearance) - 18px))',
          background: '#12121e',
          borderRadius: '28px 28px 0 0',
          border: `1px solid ${color}22`,
          borderBottom: 'none',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideUpSheet 0.32s cubic-bezier(.25,.8,.25,1)',
        }}
      >
        {/* Color accent bar */}
        <div style={{ height: 3, background: `linear-gradient(90deg, ${color}, ${color}55, transparent)`, borderRadius: '28px 28px 0 0' }} />

        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)' }} />
        </div>

        <div style={{ padding: '8px 24px 28px', flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 22, lineHeight: 1.25, marginBottom: 12, color: '#f8f8fc' }}>{title}</div>

          {body && (
            <div style={{ fontSize: 15, color: 'rgba(248,248,252,0.6)', lineHeight: 1.75, marginBottom: 24 }}>{body}</div>
          )}

          {deepDive ? (
            <>
              <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
                {deepDive.time_to_start && (
                  <span style={{ background: color + '15', border: `1px solid ${color}33`, color, fontSize: 12, fontWeight: 600, padding: '5px 14px', borderRadius: 20 }}>
                    ⏱ {deepDive.time_to_start}
                  </span>
                )}
                {deepDive.difficulty && (
                  <span style={{ background: difficultyColor(deepDive.difficulty) + '15', border: `1px solid ${difficultyColor(deepDive.difficulty)}33`, color: difficultyColor(deepDive.difficulty), fontSize: 12, fontWeight: 600, padding: '5px 14px', borderRadius: 20 }}>
                    {deepDive.difficulty === 'easy' ? '✓ Easy start' : deepDive.difficulty === 'medium' ? '◎ Medium effort' : '⚡ Challenging'}
                  </span>
                )}
              </div>

              {deepDive.why_it_matters && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color, marginBottom: 8, textTransform: 'uppercase' }}>Why it matters</div>
                  <div style={{ fontSize: 15, color: 'rgba(248,248,252,0.7)', lineHeight: 1.75 }}>{deepDive.why_it_matters}</div>
                </div>
              )}

              {deepDive.stat && (
                <div style={{ background: color + '0e', border: `1px solid ${color}22`, borderRadius: 16, padding: '16px 20px', marginBottom: 24 }}>
                  <div style={{ fontSize: 14, color, fontWeight: 700, lineHeight: 1.5 }}>📊 {deepDive.stat}</div>
                </div>
              )}

              {deepDive.steps?.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color, marginBottom: 12, textTransform: 'uppercase' }}>How to start</div>
                  {deepDive.steps.map((step: string, i: number) => (
                    <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 14 }}>
                      <div style={{ width: 26, height: 26, borderRadius: 13, background: color + '20', border: `1px solid ${color}44`, color, fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
                      <div style={{ fontSize: 14, color: 'rgba(248,248,252,0.75)', lineHeight: 1.6 }}>{step}</div>
                    </div>
                  ))}
                </div>
              )}

              {deepDive.resources?.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color, marginBottom: 12, textTransform: 'uppercase' }}>Explore more</div>
                  {deepDive.resources.map((r: any, i: number) => (
                    <a key={i} href={r.url} target="_blank" rel="noopener noreferrer" style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '14px 16px', marginBottom: 8,
                      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 14, textDecoration: 'none', transition: 'background 0.15s',
                    }}>
                      <span style={{ fontSize: 22 }}>{{ article: '📄', book: '📚', app: '📱', video: '🎬', tool: '🔧' }[r.type as string] || '🔗'}</span>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#f8f8fc' }}>{r.label}</div>
                        <div style={{ fontSize: 11, color, marginTop: 2 }}>{r.type}</div>
                      </div>
                      <div style={{ marginLeft: 'auto', color: 'rgba(248,248,252,0.3)', fontSize: 18 }}>›</div>
                    </a>
                  ))}
                </div>
              )}

              {extraComponents.length > 0 && (
                <div style={{ marginTop: 6 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color, marginBottom: 12, textTransform: 'uppercase' }}>Details, links, and opportunities</div>
                  {extraComponents.map((comp: any, i: number) => <AuraCard key={i} component={comp} index={i} onAction={onAction} />)}
                </div>
              )}
            </>
          ) : (
            <div style={{ fontSize: 13, color: 'rgba(248,248,252,0.25)', textAlign: 'center', padding: '20px 0' }}>Tap to explore deeper…</div>
          )}
        </div>

        <div style={{
          position: 'sticky',
          bottom: 0,
          zIndex: 4,
          padding: '14px 20px calc(16px + env(safe-area-inset-bottom, 0px))',
          background: 'linear-gradient(180deg, rgba(18,18,30,0), rgba(18,18,30,0.96) 22%, #12121e 100%)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10 }}>
            <button
              onClick={onDoNow}
              style={{
                width: '100%',
                minHeight: 54,
                borderRadius: 999,
                border: 'none',
                background: `linear-gradient(135deg, ${color}, ${color}cc)`,
                color: '#06070a',
                fontSize: 16,
                fontWeight: 900,
                letterSpacing: -0.2,
                boxShadow: `0 18px 44px ${color}35`,
              }}
            >
              Do now →
            </button>
            <button
              onClick={onInvite}
              aria-label="Invite friends"
              style={{
                width: 58,
                minHeight: 54,
                borderRadius: 999,
                border: '1px solid rgba(255,255,255,0.16)',
                background: 'rgba(255,255,255,0.06)',
                color: '#f8f8fc',
                fontSize: 22,
                fontWeight: 900,
              }}
            >
              ↗
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideUpSheet {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function isSystemManagedPathStep(step: any) {
  const text = [step?.owner, step?.type, step?.title || step, step?.description]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return text.includes('map prerequisite')
    || text.includes('bridge node')
    || text.includes('research options')
    || text.includes('find real options')
    || text.includes('search for')
    || text.includes('gather options')
    || text.includes('generate')
    || text.includes('rank')
    || text.includes('aura should')
    || text.includes('ora should');
}

function PathwaySheet({ data, onClose, onInvite }: { data: any; onClose: () => void; onInvite: () => void }) {
  const card = data?.card || {};
  const item = data?.item as ScreenResponse | undefined;
  const metadata: any = item?.screen?.metadata || {};
  const [availableTime, setAvailableTime] = useState<TimeHorizonId>('30m');
  const protocol = data?.execution?.protocol || null;
  const plan = protocol?.execution_plan || null;
  const microNode = plan?.micro_node || null;
  const decisionLevels = plan?.decision_levels || [];
  const questions = protocol?.clarifying_questions || [];
  const fallbackSteps = card?.deep_dive?.steps || [
    'Clarify any missing preference, constraint, timing, or budget.',
    'Choose from Aura’s best concrete options.',
    'Do the real-world action, or schedule it for a real time.',
  ];
  const rawSteps = plan?.steps?.length ? plan.steps : fallbackSteps.map((s: string) => ({ title: s, description: '' }));
  const systemManagedSteps = rawSteps.filter(isSystemManagedPathStep);
  const userSteps = rawSteps.filter((step: any) => !isSystemManagedPathStep(step));
  const steps = userSteps.length ? userSteps : fallbackSteps.map((s: string) => ({ title: s, description: '' }));
  const links = Array.isArray(metadata.links) ? metadata.links : [];
  const primaryUrl = card?.url || metadata.url || links.find((link: any) => link?.url)?.url;
  const bookingUrl = links.find((link: any) => /book|register|ticket/i.test(String(link?.label || link?.kind || '')))?.url || metadata.booking_url;
  const mapUrl = links.find((link: any) => /map|direction/i.test(String(link?.label || link?.kind || '')))?.url || metadata.map_url;
  const requirements = [
    metadata.starts_at ? `Timing: ${metadata.starts_at}` : null,
    metadata.location_city || metadata.city ? `Location: ${metadata.location_city || metadata.city}` : null,
    metadata.opportunity_kind ? `Mode: ${metadata.opportunity_kind}` : null,
    card?.deep_dive?.time_to_start ? `Time: ${card.deep_dive.time_to_start}` : null,
  ].filter(Boolean);
  const askAura = () => {
    window.dispatchEvent(new CustomEvent('connectome:open-aura'));
    AuraClient.submitFeedback({
      screen_spec_id: item?.screen_spec_db_id || '',
      rating: 5,
      exit_point: 'execute_ask_aura',
      completed: false,
      metadata: { learning_signal: 'execute_clarification_requested', title: card.title, feed_mode: metadata.feed_mode, temporal_branch: metadata.temporal_branch },
    }).catch(() => {});
  };
  const remember = async () => {
    const text = `Reminder: ${card.title || 'Connectome action'}${metadata.starts_at ? ` (${metadata.starts_at})` : ''}`;
    try { await navigator.clipboard.writeText(text); } catch {}
    AuraClient.submitFeedback({
      screen_spec_id: item?.screen_spec_db_id || '',
      rating: 5,
      exit_point: 'execute_create_reminder_intent',
      completed: false,
      metadata: { learning_signal: 'reminder_intent', reminder_text: text },
    }).catch(() => {});
  };
  const openUrl = (url?: string, exitPoint = 'execute_open_link') => {
    if (!url) return;
    window.open(url, '_blank', 'noopener');
    AuraClient.submitFeedback({
      screen_spec_id: item?.screen_spec_db_id || '',
      rating: 5,
      exit_point: exitPoint,
      completed: false,
      metadata: { learning_signal: 'execute_safe_action', url, feed_mode: metadata.feed_mode, temporal_branch: metadata.temporal_branch },
    }).catch(() => {});
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 260,
        background: 'rgba(0,0,0,0.72)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'flex-end',
        paddingBottom: 'var(--shell-bottom-clearance)',
      }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxHeight: 'calc(100dvh - var(--shell-top-clearance) - var(--shell-bottom-clearance) - 18px)', overflowY: 'auto', background: '#11111c', borderRadius: '28px 28px 0 0', border: '1px solid rgba(0,212,170,0.22)', padding: '18px 22px 34px' }}>
        <div style={{ width: 44, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.16)', margin: '0 auto 18px' }} />
        <div style={{ color: '#00d4aa', fontSize: 12, fontWeight: 900, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>iDo Execute</div>
        <h2 style={{ margin: 0, color: '#f8f8fc', fontSize: 24, lineHeight: 1.15 }}>{card.title || 'Your next step'}</h2>
        <p style={{ color: 'rgba(248,248,252,0.58)', lineHeight: 1.65, fontSize: 14 }}>{protocol?.summary || 'Aura explains and clarifies; iDo turns the node into structured choices, safe actions, and the next real-world step.'}</p>

        <div style={{ display: 'grid', gap: 10, marginBottom: 16 }}>
          <div style={{ background: 'rgba(255,255,255,0.045)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: 14 }}>
            <div style={{ color: '#f8f8fc', fontSize: 13, fontWeight: 900, marginBottom: 8 }}>What this action requires</div>
            {requirements.length ? requirements.map((req: any) => <div key={req} style={{ color: 'rgba(248,248,252,0.66)', fontSize: 13, lineHeight: 1.55 }}>• {req}</div>) : <div style={{ color: 'rgba(248,248,252,0.48)', fontSize: 13 }}>A clear choice, a small commitment, and one next action.</div>}
          </div>
          {(primaryUrl || bookingUrl || mapUrl || links.length) && (
            <div style={{ background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.2)', borderRadius: 18, padding: 14 }}>
              <div style={{ color: '#00d4aa', fontSize: 13, fontWeight: 900, marginBottom: 10 }}>I found these options</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 8 }}>
                {primaryUrl && <button onClick={() => openUrl(primaryUrl, 'execute_open_primary')} style={{ border: '1px solid rgba(0,212,170,0.28)', background: 'rgba(0,212,170,0.12)', color: '#bfffee', borderRadius: 14, padding: 11, fontWeight: 900 }}>Open link</button>}
                {bookingUrl && <button onClick={() => openUrl(bookingUrl, 'execute_open_booking')} style={{ border: '1px solid rgba(245,158,11,0.28)', background: 'rgba(245,158,11,0.12)', color: '#facc15', borderRadius: 14, padding: 11, fontWeight: 900 }}>Register/book</button>}
                {mapUrl && <button onClick={() => openUrl(mapUrl, 'execute_get_directions')} style={{ border: '1px solid rgba(59,130,246,0.28)', background: 'rgba(59,130,246,0.12)', color: '#93c5fd', borderRadius: 14, padding: 11, fontWeight: 900 }}>Directions</button>}
                <button onClick={onInvite} style={{ border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.06)', color: '#f8f8fc', borderRadius: 14, padding: 11, fontWeight: 900 }}>Invite</button>
              </div>
            </div>
          )}
        </div>

        {systemManagedSteps.length > 0 && (
          <div style={{ background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.2)', borderRadius: 18, padding: 14, marginBottom: 14 }}>
            <div style={{ color: '#00d4aa', fontSize: 12, fontWeight: 850, marginBottom: 5 }}>Aura is handling in the background</div>
            <div style={{ color: 'rgba(248,248,252,0.56)', fontSize: 13, lineHeight: 1.5 }}>Research, prerequisite mapping, option gathering, ranking, and pathway routing stay out of your checklist.</div>
          </div>
        )}

        {questions.length > 0 && (
          <div style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.28)', borderRadius: 18, padding: 14, marginBottom: 18 }}>
            <div style={{ color: '#c4b5fd', fontSize: 12, fontWeight: 850, marginBottom: 8 }}>Needed before execution</div>
            {questions.map((q: string, i: number) => <div key={i} style={{ color: 'rgba(248,248,252,0.78)', fontSize: 14, lineHeight: 1.55 }}>• {q}</div>)}
          </div>
        )}

        <div style={{ background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.2)', borderRadius: 18, padding: 14, marginBottom: 18 }}>
          <div style={{ color: '#00d4aa', fontSize: 12, fontWeight: 850, marginBottom: 8 }}>How much time do you have for this now?</div>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
            {TIME_HORIZON_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                aria-pressed={availableTime === option.id}
                onClick={() => setAvailableTime(option.id)}
                style={{
                  border: availableTime === option.id ? '1px solid rgba(0,212,170,0.8)' : '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 999,
                  padding: '8px 11px',
                  background: availableTime === option.id ? 'linear-gradient(135deg,#00d4aa,#ffffff)' : 'rgba(255,255,255,0.055)',
                  color: availableTime === option.id ? '#06110f' : 'rgba(248,248,252,0.76)',
                  fontSize: 12,
                  fontWeight: 900,
                }}
              >{option.label}</button>
            ))}
          </div>
          <div style={{ color: 'rgba(248,248,252,0.52)', fontSize: 12, lineHeight: 1.5, marginTop: 9 }}>
            Aura should adapt the pathway after you decide to act — from a five-minute micro-node to total freedom.
          </div>
        </div>

        {(decisionLevels.length > 0 || microNode) && (
          <div style={{ background: 'rgba(255,255,255,0.045)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: 14, marginBottom: 18 }}>
            <div style={{ color: '#f8f8fc', fontSize: 13, fontWeight: 900, marginBottom: 8 }}>Mini-app path</div>
            {decisionLevels.length > 0 && (
              <div style={{ display: 'grid', gap: 8, marginBottom: microNode ? 12 : 0 }}>
                {decisionLevels.map((level: any, i: number) => (
                  <div key={level.level || i} style={{ color: 'rgba(248,248,252,0.64)', fontSize: 12, lineHeight: 1.45 }}>
                    <b style={{ color: '#00d4aa' }}>{level.label || `Decision ${i + 1}`}:</b> {level.description || ''}
                  </div>
                ))}
              </div>
            )}
            {microNode && (
              <div style={{ borderTop: decisionLevels.length ? '1px solid rgba(255,255,255,0.08)' : 'none', paddingTop: decisionLevels.length ? 10 : 0 }}>
                <div style={{ color: '#00d4aa', fontSize: 12, fontWeight: 850, marginBottom: 5 }}>Micro-node target</div>
                <div style={{ color: 'rgba(248,248,252,0.56)', fontSize: 12, lineHeight: 1.5 }}>{microNode.definition}</div>
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'grid', gap: 12 }}>
          {steps.map((step: any, i: number) => (
            <div key={i} style={{ display: 'flex', gap: 12, padding: 14, background: 'rgba(255,255,255,0.045)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18 }}>
              <div style={{ width: 28, height: 28, borderRadius: 14, background: 'rgba(0,212,170,0.16)', color: '#00d4aa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, flexShrink: 0 }}>{i + 1}</div>
              <div>
                <div style={{ color: '#f8f8fc', fontWeight: 850, fontSize: 14 }}>{step.title || step}</div>
                {step.description && <div style={{ color: 'rgba(248,248,252,0.52)', fontSize: 13, lineHeight: 1.55, marginTop: 4 }}>{step.description}</div>}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gap: 9, marginTop: 18 }}>
          <button onClick={askAura} style={{ width: '100%', border: '1px solid rgba(139,92,246,0.28)', borderRadius: 18, padding: '14px 18px', background: 'rgba(139,92,246,0.13)', color: '#ddd6fe', fontWeight: 950 }}>
            Ask Aura to clarify →
          </button>
          <button onClick={remember} style={{ width: '100%', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 18, padding: '13px 18px', background: 'rgba(255,255,255,0.055)', color: 'rgba(248,248,252,0.72)', fontWeight: 900 }}>
            Copy reminder text
          </button>
          <button onClick={onClose} style={{ width: '100%', border: 'none', borderRadius: 18, padding: '14px 18px', background: 'linear-gradient(135deg,#00d4aa,#14f1c1)', color: '#06110f', fontWeight: 950 }}>
            Keep going with iDo →
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Full-bleed FeedCard ─────────────────────────────────────────────────────
function FeedCard({
  item,
  active,
  onRate,
  onDoNow,
  onInvite,
  onSaveRequest,
  onSkip,
  onIntakeComplete,
  ratings,
  savedIds,
}: {
  item: ScreenResponse;
  active: boolean;
  onRate: (id: string, r: number) => void;
  onDoNow: (item: ScreenResponse, cardData: any) => void;
  onInvite: (item: ScreenResponse, cardData: any) => void;
  onSaveRequest: (card: any) => void;
  onSkip: () => void;
  onIntakeComplete: () => void;
  ratings: Record<string, number>;
  savedIds: Set<string>;
}) {
  // Inline capability intake card
  if ((item as any)._isIntakeCard) {
    const card = (item as any)._intakeCard;
    return (
      <CapabilityIntake
        goalTitle={(item as any)._goalTitle}
        goalId={(item as any)._goalId}
        onComplete={() => {
          sessionStorage.setItem(sessionCapabilityKey((item as any)._goalId), '1');
          onIntakeComplete();
        }}
      />
    );
  }

  const spec = item.screen;
  const navigate = useNavigate();
  const domainCfg = getDomainConfig(spec);
  const color = domainCfg.color;
  const domain = normalizeDomain(spec?.metadata?.domain || spec?.domain || '') || '';
  const currentRating = ratings[item.screen_spec_db_id] ?? 0;
  const [showDetail, setShowDetail] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const isSaved = savedIds.has(item.screen_spec_db_id);

  // Extract card data
  const specAny = spec as any;
  const cardData: any = { ...specAny.card_data || {} };
  if (!cardData.title) {
    for (const c of spec.components || []) {
      if ((c as any).type === 'headline') cardData.title = (c as any).text;
      if (['body', 'body_text'].includes((c as any).type) && !cardData.body) cardData.body = (c as any).text;
    }
  }
  if (!cardData.deep_dive) cardData.deep_dive = specAny.deep_dive || fallbackDeepDive(cardData, specAny, domain);
  const cardImage = getCardImage(specAny, cardData, domain);
  const chips = importantChips(spec);
  const review = reviewSummary(spec);
  const openCardAction = (action: any) => {
    if (action?.type === 'navigate' && action.url === '/app/goals') onDoNow(item, cardData);
    if (action?.type === 'open_url' && /^(ido|ioo):\/\//i.test(String(action.url || ''))) onDoNow(item, cardData);
    if (action?.type === 'open_url' && /^https?:\/\//i.test(String(action.url || ''))) window.open(action.url, '_blank', 'noopener');
  };

  const handleSave = () => {
    if (!isSaved) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 1200);
    }
    onSaveRequest({
      screen_spec_id: item.screen_spec_db_id,
      card_title: cardData.title,
      card_body: cardData.body,
      card_domain: domain,
      card_color: color,
    });
  };

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      background: '#0a0a0f',
      overflow: 'hidden',
    }}>
      {/* Full-bleed activity image + gradient — the Airbnb effect */}
      {cardImage && (
        <img
          src={cardImage}
          alt={cardData.title || domain || 'Connectome activity'}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.42, zIndex: 0 }}
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
        />
      )}
      <div style={{
        position: 'absolute', inset: 0,
        background: domainCfg.gradient,
        opacity: cardImage ? 0.74 : 0.6,
        zIndex: 1,
      }} />

      {/* Noise texture overlay for depth */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'0.08\'/%3E%3C/svg%3E")',
        opacity: 0.4,
        zIndex: 2,
        pointerEvents: 'none',
      }} />

      {/* Top gradient for text legibility */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 120,
        background: 'linear-gradient(rgba(10,10,15,0.8), transparent)',
        zIndex: 3, pointerEvents: 'none',
      }} />

      {/* Bottom gradient for actions legibility */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 200,
        background: 'linear-gradient(transparent, rgba(10,10,15,0.97))',
        zIndex: 3, pointerEvents: 'none',
      }} />

      {/* Confetti */}
      <ConfettiBurst active={showConfetti} />

      {/* Detail sheet */}
      {showDetail && (
        <DetailSheet
          card={cardData}
          spec={spec}
          color={color}
          onClose={() => setShowDetail(false)}
          onAction={openCardAction}
          onInvite={() => onInvite(item, cardData)}
          onDoNow={() => {
            setShowDetail(false);
            onDoNow(item, cardData);
          }}
        />
      )}

      {/* Primary card summary: only the essential activity/experience details. */}
      <button
        onClick={() => setShowDetail(true)}
        style={{
          position: 'absolute',
          zIndex: 5,
          left: 16,
          right: 86,
          top: 18,
          bottom: 96,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          gap: 10,
          textAlign: 'left',
          background: 'transparent',
          border: 'none',
          padding: 0,
          color: '#f8f8fc',
          cursor: 'pointer',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {domain && <span style={{ background: 'rgba(0,0,0,0.38)', backdropFilter: 'blur(8px)', border: `1px solid ${color}55`, color, fontSize: 12, fontWeight: 800, letterSpacing: 0.4, padding: '5px 11px', borderRadius: 999 }}>{domainCfg.emoji} {domain}</span>}
          {spec.type && spec.type !== 'standard' && <span style={{ background: 'rgba(0,0,0,0.30)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(248,248,252,0.55)', fontSize: 10, fontWeight: 800, letterSpacing: 0.8, textTransform: 'uppercase', padding: '5px 10px', borderRadius: 999 }}>{spec.type.replace(/_/g, ' ')}</span>}
        </div>

        {cardData.title && <h2 style={{ margin: 0, maxWidth: 620, fontSize: 'clamp(27px, 6vw, 46px)', fontWeight: 950, lineHeight: 1.02, letterSpacing: -1.4, textShadow: '0 3px 18px rgba(0,0,0,0.74)' }}>{cardData.title}</h2>}
        {cardData.body && <p style={{ margin: 0, maxWidth: 620, color: 'rgba(248,248,252,0.78)', fontSize: 'clamp(14px, 2.8vw, 17px)', lineHeight: 1.48, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' as any, overflow: 'hidden', textShadow: '0 2px 12px rgba(0,0,0,0.72)' }}>{cardData.body}</p>}

        {chips.length > 0 && (
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', maxHeight: 84, overflow: 'hidden' }}>
            {chips.map((chip, i) => <span key={`${chip.label}-${i}`} style={{ background: 'rgba(0,0,0,0.38)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', borderRadius: 14, padding: '7px 9px', color: '#f8f8fc', fontSize: 12, fontWeight: 800 }}><span style={{ color: 'rgba(248,248,252,0.42)', textTransform: 'uppercase', fontSize: 9, marginRight: 5 }}>{chip.label}</span>{chip.value}</span>)}
          </div>
        )}

        {review && <div style={{ display: 'inline-flex', width: 'fit-content', gap: 7, alignItems: 'center', background: 'rgba(0,0,0,0.42)', border: '1px solid rgba(244,194,107,0.28)', color: '#f4c26b', borderRadius: 999, padding: '7px 11px', fontSize: 12, fontWeight: 900 }}><span>{review.stars}</span><span>{review.label}</span>{review.reviewCount && <span style={{ color: 'rgba(248,248,252,0.48)' }}>({review.reviewCount})</span>}</div>}

        <div style={{ display: 'inline-flex', width: 'fit-content', alignItems: 'center', gap: 7, background: 'rgba(0,0,0,0.42)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 999, padding: '8px 13px', color: 'rgba(248,248,252,0.66)', fontSize: 12, fontWeight: 800 }}>
          <span>↑</span> Details, links, and how to do it
        </div>
      </button>

      {/* Right-side action buttons (TikTok-style) */}
      <div style={{
        position: 'absolute',
        right: 14, bottom: 112,
        display: 'flex', flexDirection: 'column',
        gap: 10, alignItems: 'center',
        zIndex: 10,
      }}>
        {/* Rating stars — simplified to heart+fire for visual clarity */}
        <button
          onClick={() => onDoNow(item, cardData)}
          style={{
            width: 48, height: 48, borderRadius: 24,
            background: currentRating >= 4
              ? `${color}28`
              : 'rgba(0,0,0,0.45)',
            border: `1.5px solid ${currentRating >= 4 ? color : 'rgba(255,255,255,0.2)'}`,
            backdropFilter: 'blur(12px)',
            color: currentRating >= 4 ? color : 'rgba(248,248,252,0.5)',
            fontSize: 22,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s',
            transform: currentRating >= 4 ? 'scale(1.1)' : 'scale(1)',
          }}
        >
          {currentRating >= 4 ? '♥' : '♡'}
        </button>
        <div style={{ fontSize: 10, color: 'rgba(248,248,252,0.3)', fontWeight: 600 }}>
          {currentRating >= 4 ? 'Doing' : 'Do now'}
        </div>

        {/* Quick star rating */}
        {[3, 5].map((star) => (
          <button
            key={star}
            onClick={() => onRate(item.screen_spec_db_id, star)}
            style={{
              width: 36, height: 36, borderRadius: 18,
              background: currentRating >= star ? color + '22' : 'rgba(0,0,0,0.4)',
              border: `1.5px solid ${currentRating >= star ? color + '66' : 'rgba(255,255,255,0.12)'}`,
              color: currentRating >= star ? color : 'rgba(248,248,252,0.3)',
              fontSize: 14, backdropFilter: 'blur(12px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.1s',
            }}
          >★</button>
        ))}

        <div style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.1)' }} />

        {/* Invite friends */}
        <button
          onClick={() => onInvite(item, cardData)}
          style={{
            width: 48, height: 48, borderRadius: 24,
            background: 'rgba(0,0,0,0.45)',
            border: '1.5px solid rgba(255,255,255,0.2)',
            color: 'rgba(248,248,252,0.68)',
            fontSize: 21, backdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s',
          }}
          aria-label="Invite friends"
        >↗</button>
        <div style={{ fontSize: 10, color: 'rgba(248,248,252,0.3)', fontWeight: 600 }}>
          Invite
        </div>

        {/* Save to collection */}
        <button
          onClick={() => {
            // TODO(IOO): treat "Do later" as an explicit resurface/scheduling
            // signal, not only a collection save.
            handleSave();
          }}
          className={isSaved ? 'save-flash' : ''}
          style={{
            width: 48, height: 48, borderRadius: 24,
            background: isSaved ? color + '30' : 'rgba(0,0,0,0.45)',
            border: `1.5px solid ${isSaved ? color : 'rgba(255,255,255,0.2)'}`,
            color: isSaved ? color : 'rgba(248,248,252,0.6)',
            fontSize: 22, backdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s',
          }}
        >
          {isSaved ? '✦' : '✧'}
        </button>
        <div style={{ fontSize: 10, color: isSaved ? color : 'rgba(248,248,252,0.3)', fontWeight: 600 }}>
          {isSaved ? 'Later' : 'Do later'}
        </div>

        {/* Skip */}
        <button
          onClick={() => {
            // TODO(IOO): "not interested" should down-rank/refine similar IOO
            // graph nodes rather than simply advancing the feed.
            onSkip();
          }}
          style={{
            width: 44, height: 44, borderRadius: 22,
            background: 'rgba(0,0,0,0.4)',
            border: '1.5px solid rgba(255,255,255,0.12)',
            color: 'rgba(248,248,252,0.35)', fontSize: 18,
            backdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >✕</button>
        <div style={{ fontSize: 10, color: 'rgba(248,248,252,0.3)', fontWeight: 600 }}>
          Not interested
        </div>
      </div>

      {/* Swipe hint */}
      {active && (
        <div style={{
          position: 'absolute', bottom: 4, left: 0, right: 0,
          textAlign: 'center', fontSize: 10,
          color: 'rgba(248,248,252,0.18)', letterSpacing: 0.5,
          zIndex: 3, pointerEvents: 'none',
        }}>
          swipe up · next
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes confettiFall {
          0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(60vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function _buildIntakeCard(goalTitle?: string | null, goalId?: string): any | null {
  // Build a synthetic ScreenResponse for the first capability question.
  // This appears as card[0] in the Now feed — never blocks the feed.
  const card = CAPABILITY_CARDS[0];
  if (!card) return null;
  return {
    screen_spec_db_id: `intake_${card.id}`,
    screens_today: 0,
    daily_limit: 10,
    is_limited: false,
    _isIntakeCard: true,
    _intakeCard: card,
    _goalTitle: goalTitle || null,
    _goalId: goalId || undefined,
    screen: {
      screen_id: `intake_${card.id}`,
      type: 'intake',
      layout: 'scroll',
      components: [{ type: 'headline', text: card.title }, { type: 'body', text: card.body }],
      metadata: { agent: 'CapabilityIntake', domain: null, goal_id: goalId || null, goal_title: goalTitle || null },
    },
  };
}

// ─── Main feed ────────────────────────────────────────────────────────────────
export default function FeedPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  React.useEffect(() => {
    if (!localStorage.getItem('connectome_token')) {
      navigate('/auth?redirect=/app/ido', { replace: true });
    }
  }, [navigate]);

  const { variant: goalBannerVariant } = useExperiment('feed_goal_banner');
  const { variant: emptyStateVariant, trackEvent: trackEmptyState } = useExperiment('feed_empty_state');

  const goalId = searchParams.get('goal') || undefined;
  const requestedMode: FeedMode = location.pathname === '/app/future' ? 'future' : 'now';
  const savedTimeHorizon = (searchParams.get('time') || '30m') as TimeHorizonId;
  const initialTimeHorizon = TIME_HORIZON_OPTIONS.some((item) => item.id === savedTimeHorizon) ? savedTimeHorizon : '30m';
  const [goalTitle, setGoalTitle] = useState<string | null>(null);

  const [cards, setCards] = useState<ScreenResponse[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [isLimited, setIsLimited] = useState(false);
  const [dailyLimit, setDailyLimit] = useState(10);
  const [hasGoals, setHasGoals] = useState<boolean | null>(null);
  const [toastMsg, setToastMsg] = useState('');
  const [collectionPickerCard, setCollectionPickerCard] = useState<any | null>(null);
  const isFutureFeed = requestedMode === 'future';
  // Capability intake never blocks the feed — it shows as the first card inline.
  // Always start ready so the feed loads immediately.
  const [capabilityReady] = useState(true);
  const [pathwaySheet, setPathwaySheet] = useState<any | null>(null);
  const [feedMode, setFeedMode] = useState<FeedMode>(requestedMode);
  const [timeHorizon, setTimeHorizon] = useState<TimeHorizonId>(initialTimeHorizon);
  const { profile } = useAuth();
  const preferredCity = profile?.city || profile?.location_city || profile?.profile?.city || profile?.profile?.location_city || localStorage.getItem('connectome_live_location_city') || localStorage.getItem('aura_live_location_city');

  const touchStartY = useRef<number | null>(null);
  const touchStartX = useRef<number | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2500);
  };

  useEffect(() => {
    setFeedMode(requestedMode);
  }, [requestedMode]);


  useEffect(() => {
    const requestedTime = searchParams.get('time') as TimeHorizonId | null;
    if (requestedTime && TIME_HORIZON_OPTIONS.some((item) => item.id === requestedTime)) {
      setTimeHorizon(requestedTime);
      setCards([]);
      setIndex(0);
    }
  }, [searchParams]);

  const feedContext = `${timeHorizonContext(feedMode, timeHorizon)} ${goalId ? 'GOAL-SPECIFIC feed: optimize recommendations for the selected goal only.' : 'GENERAL NOW feed: diversify node recommendations across all active goals plus value-aligned possibilities the user has not explicitly stated as goals. Do not imply the whole Now feed is only completing one goal.'}`;

  const updateTimeHorizon = (value: TimeHorizonId) => {
    setTimeHorizon(value);
    setCards([]);
    setIndex(0);
  };

  // Fetch goal title
  useEffect(() => {
    if (!goalId) return;
    AuraClient.listGoals()
      .then((goals) => {
        const found = goals.find((g: any) => g.id === goalId);
        if (found) setGoalTitle(found.title);
      })
      .catch(() => {});
  }, [goalId]);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const goals = await AuraClient.listGoals().catch(() => []);
      setHasGoals(goals.length > 0);
      const focusedGoal = goalId ? goals.find((g: any) => g.id === goalId) : null;
      if (focusedGoal?.title) setGoalTitle(focusedGoal.title);
      else if (!goalId) setGoalTitle(null);
      const focusedGoalId = goalId ? focusedGoal?.id : undefined;
      const batch = await AuraClient.getNextScreenBatch(5, focusedGoalId, undefined, feedContext, feedMode);
      let nextCards = enforceFeedMode(batch, feedMode, preferredCity);
      if (!nextCards.length) {
        const single = await AuraClient.getNextScreen(feedContext, focusedGoalId, undefined, feedMode).catch(() => null);
        nextCards = enforceFeedMode(single ? [single] : [], feedMode, preferredCity);
      }
      // Prepend context intake card for Now feed if not answered this session.
      // The default Now feed is general; only a selected goal route passes goal context.
      if (!isFutureFeed && !sessionStorage.getItem(sessionCapabilityKey(focusedGoalId)) && !localStorage.getItem(todayCapabilityKey(focusedGoalId))) {
        const intakeCard = _buildIntakeCard(focusedGoal?.title || goalTitle, focusedGoalId);
        if (intakeCard) nextCards = [intakeCard, ...nextCards];
      }
      setCards(nextCards);
      setIndex(0);
      if (nextCards.length > 0) {
        setIsLimited(nextCards[nextCards.length - 1].is_limited);
        setDailyLimit(nextCards[nextCards.length - 1].daily_limit);
      } else {
        setError('Aura could not prepare cards yet. Try again in a moment.');
      }
      // Send backend progress signal.
      AuraClient['client'].post('/api/gamification/checkin', { reason: 'card_view' }).catch(() => {});
    } catch (e: any) {
      if (e?.response?.status === 402) {
        setIsLimited(true);
        setError('You have explored today’s cards. We are opening the feed again now — tap retry.');
      } else setError(e?.response?.data?.detail || 'Failed to load feed');
    } finally {
      setLoading(false);
    }
  }, [goalId, feedContext, feedMode, preferredCity]);

  useEffect(() => {
    if (capabilityReady) loadInitial();
  }, [capabilityReady, loadInitial]);

  const handleIntakeComplete = useCallback(() => {
    showToast('Aura updated your Now vector. Refreshing cards…');
    setCards([]);
    setIndex(0);
    setTimeout(() => { loadInitial(); }, 250);
  }, [loadInitial]);

  useEffect(() => {
    const active = cards[index];
    if (!active) return;
    try {
      const spec: any = active.screen || {};
      const cardData = spec.card_data || {};
      localStorage.setItem('aura_active_feedback_context', JSON.stringify({
        surface: 'feed',
        screen_spec_id: active.screen_spec_db_id,
        screen_id: spec.screen_id,
        node_id: spec.metadata?.node_id || cardData.node_id || null,
        source: spec.metadata?.source || null,
        title: cardData.title || spec.components?.find((c: any) => c?.type === 'headline')?.text || null,
        domain: spec.metadata?.domain || spec.domain || null,
        city: spec.metadata?.location_city || spec.metadata?.city || null,
        card_type: spec.type || null,
        updated_at: new Date().toISOString(),
      }));
    } catch {}
  }, [cards, index]);

  const loadMore = useCallback(async () => {
    if (loadingMore || isLimited) return;
    setLoadingMore(true);
    try {
      const batch = await AuraClient.getNextScreenBatch(3, goalId, undefined, feedContext, feedMode);
      let nextCards = enforceFeedMode(batch, feedMode, preferredCity);
      if (!nextCards.length) {
        const single = await AuraClient.getNextScreen(feedContext, goalId, undefined, feedMode).catch(() => null);
        nextCards = enforceFeedMode(single ? [single] : [], feedMode, preferredCity);
      }
      if (nextCards.length > 0) {
        setCards((prev) => [...prev, ...nextCards]);
        setIsLimited(nextCards[nextCards.length - 1].is_limited);
        setDailyLimit(nextCards[nextCards.length - 1].daily_limit);
      }
    } catch (e: any) {
      if (e?.response?.status === 402) setIsLimited(true);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, isLimited, goalId, feedContext, feedMode, preferredCity]);

  const scrollToIndex = useCallback((i: number) => {
    const s = scrollerRef.current;
    if (!s) return;
    s.scrollTo({ top: i * s.clientHeight, behavior: 'smooth' });
  }, []);

  const goNext = useCallback(() => {
    setIndex((prev) => {
      const next = Math.min(prev + 1, cards.length - 1);
      scrollToIndex(next);
      if (next >= cards.length - 2) loadMore();
      return next;
    });
  }, [cards.length, scrollToIndex, loadMore]);

  const goPrev = useCallback(() => {
    setIndex((prev) => {
      const next = Math.max(prev - 1, 0);
      scrollToIndex(next);
      return next;
    });
  }, [scrollToIndex]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    const dx = e.changedTouches[0].clientX - (touchStartX.current ?? 0);
    touchStartY.current = null;
    touchStartX.current = null;
    if (Math.abs(dy) < 50 || Math.abs(dx) > Math.abs(dy) * 0.7) return;
    if (dy < 0) goNext(); else goPrev();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') goPrev();
      if (e.key === 'x' || e.key === 'X') handleSkip();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goNext, goPrev]);

  const handleRate = async (screenId: string, rating: number) => {
    setRatings((prev) => ({ ...prev, [screenId]: rating }));
    const card = cards[index];
    if (!card) return;
    try {
      await AuraClient.submitFeedback({
        screen_spec_id: screenId,
        rating,
        time_on_screen_ms: 0,
        exit_point: 'rate',
        completed: true,
      });
      // Send backend progress signal.
      AuraClient['client'].post('/api/gamification/checkin', { reason: 'card_rate', ref_id: screenId }).catch(() => {});
      showToast(rating >= 4 ? `♥ Loved it` : `Rated ${rating}★`);
      if (rating >= 4) setTimeout(goNext, 700);
    } catch {}
  };

  const handleDoNow = async (item: ScreenResponse, cardData: any) => {
    setRatings((prev) => ({ ...prev, [item.screen_spec_db_id]: 5 }));
    showToast('Opening next steps…');
    AuraClient.submitFeedback({
      screen_spec_id: item.screen_spec_db_id,
      rating: 5,
      time_on_screen_ms: 0,
      exit_point: 'do_now',
      completed: true,
      metadata: {
        learning_signal: 'execute_sheet_opened',
        feed_mode: (item.screen as any)?.metadata?.feed_mode,
        temporal_branch: (item.screen as any)?.metadata?.temporal_branch,
      },
    }).catch(() => {});
    const nodeId = (item.screen as any)?.metadata?.node_id || (item.screen as any)?.card_data?.node_id;
    let execution = null;
    if (nodeId) {
      execution = await AuraClient.executeIOONode(String(nodeId), 'do_now').catch(() => null);
    }
    setPathwaySheet({ item, card: cardData, execution });
  };

  const handleSaveRequest = (card: any) => {
    setCollectionPickerCard(card);
  };

  const handleCollectionSaved = (collectionName: string) => {
    if (collectionPickerCard) {
      setSavedIds((prev) => new Set([...prev, collectionPickerCard.screen_spec_id]));
    }
    setCollectionPickerCard(null);
    showToast(`✦ Saved to ${collectionName}`);
    // Navigate to next card after short delay
    setTimeout(goNext, 800);
  };

  const handleSkip = () => {
    const card = cards[index];
    if (card) {
      AuraClient.submitFeedback({
        screen_spec_id: card.screen_spec_db_id,
        rating: 1, time_on_screen_ms: 0,
        exit_point: 'skip', completed: false,
        metadata: {
          learning_signal: 'skill_or_fit_mismatch',
          offered_domain: card.screen?.metadata?.domain,
          offered_type: card.screen?.type,
          offered_difficulty: (card.screen as any)?.metadata?.difficulty || (card.screen as any)?.metadata?.difficulty_level,
          interpretation: 'Skip may mean not interested, too easy, too hard, irrelevant, or wrong current skill level; update user capability model probabilistically rather than only down-ranking content.',
        },
      }).catch(() => {});
    }
    goNext();
  };

  const handleInvite = async (item: ScreenResponse, cardData: any) => {
    const spec: any = item.screen || {};
    const metadata = spec.metadata || {};
    const links = Array.isArray(metadata.links) ? metadata.links : [];
    const primaryUrl = cardData?.url || metadata.url || links.find((link: any) => link?.url)?.url || `${window.location.origin}/connectome-web/app`;
    const title = cardData?.title || 'this Connectome path node';
    const when = metadata.starts_at ? `\nWhen: ${metadata.starts_at}` : '';
    const city = metadata.location_city || metadata.city ? `\nWhere: ${metadata.location_city || metadata.city}` : '';
    const text = `Want to do this with me?\n\n${title}${when}${city}\n\n${primaryUrl}\n\nI found it through Connectome.`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `Join me: ${title}`, text, url: primaryUrl });
        showToast('Invite opened');
      } else {
        await navigator.clipboard.writeText(text);
        showToast('Invite copied');
      }
      AuraClient.submitFeedback({
        screen_spec_id: item.screen_spec_db_id,
        rating: 5,
        exit_point: 'invite_friends',
        completed: false,
        metadata: { learning_signal: 'social_execution_intent', feed_mode: metadata.feed_mode, temporal_branch: metadata.temporal_branch, invite_url: primaryUrl },
      }).catch(() => {});
    } catch {
      showToast('Invite cancelled');
    }
  };

  // ─── Loading ─────────────────────────────────────────────────────────────
  if (!capabilityReady) {
    return null; // never gate — intake is now inline in the feed
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16 }}>
        <div style={{ fontSize: 40, animation: 'brainFloat 3s ease-in-out infinite', color: '#00d4aa' }}>◈</div>
        <div style={{ fontSize: 13, color: 'rgba(248,248,252,0.3)' }}>Curating your feed…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16, padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 32 }}>⚠️</div>
        <div style={{ fontSize: 15, fontWeight: 700 }}>Could not load feed</div>
        <div style={{ fontSize: 13, color: 'rgba(248,248,252,0.45)' }}>{error}</div>
        <button
          onClick={() => loadInitial()}
          style={{
            marginTop: 16,
            background: 'rgba(0,212,170,0.15)',
            border: '1px solid rgba(0,212,170,0.4)',
            color: '#00d4aa',
            padding: '10px 24px',
            borderRadius: 24,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Try again →
        </button>
      </div>
    );
  }

  if (!cards.length) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16, padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 40 }}>{isLimited ? '✨' : '◈'}</div>
        <div style={{ fontWeight: 700, fontSize: 18 }}>{isLimited ? 'Cards are refreshing' : 'Preparing your first card'}</div>
        <div style={{ fontSize: 13, color: 'rgba(248,248,252,0.4)', textAlign: 'center' }}>
          {isLimited
            ? 'Aura hit a temporary feed limit. Retry now — the feed should reopen.'
            : hasGoals === false
              ? 'You can set a goal, or retry and Aura will suggest a discovery card.'
              : 'Aura returned an empty batch. Retry will request a single fallback card.'}
        </div>
        {hasGoals === false && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 320 }}>
            <button
              onClick={() => navigate('/')}
              style={{
                marginTop: 12,
                background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                border: 'none',
                color: '#fff',
                padding: '12px 20px',
                borderRadius: 24,
                fontSize: 14,
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 0 24px rgba(139,92,246,0.25)',
              }}
            >
              I know what I want to do →
            </button>
            <button
              onClick={() => loadInitial()}
              style={{
                background: 'rgba(0,212,170,0.15)',
                border: '1px solid rgba(0,212,170,0.4)',
                color: '#00d4aa',
                padding: '12px 20px',
                borderRadius: 24,
                fontSize: 14,
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              I don't know what I want to do →
            </button>
          </div>
        )}
        {hasGoals !== false && (
          <button
            onClick={() => loadInitial()}
            style={{
              marginTop: 12,
              background: 'rgba(0,212,170,0.15)',
              border: '1px solid rgba(0,212,170,0.4)',
              color: '#00d4aa',
              padding: '10px 24px',
              borderRadius: 24,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Refresh →
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="feed-container" style={{ background: '#0a0a0f' }}>

      {/* Collection picker */}
      {pathwaySheet && <PathwaySheet data={pathwaySheet} onClose={() => setPathwaySheet(null)} onInvite={() => handleInvite(pathwaySheet.item, pathwaySheet.card)} />}


      {collectionPickerCard && (
        <CollectionPicker
          card={collectionPickerCard}
          onClose={() => setCollectionPickerCard(null)}
          onSaved={handleCollectionSaved}
        />
      )}


      {/* Snap scroll container */}
      <div
        ref={scrollerRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          width: '100%', height: '100%',
          overflowY: 'scroll',
          scrollSnapType: 'y mandatory',
          scrollbarWidth: 'none',
        }}
        onScroll={(e) => {
          const el = e.currentTarget;
          const newIndex = Math.round(el.scrollTop / el.clientHeight);
          if (newIndex !== index) {
            setIndex(newIndex);
            if (newIndex >= cards.length - 2) loadMore();
          }
        }}
      >
        {cards.map((item, i) => (
          <div key={item.screen_spec_db_id} style={{
            width: '100%', height: '100%', flexShrink: 0,
            scrollSnapAlign: 'start', scrollSnapStop: 'always',
          }}>
            <FeedCard
              item={item}
              active={i === index}
              onRate={handleRate}
              onDoNow={handleDoNow}
              onInvite={handleInvite}
              onSaveRequest={handleSaveRequest}
              onSkip={handleSkip}
              onIntakeComplete={handleIntakeComplete}
              ratings={ratings}
              savedIds={savedIds}
            />
          </div>
        ))}

        {isLimited && (
          <div style={{
            width: '100%', height: '100%', flexShrink: 0,
            scrollSnapAlign: 'start', scrollSnapStop: 'always',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: 16, padding: 32, textAlign: 'center',
            background: 'radial-gradient(ellipse at center, rgba(0,212,170,0.08) 0%, #0a0a0f 70%)',
          }}>
            <div style={{ fontSize: 56 }}>✨</div>
            <div style={{ fontWeight: 900, fontSize: 24 }}>You're done for today</div>
            <div style={{ fontSize: 14, color: 'rgba(248,248,252,0.4)', maxWidth: 280, lineHeight: 1.7 }}>
              {dailyLimit} cards/day keeps insights sharp. Aura will have fresh ones ready tomorrow.
            </div>
            <button onClick={() => loadInitial()} style={{
              background: 'linear-gradient(135deg, #00d4aa, #00b896)',
              color: '#0a0a0f', padding: '14px 32px', borderRadius: 14,
              fontWeight: 800, fontSize: 16, marginTop: 8,
              boxShadow: '0 4px 24px rgba(0,212,170,0.3)',
            }}>
              Show me another node →
            </button>
          </div>
        )}

        {loadingMore && (
          <div style={{
            width: '100%', height: '100%', flexShrink: 0,
            scrollSnapAlign: 'start', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ fontSize: 32, animation: 'brainFloat 3s ease-in-out infinite', color: '#00d4aa' }}>◈</div>
          </div>
        )}
      </div>


      {/* Top header */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
        padding: 'env(safe-area-inset-top, 12px) 16px 12px',
        paddingTop: 'max(env(safe-area-inset-top), 12px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'linear-gradient(rgba(10,10,15,0.85), transparent)',
        pointerEvents: 'none',
      }}>
        {goalId && goalTitle ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ color: '#8b5cf6', fontSize: 14 }}>◈</span>
            <span style={{ fontWeight: 700, fontSize: 13, color: '#8b5cf6', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {goalTitle}
            </span>
          </div>
        ) : (
          <div aria-hidden="true" />
        )}
      </div>

      {/* Card counter dots */}
      <div style={{
        position: 'absolute', top: 'max(env(safe-area-inset-top), 12px)',
        left: '50%', transform: 'translateX(-50%)',
        display: 'flex', gap: 4, zIndex: 20, pointerEvents: 'none',
        paddingTop: 16,
      }}>
        {cards.slice(Math.max(0, index - 2), Math.min(cards.length, index + 3)).map((_, i) => {
          const actualIdx = Math.max(0, index - 2) + i;
          return (
            <div key={actualIdx} style={{
              width: actualIdx === index ? 16 : 4,
              height: 4,
              borderRadius: 2,
              background: actualIdx === index ? '#00d4aa' : 'rgba(255,255,255,0.2)',
              transition: 'all 0.25s cubic-bezier(.25,.8,.25,1)',
            }} />
          );
        })}
      </div>

      {/* Toast */}
      {toastMsg && (
        <div style={{
          position: 'absolute', bottom: 95, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(18,18,30,0.95)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(0,212,170,0.3)',
          color: '#00d4aa', padding: '10px 20px', borderRadius: 24,
          fontSize: 13, fontWeight: 700, zIndex: 50,
          whiteSpace: 'nowrap',
          boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
          animation: 'fadeIn 0.2s ease-out',
        }}>
          {toastMsg}
        </div>
      )}

      <style>{`
        @keyframes brainFloat {
          0%, 100% { transform: translateY(0) rotate(-2deg); }
          50%       { transform: translateY(-12px) rotate(2deg); }
        }
        @keyframes fadeIn { from { opacity: 0; transform: translateX(-50%) translateY(8px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
      `}</style>
    </div>
  );
}
