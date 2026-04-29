/**
 * FeedPage — TikTok-style vertical snap-scroll feed.
 *
 * v2: Full-bleed visual design (Airbnb/TikTok quality), collection save,
 * streak-aware header, XP awards on interaction.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { OraClient, ScreenResponse } from '../lib/OraClient';
import { OraCard } from '../components/OraCard';
import { CollectionPicker } from '../components/CollectionPicker';
import { StreakBadge } from '../components/StreakBadge';
import { useExperiment } from '../lib/useExperiment';

// ─── Domain config ────────────────────────────────────────────────────────────
const DOMAIN_CONFIG: Record<string, { color: string; gradient: string; emoji: string }> = {
  iVive:   { color: '#10b981', gradient: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #0a0a0f 100%)', emoji: '🌱' },
  Eviva:   { color: '#3b82f6', gradient: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 50%, #0a0a0f 100%)', emoji: '🌊' },
  Animus:  { color: '#a855f7', gradient: 'linear-gradient(135deg, #3b0764 0%, #6b21a8 50%, #0a0a0f 100%)', emoji: '✨' },
  Aventi:  { color: '#f59e0b', gradient: 'linear-gradient(135deg, #451a03 0%, #92400e 50%, #0a0a0f 100%)', emoji: '🚀' },
};
const DEFAULT_DOMAIN = { color: '#00d4aa', gradient: 'linear-gradient(135deg, #042f2e 0%, #0f766e 50%, #0a0a0f 100%)', emoji: '◈' };

function getDomainConfig(spec: any) {
  const d = spec?.metadata?.domain || spec?.domain || '';
  return DOMAIN_CONFIG[d] || DEFAULT_DOMAIN;
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

// ─── Detail sheet ─────────────────────────────────────────────────────────────
function DetailSheet({ card, color, onClose }: { card: any; color: string; onClose: () => void }) {
  const deepDive = card?.deep_dive || null;
  const title = card?.title || card?.text || '';
  const body = card?.body || card?.body_text || '';

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
        style={{
          width: '100%',
          maxHeight: '88vh',
          background: '#12121e',
          borderRadius: '28px 28px 0 0',
          border: `1px solid ${color}22`,
          borderBottom: 'none',
          overflowY: 'auto',
          animation: 'slideUpSheet 0.32s cubic-bezier(.25,.8,.25,1)',
        }}
      >
        {/* Color accent bar */}
        <div style={{ height: 3, background: `linear-gradient(90deg, ${color}, ${color}55, transparent)`, borderRadius: '28px 28px 0 0' }} />

        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)' }} />
        </div>

        <div style={{ padding: '8px 24px 48px' }}>
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
                <div>
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
            </>
          ) : (
            <div style={{ fontSize: 13, color: 'rgba(248,248,252,0.25)', textAlign: 'center', padding: '20px 0' }}>Tap to explore deeper…</div>
          )}
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

// ─── Full-bleed FeedCard ─────────────────────────────────────────────────────
function FeedCard({
  item,
  active,
  onRate,
  onSaveRequest,
  onSkip,
  ratings,
  savedIds,
}: {
  item: ScreenResponse;
  active: boolean;
  onRate: (id: string, r: number) => void;
  onSaveRequest: (card: any) => void;
  onSkip: () => void;
  ratings: Record<string, number>;
  savedIds: Set<string>;
}) {
  const spec = item.screen;
  const navigate = useNavigate();
  const domainCfg = getDomainConfig(spec);
  const color = domainCfg.color;
  const domain = spec?.metadata?.domain || spec?.domain || '';
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
      if ((c as any).type === 'body_text' && !cardData.body) cardData.body = (c as any).text;
    }
  }
  if (!cardData.deep_dive) cardData.deep_dive = specAny.deep_dive || null;

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
      {/* Full-bleed gradient background — the Airbnb effect */}
      <div style={{
        position: 'absolute', inset: 0,
        background: domainCfg.gradient,
        opacity: 0.6,
        zIndex: 0,
      }} />

      {/* Noise texture overlay for depth */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'0.08\'/%3E%3C/svg%3E")',
        opacity: 0.4,
        zIndex: 1,
        pointerEvents: 'none',
      }} />

      {/* Top gradient for text legibility */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 120,
        background: 'linear-gradient(rgba(10,10,15,0.8), transparent)',
        zIndex: 2, pointerEvents: 'none',
      }} />

      {/* Bottom gradient for actions legibility */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 200,
        background: 'linear-gradient(transparent, rgba(10,10,15,0.97))',
        zIndex: 2, pointerEvents: 'none',
      }} />

      {/* Confetti */}
      <ConfettiBurst active={showConfetti} />

      {/* Detail sheet */}
      {showDetail && (
        <DetailSheet card={cardData} color={color} onClose={() => setShowDetail(false)} />
      )}

      {/* Scrollable content */}
      <div
        onClick={() => setShowDetail(true)}
        style={{
          position: 'relative', zIndex: 5,
          flex: 1, height: '100%',
          overflowY: 'auto',
          padding: '80px 20px 180px',
          scrollbarWidth: 'none',
          cursor: 'pointer',
        }}
      >
        {/* Domain badge */}
        {domain && (
          <div style={{ marginBottom: 16 }}>
            <span style={{
              background: 'rgba(0,0,0,0.35)',
              backdropFilter: 'blur(8px)',
              border: `1px solid ${color}44`,
              color,
              fontSize: 12, fontWeight: 700, letterSpacing: 0.5,
              padding: '5px 12px', borderRadius: 20,
            }}>
              {domainCfg.emoji} {domain}
            </span>
            {spec.type && spec.type !== 'standard' && (
              <span style={{
                marginLeft: 8,
                background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(248,248,252,0.4)', fontSize: 10, fontWeight: 700,
                letterSpacing: 1, textTransform: 'uppercase', padding: '5px 12px', borderRadius: 20,
              }}>
                {spec.type.replace(/_/g, ' ')}
              </span>
            )}
          </div>
        )}

        {/* Card content */}
        {spec.components.map((comp: any, i: number) => (
          <OraCard key={i} component={comp} index={i} onAction={(action: any) => {
            if (action.type === 'navigate' && action.url === '/goals') navigate('/goals');
          }} />
        ))}

        {/* "Tap for more" hint */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          marginTop: 20,
          background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 20, padding: '7px 14px',
          fontSize: 12, color: 'rgba(248,248,252,0.45)', fontWeight: 600,
        }}>
          <span>⤴</span> Tap for deep dive
        </div>
      </div>

      {/* Right-side action buttons (TikTok-style) */}
      <div style={{
        position: 'absolute',
        right: 14, bottom: 110,
        display: 'flex', flexDirection: 'column',
        gap: 16, alignItems: 'center',
        zIndex: 10,
      }}>
        {/* Rating stars — simplified to heart+fire for visual clarity */}
        <button
          onClick={() => onRate(item.screen_spec_db_id, currentRating === 5 ? 1 : 5)}
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
          {currentRating >= 4 ? 'Loved' : 'Like'}
        </div>

        {/* Quick star rating */}
        {[1, 2, 3, 4, 5].map((star) => (
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

        {/* Save to collection */}
        <button
          onClick={handleSave}
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
          {isSaved ? 'Saved' : 'Save'}
        </div>

        {/* Skip */}
        <button
          onClick={onSkip}
          style={{
            width: 44, height: 44, borderRadius: 22,
            background: 'rgba(0,0,0,0.4)',
            border: '1.5px solid rgba(255,255,255,0.12)',
            color: 'rgba(248,248,252,0.35)', fontSize: 18,
            backdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >✕</button>
      </div>

      {/* Bottom left: card info */}
      <div style={{
        position: 'absolute', bottom: 20, left: 16, right: 80,
        zIndex: 10,
      }}>
        {cardData.title && (
          <div style={{
            fontSize: 16, fontWeight: 800, color: '#f8f8fc',
            lineHeight: 1.3, marginBottom: 4,
            textShadow: '0 2px 8px rgba(0,0,0,0.6)',
          }}>
            {cardData.title.slice(0, 60)}{cardData.title.length > 60 ? '…' : ''}
          </div>
        )}
      </div>

      {/* Swipe hint */}
      {active && (
        <div style={{
          position: 'absolute', bottom: 8, left: 0, right: 0,
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

// ─── Main feed ────────────────────────────────────────────────────────────────
export default function FeedPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  React.useEffect(() => {
    if (!localStorage.getItem('connectome_token')) {
      navigate('/auth?redirect=/feed', { replace: true });
    }
  }, [navigate]);

  const { variant: goalBannerVariant } = useExperiment('feed_goal_banner');
  const { variant: emptyStateVariant, trackEvent: trackEmptyState } = useExperiment('feed_empty_state');

  const goalId = searchParams.get('goal') || undefined;
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
  const [streak, setStreak] = useState<{ current: number; at_risk: boolean } | null>(null);

  const touchStartY = useRef<number | null>(null);
  const touchStartX = useRef<number | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2500);
  };

  // Fetch streak for header
  useEffect(() => {
    OraClient.get<any>('/api/gamification/status')
      .then((data) => setStreak(data.streak))
      .catch(() => {});
  }, []);

  // Fetch goal title
  useEffect(() => {
    if (!goalId) return;
    OraClient.listGoals()
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
      const goals = await OraClient.listGoals().catch(() => []);
      setHasGoals(goals.length > 0);
      const batch = await OraClient.getNextScreenBatch(5, goalId);
      setCards(batch);
      setIndex(0);
      if (batch.length > 0) {
        setIsLimited(batch[batch.length - 1].is_limited);
        setDailyLimit(batch[batch.length - 1].daily_limit);
      }
      // Award card_view XP
      OraClient['client'].post('/api/gamification/checkin', { reason: 'card_view' }).catch(() => {});
    } catch (e: any) {
      if (e?.response?.status === 402) setIsLimited(true);
      else setError(e?.response?.data?.detail || 'Failed to load feed');
    } finally {
      setLoading(false);
    }
  }, [goalId]);

  useEffect(() => { loadInitial(); }, [loadInitial]);

  const loadMore = useCallback(async () => {
    if (loadingMore || isLimited) return;
    setLoadingMore(true);
    try {
      const batch = await OraClient.getNextScreenBatch(3, goalId);
      setCards((prev) => [...prev, ...batch]);
      if (batch.length > 0) {
        setIsLimited(batch[batch.length - 1].is_limited);
        setDailyLimit(batch[batch.length - 1].daily_limit);
      }
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, isLimited, goalId]);

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
      await OraClient.submitFeedback({
        screen_spec_id: screenId,
        rating,
        time_on_screen_ms: 0,
        exit_point: 'rate',
        completed: true,
      });
      // Award XP
      OraClient['client'].post('/api/gamification/checkin', { reason: 'card_rate', ref_id: screenId }).catch(() => {});
      showToast(rating >= 4 ? `♥ Loved it (+15 XP)` : `Rated ${rating}★`);
      if (rating >= 4) setTimeout(goNext, 700);
    } catch {}
  };

  const handleSaveRequest = (card: any) => {
    setCollectionPickerCard(card);
  };

  const handleCollectionSaved = (collectionName: string) => {
    if (collectionPickerCard) {
      setSavedIds((prev) => new Set([...prev, collectionPickerCard.screen_spec_id]));
    }
    setCollectionPickerCard(null);
    showToast(`✦ Saved to ${collectionName} (+20 XP)`);
    // Navigate to next card after short delay
    setTimeout(goNext, 800);
  };

  const handleSkip = () => {
    const card = cards[index];
    if (card) {
      OraClient.submitFeedback({
        screen_spec_id: card.screen_spec_db_id,
        rating: 1, time_on_screen_ms: 0,
        exit_point: 'skip', completed: false,
      }).catch(() => {});
    }
    goNext();
  };

  // ─── Loading ─────────────────────────────────────────────────────────────
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
        <button onClick={loadInitial} style={{ background: '#00d4aa', color: '#0a0a0f', padding: '10px 22px', borderRadius: 10, fontWeight: 700 }}>Retry</button>
      </div>
    );
  }

  if (!cards.length) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16, padding: 24 }}>
        <div style={{ fontSize: 40 }}>◈</div>
        <div style={{ fontWeight: 700, fontSize: 18 }}>Nothing yet</div>
        <div style={{ fontSize: 13, color: 'rgba(248,248,252,0.4)', textAlign: 'center' }}>
          {hasGoals === false ? 'Add a goal to get personalized cards' : "Ora's preparing your first cards…"}
        </div>
        {hasGoals === false && (
          <button onClick={() => { trackEmptyState('click'); navigate('/goals'); }}
            style={{ background: '#00d4aa', color: '#0a0a0f', padding: '10px 22px', borderRadius: 10, fontWeight: 700 }}>
            Add a goal →
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="feed-container" style={{ background: '#0a0a0f' }}>

      {/* Collection picker */}
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
              onSaveRequest={handleSaveRequest}
              onSkip={handleSkip}
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
              {dailyLimit} cards/day keeps insights sharp. Ora will have fresh ones ready tomorrow.
            </div>
            <button onClick={() => navigate('/goals')} style={{
              background: 'linear-gradient(135deg, #00d4aa, #00b896)',
              color: '#0a0a0f', padding: '14px 32px', borderRadius: 14,
              fontWeight: 800, fontSize: 16, marginTop: 8,
              boxShadow: '0 4px 24px rgba(0,212,170,0.3)',
            }}>
              Work on goals →
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
          <div style={{ fontWeight: 900, fontSize: 16, letterSpacing: -0.3, color: '#f8f8fc' }}>iDo</div>
        )}

        {/* Streak indicator */}
        {streak && (
          <div
            style={{ pointerEvents: 'auto' }}
            onClick={() => navigate('/profile')}
          >
            <StreakBadge compact />
          </div>
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
