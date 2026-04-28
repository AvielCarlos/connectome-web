import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { OraClient, ScreenResponse } from '../lib/OraClient';
import OraCard from '../components/OraCard';

const DOMAIN_COLORS: Record<string, string> = {
  iVive: '#10b981',
  Eviva: '#3b82f6',
  Animus: '#a855f7',
};

function getColor(spec: any) {
  const d = spec?.metadata?.domain || spec?.domain || '';
  return DOMAIN_COLORS[d] || '#00d4aa';
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

      {/* Scrollable content area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '28px 20px 12px',
        scrollbarWidth: 'none',
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
        setDailyLimit(last.daily_limit);
      }
    } catch (e: any) {
      if (e?.response?.status === 402) setIsLimited(true);
      else setError(e?.response?.data?.detail || 'Failed to load feed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadInitial(); }, [loadInitial]);

  const loadMore = useCallback(async () => {
    if (loadingMore || isLimited) return;
    setLoadingMore(true);
    try {
      const batch = await OraClient.getNextScreenBatch(3);
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
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12, padding: 24 }}>
        <div style={{ fontSize: 13, color: '#ef4444' }}>{error}</div>
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
          {hasGoals === false ? "Set a goal and Ora will curate your feed." : "Ora's preparing your first cards…"}
        </div>
        {hasGoals === false && (
          <button onClick={() => navigate('/goals')} style={{ background: '#00d4aa', color: '#0a0a0f', padding: '10px 22px', borderRadius: 10, fontWeight: 700 }}>
            Add a goal
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
        <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: 0.3 }}>◈ Ora Feed</div>
        <div style={{ fontSize: 11, color: 'rgba(248,248,252,0.3)' }}>
          {index + 1} / {cards.length}{loadingMore ? '…' : ''}
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
