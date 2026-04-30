/**
 * Variant B — "Morning Brief"
 * Full-screen Ora greeting with a personalized welcome and CTA to enter the feed.
 */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OraClient } from '../../lib/OraClient';
import { useAuth } from '../../context/AuthContext';

const EXPERIMENT_ID = 'primary_landing_v1';
const VARIANT = 'B';

const QUOTES = [
  'The greatest investment you can make is in yourself.',
  'Small daily improvements lead to stunning results.',
  'What you focus on expands. Focus on what matters.',
  'You are the architect of your own becoming.',
  'Progress, not perfection, is the goal.',
  'Every expert was once a beginner. Keep going.',
];

function getGreeting(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'Good morning';
  if (h >= 12 && h < 17) return 'Good afternoon';
  if (h >= 17 && h < 22) return 'Good evening';
  return 'Good night';
}

function getQuote(): string {
  const idx = new Date().getDay() % QUOTES.length;
  return QUOTES[idx];
}

export default function VariantB() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [topGoal, setTopGoal] = useState<string | null>(null);

  const topics: string[] = (profile as any)?.twitter_topics || [];

  useEffect(() => {
    OraClient.listGoals('active')
      .then((goals) => {
        if (goals.length > 0) setTopGoal(goals[0].title);
      })
      .catch(() => {});
  }, []);

  const handleCTA = () => {
    OraClient.trackAbEvent(EXPERIMENT_ID, VARIANT, 'cta_tapped', 1).catch(() => {});
    sessionStorage.setItem('ab_skip', '1');
    navigate('/app/ido');
  };

  return (
    <div
      style={{
        minHeight: 'var(--visual-viewport-height, 100dvh)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse at 50% 30%, #0d1a2b 0%, #0a0a0f 70%)',
        padding: '32px 24px',
        gap: 28,
        textAlign: 'center',
      }}
    >
      {/* Greeting */}
      <div style={{ fontSize: 22, fontWeight: 700, color: '#f8f8fc', letterSpacing: '-0.5px' }}>
        {getGreeting()}
      </div>

      {/* Personalised topics line */}
      {topics.length >= 2 && (
        <div
          style={{
            fontSize: 13,
            color: 'rgba(248,248,252,0.5)',
            maxWidth: 320,
            lineHeight: 1.5,
          }}
        >
          Based on your interest in{' '}
          <span style={{ color: '#00d4aa' }}>{topics[0]}</span> and{' '}
          <span style={{ color: '#00d4aa' }}>{topics[1]}</span>
        </div>
      )}

      {/* Ora glyph with glow */}
      <div
        style={{
          fontSize: 72,
          color: '#00d4aa',
          filter: 'drop-shadow(0 0 24px #00d4aa88)',
          animation: 'glowPulse 3s ease-in-out infinite',
          lineHeight: 1,
        }}
      >
        ◈
      </div>

      {/* Personalized line */}
      {topGoal && (
        <div
          style={{
            fontSize: 15,
            color: 'rgba(248,248,252,0.65)',
            maxWidth: 320,
            lineHeight: 1.6,
          }}
        >
          Your focus:{' '}
          <span style={{ color: '#00d4aa', fontWeight: 600 }}>{topGoal}</span>
        </div>
      )}

      {/* World signal card */}
      <div
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(0,212,170,0.18)',
          borderRadius: 16,
          padding: '18px 22px',
          maxWidth: 340,
          width: '100%',
        }}
      >
        <div style={{ fontSize: 11, color: '#00d4aa', fontWeight: 700, letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' }}>
          🌐 World Signal
        </div>
        <div style={{ fontSize: 15, color: 'rgba(248,248,252,0.8)', lineHeight: 1.6, fontStyle: 'italic' }}>
          "{getQuote()}"
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={handleCTA}
        style={{
          marginTop: 8,
          padding: '16px 40px',
          fontSize: 17,
          fontWeight: 700,
          color: '#0a0a0f',
          background: 'linear-gradient(135deg, #00d4aa, #00b894)',
          border: 'none',
          borderRadius: 14,
          cursor: 'pointer',
          letterSpacing: '-0.3px',
          boxShadow: '0 4px 24px rgba(0,212,170,0.35)',
          transition: 'transform 0.15s, box-shadow 0.15s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
      >
        Enter the Feed →
      </button>

      <style>{`
        @keyframes glowPulse {
          0%, 100% { filter: drop-shadow(0 0 18px #00d4aa66); }
          50% { filter: drop-shadow(0 0 36px #00d4aacc); }
        }
      `}</style>
    </div>
  );
}
