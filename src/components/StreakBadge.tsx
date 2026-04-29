/**
 * StreakBadge — Duolingo-inspired streak display.
 *
 * Shows current streak with animated flame.
 * Pulses red when "at risk" (user hasn't checked in today).
 * Keeps progress signals soft and non-score-like.
 */
import React, { useEffect, useState } from 'react';
import { OraClient } from '../lib/OraClient';

interface StreakData {
  streak: {
    current: number;
    longest: number;
    at_risk: boolean;
    last_activity: string | null;
  };
  xp: {
    total: number;
    next_milestone: number | null;
    progress_to_next: number;
  };
  badges: Array<{ key: string; name: string; emoji: string; earned_at: string }>;
  collections_count: number;
}

export function StreakBadge({ compact = false }: { compact?: boolean }) {
  const [data, setData] = useState<StreakData | null>(null);
  const [newBadge, setNewBadge] = useState<{ emoji: string; name: string } | null>(null);

  useEffect(() => {
    fetchStatus();
    // Check in on mount for backend progress/personalization signals.
    doCheckin();
  }, []);

  const fetchStatus = async () => {
    try {
      const data = await OraClient.get<StreakData>('/api/gamification/status');
      setData(data);
    } catch {
      // Non-critical
    }
  };

  const doCheckin = async () => {
    try {
      const result = await OraClient.post<any>('/api/gamification/checkin', { reason: 'daily_login' });

      if (result.new_badges?.length > 0) {
        setNewBadge(result.new_badges[0]);
        setTimeout(() => setNewBadge(null), 3500);
      }

      // Refresh status after checkin
      fetchStatus();
    } catch {
      // Non-critical
    }
  };

  if (!data) return null;

  const { streak, xp } = data;

  if (compact) {
    return (
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        background: streak.at_risk
          ? 'rgba(239,68,68,0.12)'
          : streak.current > 0
            ? 'rgba(251,146,60,0.12)'
            : 'rgba(255,255,255,0.06)',
        border: `1px solid ${streak.at_risk ? 'rgba(239,68,68,0.3)' : streak.current > 0 ? 'rgba(251,146,60,0.3)' : 'rgba(255,255,255,0.1)'}`,
        borderRadius: 20,
        padding: '4px 10px',
        fontSize: 13,
        fontWeight: 700,
        color: streak.at_risk ? '#ef4444' : streak.current > 0 ? '#fb923c' : 'rgba(248,248,252,0.4)',
        position: 'relative',
        overflow: 'visible',
        cursor: 'default',
        ...(streak.at_risk ? { animationName: 'atRiskPulse', animationDuration: '1.5s', animationTimingFunction: 'ease-in-out', animationIterationCount: 'infinite' } : {}),
      }}>
        <span className={streak.current >= 3 ? 'streak-flame' : ''} style={{ fontSize: 14 }}>
          {streak.at_risk ? '⚠️' : streak.current > 0 ? '🔥' : '○'}
        </span>
        <span>{streak.current}</span>

      </div>
    );
  }

  // Full badge (used in profile)
  const progressPct = Math.min(1, xp.progress_to_next) * 100;

  return (
    <div style={{ position: 'relative' }}>
      {/* New badge modal */}
      {newBadge && (
        <div style={{
          position: 'fixed',
          bottom: 100,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(18,18,30,0.97)',
          border: '1px solid rgba(0,212,170,0.4)',
          borderRadius: 20,
          padding: '18px 24px',
          textAlign: 'center',
          zIndex: 999,
          backdropFilter: 'blur(20px)',
          boxShadow: '0 8px 40px rgba(0,212,170,0.2)',
        }}>
          <div className="badge-earn" style={{ fontSize: 40, marginBottom: 8 }}>{newBadge.emoji}</div>
          <div style={{ fontWeight: 800, fontSize: 15, color: '#f8f8fc' }}>Badge Earned!</div>
          <div style={{ fontSize: 13, color: '#00d4aa', marginTop: 4 }}>{newBadge.name}</div>
        </div>
      )}

      <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 20,
        padding: '20px',
      }}>
        {/* Streak row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 18,
            background: streak.at_risk ? 'rgba(239,68,68,0.12)' : 'rgba(251,146,60,0.12)',
            border: `2px solid ${streak.at_risk ? 'rgba(239,68,68,0.4)' : 'rgba(251,146,60,0.4)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28,
            ...(streak.at_risk ? { animation: 'atRiskPulse 1.5s ease-in-out infinite' } : {}),
          }}>
            <span className={streak.current >= 3 ? 'streak-flame' : ''}>
              {streak.at_risk ? '⚠️' : streak.current > 0 ? '🔥' : '○'}
            </span>
          </div>
          <div>
            <div style={{ fontSize: 28, fontWeight: 900, color: streak.at_risk ? '#ef4444' : streak.current > 0 ? '#fb923c' : 'rgba(248,248,252,0.3)', lineHeight: 1 }}>
              {streak.current}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(248,248,252,0.4)', fontWeight: 600, marginTop: 3 }}>
              {streak.at_risk
                ? 'Streak at risk! Come back today'
                : streak.current === 1
                  ? 'day streak — keep going!'
                  : `day streak${streak.longest > streak.current ? ` · best: ${streak.longest}` : ''}`}
            </div>
          </div>

        </div>

        {/* Soft milestone progress */}
        {xp.next_milestone && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(248,248,252,0.3)', marginBottom: 6, fontWeight: 600 }}>
              <span>Milestone progress</span>
              <span>{Math.round(progressPct)}%</span>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${progressPct}%`, background: 'linear-gradient(90deg, #00d4aa, #6366f1)' }}
              />
            </div>
          </div>
        )}

        {/* Badges */}
        {data.badges.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(248,248,252,0.3)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>
              Badges
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {data.badges.map((badge) => (
                <div
                  key={badge.key}
                  title={badge.name}
                  style={{
                    width: 40, height: 40, borderRadius: 12,
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 20, cursor: 'default',
                    transition: 'transform 0.15s',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.15)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
                >
                  {badge.emoji}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
