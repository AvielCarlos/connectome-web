import React, { useState, useEffect, useCallback, useRef } from 'react';
import { OraClient, ScreenResponse, ScreenSpec } from '../lib/OraClient';
import { OraCard } from '../components/OraCard';

const DOMAIN_COLORS: Record<string, string> = {
  iVive: '#10b981',
  Eviva: '#6366f1',
  Aventi: '#f59e0b',
};

function StarRating({ onRate, currentRating }: { onRate: (r: number) => void; currentRating?: number }) {
  const [hovered, setHovered] = useState(0);
  const stars = [1, 2, 3];
  const labels = ['Meh', 'Good', 'Loved it'];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      gap: 6,
      padding: '12px 0',
    }}>
      <div style={{ fontSize: 11, color: 'rgba(248,248,252,0.35)', letterSpacing: 0.5, marginBottom: 2 }}>
        RATE THIS CARD
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        {stars.map((s) => (
          <button
            key={s}
            onMouseEnter={() => setHovered(s)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onRate(s)}
            style={{
              background: 'transparent',
              fontSize: 28,
              padding: '4px 8px',
              borderRadius: 8,
              transition: 'all 0.15s',
              transform: (hovered >= s || (currentRating && currentRating >= s)) ? 'scale(1.2)' : 'scale(1)',
              filter: (hovered >= s || (currentRating && currentRating >= s)) ? 'none' : 'grayscale(0.5) opacity(0.5)',
            }}
            title={labels[s - 1]}
          >
            ⭐
          </button>
        ))}
      </div>
      {(hovered > 0 || currentRating) && (
        <div style={{ fontSize: 12, color: '#00d4aa', fontWeight: 600 }}>
          {labels[(hovered || currentRating || 1) - 1]}
          {currentRating ? ' ✓' : ''}
        </div>
      )}
    </div>
  );
}

export default function FeedPage() {
  const [cards, setCards] = useState<ScreenResponse[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [isLimited, setIsLimited] = useState(false);
  const [screensToday, setScreensToday] = useState(0);
  const [dailyLimit, setDailyLimit] = useState(10);
  const startTimeRef = useRef<number>(Date.now());
  const [transition, setTransition] = useState<'slide-in' | ''>('');

  const loadInitial = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const batch = await OraClient.getNextScreenBatch(5);
      setCards(batch);
      if (batch.length > 0) {
        const last = batch[batch.length - 1];
        setIsLimited(last.is_limited);
        setScreensToday(last.screens_today);
        setDailyLimit(last.daily_limit);
      }
    } catch (e: any) {
      if (e?.response?.status === 402) {
        setIsLimited(true);
      } else {
        setError(e?.response?.data?.detail || 'Failed to load feed');
      }
    } finally {
      setLoading(false);
    }
  }, []);

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

  // Prefetch when approaching end
  useEffect(() => {
    if (cards.length > 0 && index >= cards.length - 2 && !loadingMore && !isLimited) {
      loadMore();
    }
  }, [index, cards.length, loadingMore, isLimited, loadMore]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goNext();
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') goPrev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  const goNext = useCallback(() => {
    if (index < cards.length - 1) {
      const timeMs = Date.now() - startTimeRef.current;
      const card = cards[index];
      if (card) {
        OraClient.submitFeedback({
          screen_spec_id: card.screen_spec_db_id,
          time_on_screen_ms: timeMs,
          exit_point: 'swipe_next',
          rating: ratings[card.screen_spec_db_id],
        }).catch(() => {});
      }
      startTimeRef.current = Date.now();
      setTransition('slide-in');
      setIndex((i) => i + 1);
      setTimeout(() => setTransition(''), 300);
    }
  }, [index, cards, ratings]);

  const goPrev = useCallback(() => {
    if (index > 0) {
      startTimeRef.current = Date.now();
      setTransition('slide-in');
      setIndex((i) => i - 1);
      setTimeout(() => setTransition(''), 300);
    }
  }, [index]);

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

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 24,
          border: '2px solid rgba(0,212,170,0.2)',
          borderTop: '2px solid #00d4aa',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ color: 'rgba(248,248,252,0.4)', fontSize: 14 }}>Loading your feed...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>⚠️</div>
        <div style={{ color: 'rgba(248,248,252,0.55)', marginBottom: 20 }}>{error}</div>
        <button onClick={loadInitial} style={{
          background: '#00d4aa', color: '#0a0a0f', padding: '12px 24px', borderRadius: 10, fontWeight: 700,
        }}>
          Try again
        </button>
      </div>
    );
  }

  if (isLimited && cards.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✨</div>
        <h2 style={{ fontWeight: 700, marginBottom: 12 }}>Daily limit reached</h2>
        <p style={{ color: 'rgba(248,248,252,0.55)', maxWidth: 300, margin: '0 auto' }}>
          You've seen {dailyLimit} cards today. Come back tomorrow for more Ora wisdom.
        </p>
      </div>
    );
  }

  const current = cards[index];
  if (!current) return null;

  const spec: ScreenSpec = current.screen;
  const domain = (spec as any).domain || spec.metadata?.domain;
  const domainColor = domain ? DOMAIN_COLORS[domain] : '#00d4aa';

  // Touch/swipe support
  let touchStartX = 0;
  const handleTouchStart = (e: React.TouchEvent) => { touchStartX = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 50) {
      if (dx < 0) goNext();
      else goPrev();
    }
  };

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 0 80px' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 24px 12px',
        position: 'sticky', top: 0,
        background: 'rgba(10,10,15,0.9)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        zIndex: 10,
      }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 17, letterSpacing: -0.3 }}>◈ Your Feed</div>
          <div style={{ fontSize: 11, color: 'rgba(248,248,252,0.35)', marginTop: 2 }}>
            {screensToday}/{dailyLimit} today · card {index + 1}/{cards.length}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={goPrev} disabled={index === 0} style={{
            background: 'rgba(255,255,255,0.08)',
            color: index === 0 ? 'rgba(248,248,252,0.2)' : '#f8f8fc',
            padding: '8px 12px', borderRadius: 8, fontSize: 16,
          }}>←</button>
          <button onClick={goNext} disabled={index >= cards.length - 1} style={{
            background: index < cards.length - 1 ? '#00d4aa' : 'rgba(255,255,255,0.08)',
            color: index < cards.length - 1 ? '#0a0a0f' : 'rgba(248,248,252,0.2)',
            padding: '8px 12px', borderRadius: 8, fontSize: 16, fontWeight: 700,
          }}>→</button>
        </div>
      </div>

      {/* Keyboard hint */}
      <div style={{ textAlign: 'center', fontSize: 11, color: 'rgba(248,248,252,0.2)', padding: '6px 0 0', letterSpacing: 0.3 }}>
        ← → arrow keys to navigate
      </div>

      {/* Card */}
      <div
        key={current.screen_spec_db_id}
        className={transition}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          margin: '16px 16px 0',
          background: '#12121a',
          borderRadius: 20,
          border: `1px solid ${domainColor}22`,
          boxShadow: `0 4px 40px ${domainColor}10`,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Domain stripe */}
        {domain && (
          <div style={{
            height: 2,
            background: `linear-gradient(90deg, ${domainColor}, transparent)`,
          }} />
        )}

        <div style={{ padding: 24 }}>
          {/* Domain badge */}
          {domain && (
            <div style={{ marginBottom: 12 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                background: domainColor + '18',
                border: `1px solid ${domainColor}44`,
                color: domainColor,
                fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
                padding: '3px 10px', borderRadius: 20,
              }}>
                {domain === 'iVive' ? '🌱' : domain === 'Eviva' ? '🌊' : '✨'} {domain}
              </span>
            </div>
          )}

          {/* Screen type badge */}
          {spec.type && spec.type !== 'standard' && (
            <div style={{
              fontSize: 10, color: 'rgba(248,248,252,0.3)',
              fontWeight: 700, letterSpacing: 1.5,
              textTransform: 'uppercase',
              marginBottom: 14,
            }}>
              {spec.type.replace(/_/g, ' ')}
            </div>
          )}

          {/* Components */}
          {spec.components.map((comp, i) => (
            <OraCard key={i} component={comp} index={i} onAction={(action) => {
              if (action.type === 'next_screen') goNext();
            }} />
          ))}
        </div>

        {/* Star rating */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          padding: '4px 24px 16px',
        }}>
          <StarRating
            onRate={handleRate}
            currentRating={ratings[current.screen_spec_db_id]}
          />
        </div>
      </div>

      {/* Progress dots */}
      {cards.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 16 }}>
          {cards.slice(Math.max(0, index - 3), Math.min(cards.length, index + 4)).map((_, i) => {
            const actualI = i + Math.max(0, index - 3);
            return (
              <div
                key={actualI}
                onClick={() => setIndex(actualI)}
                style={{
                  width: actualI === index ? 20 : 6,
                  height: 6,
                  borderRadius: 3,
                  background: actualI === index ? '#00d4aa' : 'rgba(255,255,255,0.2)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              />
            );
          })}
          {loadingMore && (
            <div style={{
              width: 6, height: 6, borderRadius: 3,
              background: 'rgba(0,212,170,0.4)',
              animation: 'pulse 1s ease-in-out infinite',
            }} />
          )}
        </div>
      )}

      {isLimited && index >= cards.length - 1 && (
        <div style={{
          margin: '24px 16px 0',
          background: 'rgba(0,212,170,0.06)',
          border: '1px solid rgba(0,212,170,0.2)',
          borderRadius: 14,
          padding: 20,
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 24, marginBottom: 10 }}>✨</div>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Daily limit reached</div>
          <div style={{ fontSize: 13, color: 'rgba(248,248,252,0.5)' }}>
            {dailyLimit} cards per day keeps growth focused. See you tomorrow.
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%,100% { opacity: 0.4; } 50% { opacity: 1; } }
      `}</style>
    </div>
  );
}
