import React, { useState, useEffect, useCallback, useRef } from 'react';
import { OraClient, ScreenResponse, ScreenSpec } from '../lib/OraClient';
import { OraCard } from '../components/OraCard';
import { useNavigate } from 'react-router-dom';

const DOMAIN_COLORS: Record<string, string> = {
  iVive: '#10b981',
  Eviva: '#6366f1',
  Aventi: '#f59e0b',
};

function StarRating({ onRate, currentRating }: { onRate: (r: number) => void; currentRating?: number }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', padding: '8px 0' }}>
      <span style={{ fontSize: 10, color: 'rgba(248,248,252,0.3)', letterSpacing: 0.5 }}>RATE</span>
      {[1, 2, 3].map((s) => (
        <button key={s}
          onMouseEnter={() => setHovered(s)} onMouseLeave={() => setHovered(0)}
          onClick={() => onRate(s)}
          style={{
            background: 'transparent', fontSize: 22, padding: '2px 6px', borderRadius: 6,
            transition: 'all 0.15s',
            transform: (hovered >= s || (currentRating && currentRating >= s)) ? 'scale(1.25)' : 'scale(1)',
            filter: (hovered >= s || (currentRating && currentRating >= s)) ? 'none' : 'grayscale(0.6) opacity(0.4)',
          }}>⭐</button>
      ))}
      {currentRating && <span style={{ fontSize: 12, color: '#00d4aa', fontWeight: 700 }}>✓</span>}
    </div>
  );
}

// Skeleton card
function FeedSkeleton() {
  return (
    <div style={{ padding: '0 12px' }}>
      <div style={{ height: 20, width: '40%', borderRadius: 8, marginBottom: 20 }} className="skeleton" />
      <div style={{ background: '#12121a', borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ height: 3, background: 'rgba(0,212,170,0.2)' }} />
        <div style={{ padding: '20px 20px 16px' }}>
          <div style={{ height: 12, width: '30%', borderRadius: 6, marginBottom: 16 }} className="skeleton" />
          <div style={{ height: 28, width: '85%', borderRadius: 8, marginBottom: 12 }} className="skeleton" />
          <div style={{ height: 16, width: '100%', borderRadius: 6, marginBottom: 8 }} className="skeleton" />
          <div style={{ height: 16, width: '90%', borderRadius: 6, marginBottom: 8 }} className="skeleton" />
          <div style={{ height: 16, width: '70%', borderRadius: 6, marginBottom: 20 }} className="skeleton" />
          <div style={{ height: 44, borderRadius: 12 }} className="skeleton" />
        </div>
      </div>
    </div>
  );
}

export default function FeedPage() {
  const navigate = useNavigate();
  const [cards, setCards] = useState<ScreenResponse[]>([]);
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [isLimited, setIsLimited] = useState(false);
  const [screensToday, setScreensToday] = useState(0);
  const [dailyLimit, setDailyLimit] = useState(10);
  const [hasGoals, setHasGoals] = useState<boolean | null>(null);
  const [cardKey, setCardKey] = useState(0); // force re-mount for animation
  const startTimeRef = useRef<number>(Date.now());
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const goals = await OraClient.listGoals().catch(() => []);
      setHasGoals(goals.length > 0);
      const batch = await OraClient.getNextScreenBatch(5);
      setCards(batch);
      setIndex(0);
      if (batch.length > 0) {
        const last = batch[batch.length - 1];
        setIsLimited(last.is_limited);
        setScreensToday(last.screens_today);
        setDailyLimit(last.daily_limit);
      }
    } catch (e: any) {
      if (e?.response?.status === 402) setIsLimited(true);
      else setError(e?.response?.data?.detail || 'Failed to load feed');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      const batch = await OraClient.getNextScreenBatch(5);
      setCards(batch);
      setIndex(0);
      setCardKey((k) => k + 1);
      if (batch.length > 0) {
        const last = batch[batch.length - 1];
        setIsLimited(last.is_limited);
        setScreensToday(last.screens_today);
        setDailyLimit(last.daily_limit);
      }
    } catch { /* silent */ }
    finally { setRefreshing(false); }
  }, [refreshing]);

  const loadMore = useCallback(async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      const batch = await OraClient.getNextScreenBatch(3);
      setCards((prev) => [...prev, ...batch]);
      if (batch.length > 0) {
        const last = batch[batch.length - 1];
        setIsLimited(last.is_limited);
        setScreensToday(last.screens_today);
        setDailyLimit(last.daily_limit);
      }
    } catch (e: any) {
      if (e?.response?.status === 402) setIsLimited(true);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore]);

  useEffect(() => { loadInitial(); }, [loadInitial]);

  useEffect(() => {
    if (cards.length > 0 && index >= cards.length - 2 && !loadingMore && !isLimited) {
      loadMore();
    }
  }, [index, cards.length, loadingMore, isLimited, loadMore]);

  const submitFeedbackAndAdvance = useCallback((exitPoint: 'save' | 'skip' | 'swipe_next') => {
    const card = cards[index];
    if (!card) return;
    const timeMs = Date.now() - startTimeRef.current;
    OraClient.submitFeedback({
      screen_spec_id: card.screen_spec_db_id,
      time_on_screen_ms: timeMs,
      exit_point: exitPoint,
      rating: ratings[card.screen_spec_db_id],
      completed: exitPoint === 'save',
    }).catch(() => {});
    startTimeRef.current = Date.now();
  }, [cards, index, ratings]);

  const goNext = useCallback(() => {
    if (index < cards.length - 1) {
      submitFeedbackAndAdvance('swipe_next');
      setDirection('forward');
      setCardKey((k) => k + 1);
      setIndex((i) => i + 1);
    }
  }, [index, cards.length, submitFeedbackAndAdvance]);

  const goPrev = useCallback(() => {
    if (index > 0) {
      startTimeRef.current = Date.now();
      setDirection('back');
      setCardKey((k) => k + 1);
      setIndex((i) => i - 1);
    }
  }, [index]);

  const handleSkip = useCallback(() => {
    submitFeedbackAndAdvance('skip');
    setDirection('forward');
    setCardKey((k) => k + 1);
    if (index < cards.length - 1) setIndex((i) => i + 1);
  }, [submitFeedbackAndAdvance, index, cards.length]);

  const handleSave = useCallback(() => {
    submitFeedbackAndAdvance('save');
    setDirection('forward');
    setCardKey((k) => k + 1);
    if (index < cards.length - 1) setIndex((i) => i + 1);
  }, [submitFeedbackAndAdvance, index, cards.length]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goNext();
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') goPrev();
      if (e.key === 's') handleSave();
      if (e.key === 'x') handleSkip();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goNext, goPrev, handleSave, handleSkip]);

  // Touch swipe — vertical only (swipe up = next, swipe down = previous)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
    const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
    const adx = Math.abs(dx), ady = Math.abs(dy);
    // Only respond to vertical swipes; ignore horizontal
    if (ady < 40 || adx > ady * 0.8) { touchStartRef.current = null; return; }
    if (dy < 0) goNext(); else goPrev();
    touchStartRef.current = null;
  };

  const handleRate = async (rating: number) => {
    const card = cards[index];
    if (!card) return;
    setRatings((prev) => ({ ...prev, [card.screen_spec_db_id]: rating }));
    try {
      await OraClient.submitFeedback({
        screen_spec_id: card.screen_spec_db_id,
        rating,
        time_on_screen_ms: Date.now() - startTimeRef.current,
      });
    } catch { /* silent */ }
  };

  // ── Loading State ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="page-content" style={{ maxWidth: 600, margin: '0 auto' }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 20px 12px',
          position: 'sticky', top: 'var(--top-header-height)',
          background: 'rgba(10,10,15,0.92)', backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255,255,255,0.05)', zIndex: 10,
          marginBottom: 16,
        }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 17 }}>◈ Ora Feed</div>
            <div style={{ height: 12, width: 100, borderRadius: 6, marginTop: 4 }} className="skeleton" />
          </div>
          <div style={{ height: 34, width: 80, borderRadius: 8 }} className="skeleton" />
        </div>
        <FeedSkeleton />
        <div style={{ textAlign: 'center', color: 'rgba(248,248,252,0.3)', fontSize: 13, marginTop: 24 }}>
          Ora is preparing your feed…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-content" style={{ textAlign: 'center', padding: 40 }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>⚠️</div>
        <div style={{ color: 'rgba(248,248,252,0.55)', marginBottom: 20 }}>{error}</div>
        <button onClick={loadInitial} style={{ background: '#00d4aa', color: '#0a0a0f', padding: '12px 24px', borderRadius: 10, fontWeight: 700 }}>Try again</button>
      </div>
    );
  }

  if (isLimited && cards.length === 0) {
    return (
      <div className="page-content" style={{ textAlign: 'center', padding: '60px 24px' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }} className="brain-float">✨</div>
        <h2 style={{ fontWeight: 700, marginBottom: 12 }}>Daily limit reached</h2>
        <p style={{ color: 'rgba(248,248,252,0.55)', maxWidth: 300, margin: '0 auto 24px', lineHeight: 1.6 }}>
          You've seen {dailyLimit} cards today. Come back tomorrow — Ora will have fresh insights waiting.
        </p>
        <button onClick={() => navigate('/goals')} style={{ background: '#00d4aa', color: '#0a0a0f', padding: '12px 24px', borderRadius: 10, fontWeight: 700 }}>
          Work on your goals →
        </button>
      </div>
    );
  }

  // No goals prompt
  if (hasGoals === false && cards.length === 0) {
    return (
      <div className="page-content" style={{ textAlign: 'center', padding: '48px 24px', maxWidth: 400, margin: '0 auto' }}>
        <div style={{ fontSize: 72, marginBottom: 20, display: 'inline-block' }} className="brain-float">🧠</div>
        <h2 style={{ fontWeight: 800, marginBottom: 12, fontSize: 22 }}>Ora needs to know you</h2>
        <p style={{ color: 'rgba(248,248,252,0.55)', marginBottom: 28, lineHeight: 1.6 }}>
          Set a goal and Ora will generate cards tailored to your life — things to do, explore, reflect on, and experience.
        </p>
        <button onClick={() => navigate('/goals')} style={{
          background: 'linear-gradient(135deg, #00d4aa, #0099aa)',
          color: '#0a0a0f', padding: '14px 32px', borderRadius: 12, fontWeight: 800, fontSize: 16,
          display: 'block', width: '100%', marginBottom: 12,
        }}>
          ✦ Set your first goal
        </button>
        <button onClick={loadInitial} style={{
          background: 'rgba(255,255,255,0.06)', color: 'rgba(248,248,252,0.6)',
          padding: '12px 24px', borderRadius: 12, fontSize: 14, width: '100%',
        }}>
          Show me what Ora has anyway
        </button>
      </div>
    );
  }

  const current = cards[index];
  if (!current) return null;

  const spec: ScreenSpec = current.screen;
  const domain = (spec as any).domain || spec.metadata?.domain;
  const domainColor = domain ? DOMAIN_COLORS[domain] : '#00d4aa';
  const isWeakContent = spec.type === 'discovery' &&
    spec.components.some(c => c.text?.includes('Week in Review') || c.text?.includes('Fulfilment score: 0%'));

  return (
    <div className="page-content" style={{ maxWidth: 600, margin: '0 auto', padding: '0 0 100px', userSelect: 'none' }}>
      {/* Sticky header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 20px 12px',
        position: 'sticky',
        top: 'var(--top-header-height)',
        background: 'rgba(10,10,15,0.92)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)', zIndex: 10,
        marginBottom: 12,
      }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 17 }}>◈ Ora Feed</div>
          <div style={{ fontSize: 11, color: 'rgba(248,248,252,0.3)', marginTop: 1 }}>
            {index + 1} of {cards.length} · {dailyLimit - screensToday > 0 ? `${dailyLimit - screensToday} remaining` : 'limit reached'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {/* Refresh button */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            title="Refresh feed"
            style={{
              background: 'rgba(255,255,255,0.07)',
              color: refreshing ? '#00d4aa' : 'rgba(248,248,252,0.6)',
              padding: '8px 10px', borderRadius: 8, fontSize: 16,
              transition: 'all 0.15s',
            }}
          >
            <span style={{ display: 'inline-block', animation: refreshing ? 'refreshSpin 0.6s linear infinite' : 'none' }}>
              ↺
            </span>
          </button>
          <button onClick={goPrev} disabled={index === 0} style={{
            background: 'rgba(255,255,255,0.07)', color: index === 0 ? 'rgba(248,248,252,0.15)' : '#f8f8fc',
            padding: '8px 12px', borderRadius: 8, fontSize: 15,
          }}>↑</button>
          <button onClick={goNext} disabled={index >= cards.length - 1} style={{
            background: index < cards.length - 1 ? '#00d4aa' : 'rgba(255,255,255,0.07)',
            color: index < cards.length - 1 ? '#0a0a0f' : 'rgba(248,248,252,0.15)',
            padding: '8px 12px', borderRadius: 8, fontSize: 15, fontWeight: 700,
          }}>↓</button>
        </div>
      </div>

      <div style={{ padding: '0 12px' }}>
        {/* Swipe hint */}
        <div style={{ textAlign: 'center', fontSize: 10, color: 'rgba(248,248,252,0.15)', marginBottom: 10, letterSpacing: 0.4 }}>
          swipe up/down · arrow keys · S to save · X to skip
        </div>

        {/* Weak content nudge */}
        {isWeakContent && (
          <div style={{
            background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)',
            borderRadius: 12, padding: '12px 16px', marginBottom: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          }}>
            <div style={{ fontSize: 13, color: 'rgba(248,248,252,0.6)', lineHeight: 1.4 }}>
              ✦ Ora gets smarter when you set goals
            </div>
            <button onClick={() => navigate('/goals')} style={{
              background: 'rgba(168,85,247,0.25)', color: '#c084fc',
              padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
            }}>
              Add goal →
            </button>
          </div>
        )}

        {/* Card with animation */}
        <div
          key={`card-${cardKey}`}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className={direction === 'forward' ? 'card-enter-right' : 'card-enter-left'}
          style={{
            background: '#12121a',
            borderRadius: 20,
            border: `1px solid ${domainColor}1a`,
            boxShadow: `0 8px 48px ${domainColor}0d`,
            overflow: 'hidden',
          }}
        >
          {/* Color stripe */}
          <div style={{ height: 3, background: `linear-gradient(90deg, ${domainColor}, transparent)` }} />

          <div style={{ padding: '20px 20px 8px' }}>
            {/* Domain + type badges */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
              {domain && (
                <span style={{
                  background: domainColor + '18', border: `1px solid ${domainColor}44`,
                  color: domainColor, fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
                  padding: '3px 10px', borderRadius: 20,
                }}>
                  {domain === 'iVive' ? '🌱' : domain === 'Eviva' ? '🌊' : '✨'} {domain}
                </span>
              )}
              {spec.type && spec.type !== 'standard' && (
                <span style={{
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(248,248,252,0.35)', fontSize: 10, fontWeight: 700,
                  letterSpacing: 1.2, textTransform: 'uppercase', padding: '3px 10px', borderRadius: 20,
                }}>
                  {spec.type.replace(/_/g, ' ')}
                </span>
              )}
            </div>

            {/* Components */}
            {spec.components.map((comp, i) => (
              <OraCard key={i} component={comp} index={i} onAction={(action) => {
                if (action.type === 'next_screen') goNext();
                if (action.type === 'navigate' && action.url === '/goals') navigate('/goals');
              }} />
            ))}
          </div>

          {/* Rating */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '0 20px 8px' }}>
            <StarRating onRate={handleRate} currentRating={ratings[current.screen_spec_db_id]} />
          </div>

          {/* Skip / Save actions */}
          <div style={{
            display: 'flex', gap: 0,
            borderTop: '1px solid rgba(255,255,255,0.05)',
          }}>
            <button
              onClick={handleSkip}
              style={{
                flex: 1,
                padding: '14px 0',
                background: 'transparent',
                color: 'rgba(248,248,252,0.4)',
                fontSize: 13,
                fontWeight: 600,
                borderRight: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '0 0 0 20px',
                letterSpacing: 0.3,
              }}
            >
              ✕ Skip
            </button>
            <button
              onClick={handleSave}
              style={{
                flex: 1,
                padding: '14px 0',
                background: 'rgba(0,212,170,0.08)',
                color: '#00d4aa',
                fontSize: 13,
                fontWeight: 700,
                borderRadius: '0 0 20px 0',
                letterSpacing: 0.3,
              }}
            >
              ✦ Save
            </button>
          </div>
        </div>

        {/* Progress dots */}
        {cards.length > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 5, marginTop: 16 }}>
            {cards.slice(Math.max(0, index - 4), Math.min(cards.length, index + 5)).map((_, i) => {
              const ai = i + Math.max(0, index - 4);
              return (
                <div key={ai} onClick={() => { setDirection(ai > index ? 'forward' : 'back'); setCardKey((k) => k + 1); setIndex(ai); }} style={{
                  width: ai === index ? 22 : 6, height: 6, borderRadius: 3,
                  background: ai === index ? '#00d4aa' : 'rgba(255,255,255,0.18)',
                  cursor: 'pointer', transition: 'all 0.2s',
                }} />
              );
            })}
            {loadingMore && <div style={{ width: 6, height: 6, borderRadius: 3, background: 'rgba(0,212,170,0.4)', animation: 'pulse 1s ease-in-out infinite' }} />}
          </div>
        )}

        {/* End of cards */}
        {isLimited && index >= cards.length - 1 && (
          <div style={{
            marginTop: 20, background: 'rgba(0,212,170,0.06)', border: '1px solid rgba(0,212,170,0.18)',
            borderRadius: 14, padding: '20px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>✨</div>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Daily limit reached</div>
            <div style={{ fontSize: 13, color: 'rgba(248,248,252,0.45)', marginBottom: 16 }}>
              {dailyLimit} focused cards per day. Come back tomorrow.
            </div>
            <button onClick={() => navigate('/goals')} style={{
              background: '#00d4aa', color: '#0a0a0f', padding: '10px 22px', borderRadius: 10, fontWeight: 700, fontSize: 14,
            }}>
              Work on goals →
            </button>
          </div>
        )}
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:0.4} 50%{opacity:1} }`}</style>
    </div>
  );
}
