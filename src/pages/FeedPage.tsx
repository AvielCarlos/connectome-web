import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { OraClient, ScreenResponse } from '../lib/OraClient';
import { OraCard } from '../components/OraCard';
import { useExperiment } from '../lib/useExperiment';

const DOMAIN_COLORS: Record<string, string> = {
  iVive: '#10b981',
  Eviva: '#3b82f6',
  Animus: '#a855f7',
};

function getColor(spec: any) {
  const d = spec?.metadata?.domain || spec?.domain || '';
  return DOMAIN_COLORS[d] || '#00d4aa';
}

// ─── Deep-dive detail sheet ─────────────────────────────────────────────────
function DetailSheet({ card, color, onClose }: { card: any; color: string; onClose: () => void }) {
  const deepDive = card?.deep_dive || null;
  const title = card?.title || card?.text || '';
  const body = card?.body || card?.body_text || '';

  const difficultyColor = (d: string) =>
    d === 'easy' ? '#10b981' : d === 'medium' ? '#f59e0b' : '#ef4444';

  const typeIcon = (t: string) =>
    ({ article: '📄', book: '📚', app: '📱', video: '🎬', tool: '🔧' }[t] || '🔗');

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(8px)',
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
          borderRadius: '24px 24px 0 0',
          border: `1px solid ${color}22`,
          borderBottom: 'none',
          overflowY: 'auto',
          animation: 'slideUpSheet 0.3s cubic-bezier(.25,.8,.25,1)',
        }}
      >
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)' }} />
        </div>

        <div style={{ padding: '8px 22px 40px' }}>
          {/* Title */}
          <div style={{ fontWeight: 800, fontSize: 20, lineHeight: 1.3, marginBottom: 10, color: '#f8f8fc' }}>{title}</div>

          {/* Body */}
          {body && <div style={{ fontSize: 15, color: 'rgba(248,248,252,0.65)', lineHeight: 1.7, marginBottom: 20 }}>{body}</div>}

          {deepDive ? (
            <>
              {/* Stats row */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 22, flexWrap: 'wrap' }}>
                {deepDive.time_to_start && (
                  <span style={{ background: color + '15', border: `1px solid ${color}33`, color, fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20 }}>
                    ⏱ {deepDive.time_to_start}
                  </span>
                )}
                {deepDive.difficulty && (
                  <span style={{ background: difficultyColor(deepDive.difficulty) + '15', border: `1px solid ${difficultyColor(deepDive.difficulty)}33`, color: difficultyColor(deepDive.difficulty), fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20 }}>
                    {deepDive.difficulty === 'easy' ? '✓ Easy start' : deepDive.difficulty === 'medium' ? '◎ Medium effort' : '⚡ Challenging'}
                  </span>
                )}
              </div>

              {/* Why it matters */}
              {deepDive.why_it_matters && (
                <div style={{ marginBottom: 22 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: color, marginBottom: 8, textTransform: 'uppercase' }}>Why it matters</div>
                  <div style={{ fontSize: 14, color: 'rgba(248,248,252,0.7)', lineHeight: 1.7 }}>{deepDive.why_it_matters}</div>
                </div>
              )}

              {/* Stat highlight */}
              {deepDive.stat && (
                <div style={{ background: color + '0e', border: `1px solid ${color}22`, borderRadius: 14, padding: '14px 18px', marginBottom: 22 }}>
                  <div style={{ fontSize: 13, color: color, fontWeight: 700, lineHeight: 1.5 }}>📊 {deepDive.stat}</div>
                </div>
              )}

              {/* Action steps */}
              {deepDive.steps?.length > 0 && (
                <div style={{ marginBottom: 22 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: color, marginBottom: 10, textTransform: 'uppercase' }}>How to start</div>
                  {deepDive.steps.map((step: string, i: number) => (
                    <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 10 }}>
                      <div style={{ width: 24, height: 24, borderRadius: 12, background: color + '20', border: `1px solid ${color}44`, color, fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
                      <div style={{ fontSize: 14, color: 'rgba(248,248,252,0.75)', lineHeight: 1.55 }}>{step}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Resources */}
              {deepDive.resources?.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: color, marginBottom: 10, textTransform: 'uppercase' }}>Explore more</div>
                  {deepDive.resources.map((r: any, i: number) => (
                    <a
                      key={i}
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '12px 14px', marginBottom: 8,
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 12, textDecoration: 'none',
                        transition: 'background 0.15s',
                      }}
                    >
                      <span style={{ fontSize: 20 }}>{typeIcon(r.type)}</span>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#f8f8fc' }}>{r.label}</div>
                        <div style={{ fontSize: 11, color: color, marginTop: 2 }}>{r.type}</div>
                      </div>
                      <div style={{ marginLeft: 'auto', color: 'rgba(248,248,252,0.3)', fontSize: 16 }}>›</div>
                    </a>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div style={{ fontSize: 13, color: 'rgba(248,248,252,0.3)', textAlign: 'center', padding: '20px 0' }}>Loading details…</div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideUpSheet {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ─── Single full-screen card ──────────────────────────────────────────────────
function FeedCard({
  item,
  active,
  onRate,
  onSave,
  onSkip,
  ratings,
}: {
  item: ScreenResponse;
  active: boolean;
  onRate: (id: string, r: number) => void;
  onSave: () => void;
  onSkip: () => void;
  ratings: Record<string, number>;
}) {
  const spec = item.screen;
  const navigate = useNavigate();
  const color = getColor(spec);
  const domain = spec?.metadata?.domain || spec?.domain || '';
  const currentRating = ratings[item.screen_spec_db_id] ?? 0;
  const [showDetail, setShowDetail] = useState(false);

  // Extract card data — check card_data first, then parse components
  const specAny = spec as any;
  const cardData: any = specAny.card_data || {};
  if (!cardData.title) {
    for (const c of spec.components || []) {
      if ((c as any).type === 'headline') cardData.title = (c as any).text;
      if ((c as any).type === 'body_text' && !cardData.body) cardData.body = (c as any).text;
    }
  }
  if (!cardData.deep_dive) cardData.deep_dive = specAny.deep_dive || null;

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#0a0a0f',
      overflow: 'hidden',
    }}>
      {/* Subtle gradient top accent */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: `linear-gradient(90deg, ${color}, transparent)`,
        zIndex: 2,
      }} />

      {/* Tap to expand detail sheet */}
      {showDetail && (
        <DetailSheet card={cardData} color={color} onClose={() => setShowDetail(false)} />
      )}

      {/* Scrollable content area — tap to open detail */}
      <div
        onClick={() => setShowDetail(true)}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '28px 20px 12px',
          scrollbarWidth: 'none',
          cursor: 'pointer',
        }}>
        {/* Domain badge */}
        {domain && (
          <div style={{ marginBottom: 16 }}>
            <span style={{
              background: color + '18', border: `1px solid ${color}44`,
              color, fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
              padding: '3px 10px', borderRadius: 20,
            }}>
              {domain === 'iVive' ? '🌱' : domain === 'Eviva' ? '🌊' : '✨'} {domain}
            </span>
            {spec.type && spec.type !== 'standard' && (
              <span style={{
                marginLeft: 8,
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(248,248,252,0.35)', fontSize: 10, fontWeight: 700,
                letterSpacing: 1, textTransform: 'uppercase' as const, padding: '3px 10px', borderRadius: 20,
              }}>
                {spec.type.replace(/_/g, ' ')}
              </span>
            )}
          </div>
        )}

        {/* Card components */}
        {spec.components.map((comp: any, i: number) => (
          <OraCard key={i} component={comp} index={i} onAction={(action: any) => {
            if (action.type === 'navigate' && action.url === '/goals') navigate('/goals');
          }} />
        ))}
      </div>

      {/* Right-side action buttons (TikTok style) */}
      <div style={{
        position: 'absolute',
        right: 14,
        bottom: 100,
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        alignItems: 'center',
        zIndex: 10,
      }}>
        {/* Star ratings */}
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => onRate(item.screen_spec_db_id, star)}
            style={{
              width: 44, height: 44, borderRadius: 22,
              background: currentRating >= star ? color + '28' : 'rgba(10,10,15,0.7)',
              border: `1.5px solid ${currentRating >= star ? color : 'rgba(255,255,255,0.15)'}`,
              color: currentRating >= star ? color : 'rgba(248,248,252,0.4)',
              fontSize: 18,
              backdropFilter: 'blur(12px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
            }}
          >
            ★
          </button>
        ))}

        {/* Divider */}
        <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)' }} />

        {/* Save */}
        <button
          onClick={onSave}
          style={{
            width: 44, height: 44, borderRadius: 22,
            background: 'rgba(0,212,170,0.15)',
            border: '1.5px solid rgba(0,212,170,0.4)',
            color: '#00d4aa', fontSize: 20,
            backdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          ✦
        </button>

        {/* Skip */}
        <button
          onClick={onSkip}
          style={{
            width: 44, height: 44, borderRadius: 22,
            background: 'rgba(255,255,255,0.07)',
            border: '1.5px solid rgba(255,255,255,0.12)',
            color: 'rgba(248,248,252,0.4)', fontSize: 18,
            backdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          ✕
        </button>
      </div>

      {/* Bottom gradient fade */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 80,
        background: 'linear-gradient(transparent, rgba(10,10,15,0.95))',
        pointerEvents: 'none', zIndex: 1,
      }} />

      {/* Tap to explore hint */}
      <div
        onClick={() => setShowDetail(true)}
        style={{
          position: 'absolute', bottom: 18, left: 70, right: 70,
          textAlign: 'center', zIndex: 5, cursor: 'pointer',
        }}
      >
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          background: 'rgba(255,255,255,0.07)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 20, padding: '6px 14px',
          fontSize: 12, color: 'rgba(248,248,252,0.5)', fontWeight: 600,
          backdropFilter: 'blur(8px)',
        }}>
          <span style={{ fontSize: 14 }}>⤴️</span> Tap to explore
        </div>
      </div>

      {/* Swipe hint (first card only) */}
      {active && (
        <div style={{
          position: 'absolute', bottom: 14, left: 0, right: 0,
          textAlign: 'center', fontSize: 11,
          color: 'rgba(248,248,252,0.2)', letterSpacing: 0.5,
          zIndex: 3, pointerEvents: 'none',
        }}>
          swipe up for next · down for prev
        </div>
      )}
    </div>
  );
}

// ─── Main feed ────────────────────────────────────────────────────────────────
export default function FeedPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Auth guard — redirect to login if not authenticated
  React.useEffect(() => {
    if (!OraClient.isAuthenticated()) {
      navigate('/auth?redirect=/feed', { replace: true });
    }
  }, [navigate]);

  // ─── A/B experiments ────────────────────────────────────────────────────
  const { variant: layoutVariant } = useExperiment('feed_card_layout');
  const { variant: ratingUI } = useExperiment('feed_rating_ui');
  const { variant: emptyStateVariant, trackEvent: trackEmptyState } = useExperiment('feed_empty_state');
  const { variant: goalBannerVariant } = useExperiment('feed_goal_banner');

  // Goal-directed mode: ?goal=<id> means the feed is curated for a specific goal
  const goalId = searchParams.get('goal') || undefined;
  const [goalTitle, setGoalTitle] = useState<string | null>(null);

  const [cards, setCards] = useState<ScreenResponse[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [isLimited, setIsLimited] = useState(false);
  const [dailyLimit, setDailyLimit] = useState(10);
  const [hasGoals, setHasGoals] = useState<boolean | null>(null);
  const [toastMsg, setToastMsg] = useState('');

  // Touch tracking
  const touchStartY = useRef<number | null>(null);
  const touchStartX = useRef<number | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2200);
  };

  // Fetch goal title when in goal-directed mode
  useEffect(() => {
    if (!goalId) return;
    OraClient.listGoals()
      .then((goals) => {
        const found = goals.find((g) => g.id === goalId);
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
        const last = batch[batch.length - 1];
        setIsLimited(last.is_limited);
        setDailyLimit(last.daily_limit);
      }
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
        const last = batch[batch.length - 1];
        setIsLimited(last.is_limited);
        setDailyLimit(last.daily_limit);
      }
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, isLimited]);

  // Scroll to card by index
  const scrollToIndex = useCallback((i: number) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    scroller.scrollTo({ top: i * scroller.clientHeight, behavior: 'smooth' });
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

  // Touch handlers — vertical swipe
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
    // Must be vertical dominant and past threshold
    if (Math.abs(dy) < 50 || Math.abs(dx) > Math.abs(dy) * 0.7) return;
    if (dy < 0) goNext(); else goPrev();
  };

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') goPrev();
      if (e.key === 's' || e.key === 'S') handleSave();
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
        time_on_screen_ms: Date.now() - Date.now(),
        exit_point: 'rate',
        completed: true,
      });
      showToast(`Rated ${rating}★`);
      setTimeout(goNext, 600);
    } catch {}
  };

  const handleSave = async () => {
    const card = cards[index];
    if (!card) return;
    try {
      await OraClient.saveScreen(card.screen_spec_db_id);
      showToast('✦ Saved');
    } catch { showToast('✦ Saved'); }
    setTimeout(goNext, 500);
  };

  const handleSkip = () => {
    const card = cards[index];
    if (card) {
      OraClient.submitFeedback({
        screen_spec_id: card.screen_spec_db_id,
        rating: 1,
        time_on_screen_ms: 0,
        exit_point: 'skip',
        completed: false,
      }).catch(() => {});
    }
    goNext();
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16 }}>
        <div style={{ fontSize: 36, animation: 'brainFloat 3s ease-in-out infinite' }}>◈</div>
        <div style={{ fontSize: 13, color: 'rgba(248,248,252,0.3)' }}>Ora is thinking…</div>
      </div>
    );
  }

  if (error) {
    const isAuthError = error.includes('401') || error.toLowerCase().includes('unauthorized') || error.toLowerCase().includes('not authenticated');
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16, padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 32 }}>{isAuthError ? '🔑' : '⚠️'}</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#f8f8fc' }}>{isAuthError ? 'Sign in to view your feed' : 'Could not load feed'}</div>
        <div style={{ fontSize: 13, color: 'rgba(248,248,252,0.45)' }}>{isAuthError ? 'Your session may have expired.' : error}</div>
        {isAuthError
          ? <button onClick={() => navigate('/auth?redirect=/feed')} style={{ background: '#6366f1', color: '#fff', padding: '10px 22px', borderRadius: 10, fontWeight: 700 }}>Sign In</button>
          : <button onClick={loadInitial} style={{ background: '#00d4aa', color: '#0a0a0f', padding: '10px 22px', borderRadius: 10, fontWeight: 700 }}>Retry</button>
        }
      </div>
    );
  }

  // Empty state messages from A/B experiment
  const EMPTY_STATE_MESSAGES: Record<string, string> = {
    A: 'Talk to Ora to get more cards',
    B: "You've seen everything for now — come back tomorrow",
    C: 'Add a goal to get personalized cards',
  };

  if (!cards.length) {
    const emptyMsg = EMPTY_STATE_MESSAGES[emptyStateVariant] || EMPTY_STATE_MESSAGES['A'];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16, padding: 24 }}>
        <div style={{ fontSize: 40 }}>◈</div>
        <div style={{ fontWeight: 700, fontSize: 18 }}>Nothing yet</div>
        <div style={{ fontSize: 13, color: 'rgba(248,248,252,0.4)', textAlign: 'center' }}>
          {hasGoals === false ? emptyMsg : "Ora's preparing your first cards…"}
        </div>
        {hasGoals === false && (
          <button
            onClick={() => {
              trackEmptyState('click');
              navigate(emptyStateVariant === 'A' ? '/ora' : '/goals');
            }}
            style={{ background: '#00d4aa', color: '#0a0a0f', padding: '10px 22px', borderRadius: 10, fontWeight: 700 }}
          >
            {emptyStateVariant === 'A' ? 'Talk to Ora →' : 'Add a goal →'}
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#0a0a0f', overflow: 'hidden' }}>

      {/* TikTok-style snap scroll container */}
      <div
        ref={scrollerRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          width: '100%',
          height: '100%',
          overflowY: 'scroll',
          scrollSnapType: 'y mandatory',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch' as any,
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
          <div
            key={item.screen_spec_db_id}
            style={{
              width: '100%',
              height: '100%',
              flexShrink: 0,
              scrollSnapAlign: 'start',
              scrollSnapStop: 'always',
            }}
          >
            <FeedCard
              item={item}
              active={i === index}
              onRate={handleRate}
              onSave={handleSave}
              onSkip={handleSkip}
              ratings={ratings}
            />
          </div>
        ))}

        {/* Daily limit end card */}
        {isLimited && (
          <div style={{
            width: '100%', height: '100%', flexShrink: 0,
            scrollSnapAlign: 'start', scrollSnapStop: 'always',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: 16, padding: 32, textAlign: 'center',
          }}>
            <div style={{ fontSize: 52 }}>✨</div>
            <div style={{ fontWeight: 800, fontSize: 22 }}>You're done for today</div>
            <div style={{ fontSize: 14, color: 'rgba(248,248,252,0.4)', maxWidth: 280, lineHeight: 1.6 }}>
              {dailyLimit} cards/day keeps the insights sharp. Come back tomorrow — Ora will have fresh ones ready.
            </div>
            <button onClick={() => navigate('/goals')} style={{
              background: '#00d4aa', color: '#0a0a0f',
              padding: '12px 28px', borderRadius: 12, fontWeight: 800, fontSize: 15, marginTop: 8,
            }}>
              Work on goals →
            </button>
          </div>
        )}

        {/* Loading more indicator */}
        {loadingMore && (
          <div style={{
            width: '100%', height: '100%', flexShrink: 0,
            scrollSnapAlign: 'start', scrollSnapStop: 'always',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ fontSize: 32, animation: 'brainFloat 3s ease-in-out infinite', color: '#00d4aa' }}>◈</div>
          </div>
        )}
      </div>

      {/* Top mini header */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        padding: '10px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'linear-gradient(rgba(10,10,15,0.8), transparent)',
        pointerEvents: 'none', zIndex: 20,
      }}>
        {goalId && goalTitle && goalBannerVariant !== 'B' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ color: '#8b5cf6', fontSize: 14 }}>◈</span>
            <span style={{ fontWeight: 700, fontSize: 13, color: 'rgba(248,248,252,0.85)', letterSpacing: 0.2 }}>
              Working toward:
            </span>
            <span style={{
              fontWeight: 600, fontSize: 13,
              color: '#8b5cf6',
              maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {goalTitle}
            </span>
          </div>
        ) : (
          <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: 0.3 }}>◈ Ora Feed</div>
        )}
        <div style={{ fontSize: 11, color: 'rgba(248,248,252,0.3)' }}>
          {(() => {
            const remaining = Math.max(0, cards.length - index - 1);
            const h = new Date().getHours();
            const timeLabel =
              h >= 5 && h < 12 ? 'morning'
              : h >= 12 && h < 17 ? 'afternoon'
              : h >= 17 && h < 22 ? 'evening'
              : 'night';
            return `${remaining} remaining · ${timeLabel} mode${loadingMore ? '…' : ''}`;
          })()}
        </div>
      </div>

      {/* Toast */}
      {toastMsg && (
        <div style={{
          position: 'absolute', bottom: 90, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(0,212,170,0.15)', border: '1px solid rgba(0,212,170,0.3)',
          color: '#00d4aa', padding: '8px 18px', borderRadius: 20,
          fontSize: 13, fontWeight: 600, zIndex: 50,
          backdropFilter: 'blur(12px)',
          animation: 'fadeIn 0.2s ease-out',
        }}>
          {toastMsg}
        </div>
      )}
    </div>
  );
}
