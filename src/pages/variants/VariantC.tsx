/**
 * Variant C — "Goal Pulse"
 * Shows the user's top active goal with a coaching prompt and quick action buttons.
 */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OraClient, Goal } from '../../lib/OraClient';
import { useAuth } from '../../context/AuthContext';

const EXPERIMENT_ID = 'primary_landing_v1';
const VARIANT = 'C';

const DOMAIN_COLORS: Record<string, string> = {
  iVive: '#10b981',
  Eviva: '#3b82f6',
  Aventi: '#f59e0b',
};

function getDomainColor(domain?: string) {
  return domain ? DOMAIN_COLORS[domain] || '#00d4aa' : '#00d4aa';
}

const INTENSITY_COLORS: Record<string, string> = {
  light: '#3b82f6',
  medium: '#f59e0b',
  challenging: '#f97316',
};

export default function VariantC() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(true);

  const intensity: string =
    (profile as any)?.context_hints?.recommended_intensity || 'medium';
  const intensityColor = INTENSITY_COLORS[intensity] || INTENSITY_COLORS.medium;

  useEffect(() => {
    OraClient.listGoals('active')
      .then((goals) => {
        setGoal(goals.length > 0 ? goals[0] : null);
      })
      .catch(() => setGoal(null))
      .finally(() => setLoading(false));
  }, []);

  const trackAndNavigate = (eventType: string, path: string) => {
    OraClient.trackAbEvent(EXPERIMENT_ID, VARIANT, eventType, 1).catch(() => {});
    if (path === '/feed') sessionStorage.setItem('ab_skip', '1');
    navigate(path);
  };

  const progress = goal ? Math.round((goal.progress ?? 0) * 100) : 0;
  const color = getDomainColor(goal?.domain);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{ fontSize: 32, color: '#00d4aa' }}>◈</div>
      </div>
    );
  }

  if (!goal) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px 24px',
          gap: 24,
          textAlign: 'center',
          background: '#0a0a0f',
        }}
      >
        <div style={{ fontSize: 48, lineHeight: 1 }}>🎯</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#f8f8fc' }}>No goals yet</div>
        <div style={{ fontSize: 15, color: 'rgba(248,248,252,0.6)', maxWidth: 280, lineHeight: 1.6 }}>
          Set your first goal and let Ora help you achieve it step by step.
        </div>
        <button
          onClick={() => trackAndNavigate('set_first_goal', '/goals')}
          style={{
            padding: '14px 36px',
            fontSize: 16,
            fontWeight: 700,
            color: '#0a0a0f',
            background: 'linear-gradient(135deg, #00d4aa, #00b894)',
            border: 'none',
            borderRadius: 14,
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(0,212,170,0.3)',
          }}
        >
          Set your first goal →
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 20px',
        gap: 20,
        background: '#0a0a0f',
      }}
    >
      <div style={{ fontSize: 13, color: 'rgba(248,248,252,0.45)', fontWeight: 600, letterSpacing: 0.5 }}>
        YOUR FOCUS TODAY
      </div>

      {/* Top goal card */}
      <div
        style={{
          width: '100%',
          maxWidth: 380,
          background: 'rgba(255,255,255,0.04)',
          border: `1px solid ${color}33`,
          borderRadius: 18,
          padding: '20px 20px 16px',
          boxShadow: `0 4px 24px ${color}18`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
          <div style={{ fontSize: 17, fontWeight: 700, color: '#f8f8fc', lineHeight: 1.3 }}>
            {goal.title}
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ marginTop: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: 'rgba(248,248,252,0.5)' }}>Progress</span>
            <span style={{ fontSize: 12, fontWeight: 700, color }}>
              {progress}%
            </span>
          </div>
          <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${progress}%`,
                background: `linear-gradient(90deg, ${color}, ${color}cc)`,
                borderRadius: 3,
                transition: 'width 0.8s ease',
              }}
            />
          </div>
        </div>
      </div>

      {/* Intensity badge */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 14px',
          borderRadius: 20,
          background: `${intensityColor}18`,
          border: `1px solid ${intensityColor}44`,
          fontSize: 12,
          fontWeight: 700,
          color: intensityColor,
          alignSelf: 'center',
        }}
      >
        Today: {intensity} intensity
      </div>

      {/* Ora coaching bubble */}
      <div
        style={{
          width: '100%',
          maxWidth: 380,
          background: 'rgba(0,212,170,0.07)',
          border: '1px solid rgba(0,212,170,0.2)',
          borderRadius: 16,
          padding: '16px 18px',
          display: 'flex',
          gap: 12,
          alignItems: 'flex-start',
        }}
      >
        <div style={{ fontSize: 22, flexShrink: 0 }}>◈</div>
        <div style={{ fontSize: 14, color: 'rgba(248,248,252,0.75)', lineHeight: 1.6 }}>
          What's one step you can take today toward{' '}
          <span style={{ color: '#00d4aa', fontWeight: 600 }}>{goal.title}</span>?
        </div>
      </div>

      {/* Quick action buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 380 }}>
        <button
          onClick={() => trackAndNavigate('goal_engaged', '/goals')}
          style={btnStyle(color)}
        >
          📊 Log progress
        </button>
        <button
          onClick={() => trackAndNavigate('goal_engaged', '/ora')}
          style={btnStyle('#a855f7')}
        >
          💬 Ask Ora
        </button>
        <button
          onClick={() => trackAndNavigate('feed_opened', '/feed')}
          style={{ ...btnStyle('rgba(255,255,255,0.12)'), color: 'rgba(248,248,252,0.7)' }}
        >
          📰 See Feed
        </button>
      </div>
    </div>
  );
}

function btnStyle(bg: string): React.CSSProperties {
  return {
    padding: '14px 20px',
    fontSize: 15,
    fontWeight: 600,
    color: '#0a0a0f',
    background: bg,
    border: 'none',
    borderRadius: 12,
    cursor: 'pointer',
    textAlign: 'left' as const,
    transition: 'opacity 0.15s',
  };
}
