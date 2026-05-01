/**
 * UpgradePanel — full-height scrollable glass panel showing all upgrade options.
 * Triggered by the UPGRADE button on Profile.
 * Never navigates away; closes on backdrop click or X.
 */
import React, { useState } from 'react';
import { AuraClient } from '../lib/AuraClient';

interface Props {
  currentTier: string;
  onClose: () => void;
}

const PLANS = [
  {
    id: 'credits',
    name: '3 Path Credits',
    badge: 'ONE-TIME',
    badgeColor: '#fbbf24',
    price: '$9',
    priceSub: 'one-time · no subscription',
    color: '#fbbf24',
    gradient: 'linear-gradient(135deg, rgba(251,191,36,0.08) 0%, rgba(10,10,15,0) 100%)',
    border: 'rgba(251,191,36,0.25)',
    icon: '⚡',
    description: 'Open 3 more paths on your IOO neural graph, whenever you need them.',
    features: [
      '3 extra open paths — use any time',
      'No recurring charge',
      'Credits never expire',
    ],
  },
  {
    id: 'explorer',
    name: 'Explorer',
    badge: 'MOST POPULAR',
    badgeColor: '#818cf8',
    price: '$9',
    priceSub: '/month · cancel any time',
    priceAlt: '$72/yr (2 months free)',
    color: '#818cf8',
    gradient: 'linear-gradient(135deg, rgba(99,102,241,0.10) 0%, rgba(10,10,15,0) 100%)',
    border: 'rgba(99,102,241,0.3)',
    icon: '◈',
    description: 'Expand your neural graph and let Aura go deeper on your path.',
    features: [
      '12 active paths on your IOO graph',
      'Unlimited daily discovery cards',
      'Full Aura chat — no daily cap',
      'Google Drive integration',
      'Personalised local events feed',
      'AI step generation for every goal',
      'Founding member badge (first 1,000)',
    ],
  },
  {
    id: 'sovereign',
    name: 'Sovereign',
    badge: 'FULL POWER',
    badgeColor: '#a78bfa',
    price: '$29',
    priceSub: '/month · cancel any time',
    priceAlt: '$228/yr (2 months free)',
    color: '#a78bfa',
    gradient: 'linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(10,10,15,0) 100%)',
    border: 'rgba(139,92,246,0.35)',
    icon: '✦',
    description: 'Unlimited paths. Aura as your full intelligence layer — proactive, connected, and working on your behalf.',
    features: [
      'Unlimited active paths',
      'Everything in Explorer',
      'Full Google Drive indexing',
      'Aura initiates — proactive nudges & check-ins',
      'API access (build your own integrations)',
      'DAO governance weight ×3',
      'CP multiplier 2×',
      'Direct input into Aura\'s roadmap',
    ],
    fairUse: 'Fair-use: ~500 Aura chat calls/month included.',
  },
];

export function UpgradePanel({ currentTier, onClose }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');

  const handlePlan = async (planId: string) => {
    setLoading(planId);
    setError(null);
    try {
      if (planId === 'credits') {
        const res: any = await AuraClient['client'].post('/api/payments/credits/checkout', {
          success_url: window.location.origin + '/app/profile?credits=granted',
          cancel_url: window.location.origin + '/app/profile',
        }).then((r: any) => r.data);
        window.location.href = res.checkout_url;
      } else {
        const res: any = await AuraClient['client'].post('/api/payments/checkout', {
          tier: planId,
          billing,
          success_url: window.location.origin + '/app/profile?upgrade=' + planId,
          cancel_url: window.location.origin + '/app/profile',
        }).then((r: any) => r.data);
        window.location.href = res.checkout_url;
      }
    } catch (e: any) {
      const msg = e?.response?.data?.detail;
      setError(typeof msg === 'string' ? msg : typeof msg === 'object' ? JSON.stringify(msg) : 'Something went wrong — please try again.');
      setLoading(null);
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'rgba(5,5,10,0.88)', backdropFilter: 'blur(16px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        padding: '0 0 0',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: '100%', maxWidth: 480,
        maxHeight: '92dvh',
        background: 'linear-gradient(180deg, #111118 0%, #0d0d14 100%)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '24px 24px 0 0',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>

        {/* Header */}
        <div style={{
          padding: '20px 20px 0',
          flexShrink: 0,
        }}>
          {/* Drag handle */}
          <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.12)', margin: '0 auto 20px' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <div style={{ fontWeight: 900, fontSize: 22, letterSpacing: -0.5, color: '#f8f8fc' }}>Expand your path</div>
              <div style={{ fontSize: 13, color: 'rgba(248,248,252,0.4)', marginTop: 4 }}>
                {currentTier === 'free' ? 'You\'re on the free tier · 4 active paths' : `You\'re on ${currentTier}`}
              </div>
            </div>
            <button onClick={onClose} style={{
              background: 'rgba(255,255,255,0.07)', border: 'none', color: 'rgba(248,248,252,0.5)',
              width: 32, height: 32, borderRadius: 16, cursor: 'pointer', fontSize: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>✕</button>
          </div>

          {/* Monthly / Yearly toggle — only affects subscription plans */}
          <div style={{
            display: 'inline-flex',
            background: 'rgba(255,255,255,0.06)',
            borderRadius: 20, padding: 3, marginBottom: 20,
          }}>
            {(['monthly', 'yearly'] as const).map((b) => (
              <button key={b} onClick={() => setBilling(b)} style={{
                padding: '6px 18px', borderRadius: 18, border: 'none',
                background: billing === b ? 'rgba(255,255,255,0.12)' : 'transparent',
                color: billing === b ? '#f8f8fc' : 'rgba(248,248,252,0.4)',
                fontWeight: 700, fontSize: 13, cursor: 'pointer',
              }}>
                {b === 'monthly' ? 'Monthly' : 'Yearly  🏷 2 months free'}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable plans */}
        <div style={{ overflowY: 'auto', padding: '0 20px 40px', flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {PLANS.map((plan) => {
            const isCurrentTier = plan.id === currentTier;
            const isLoading = loading === plan.id;
            const displayPrice = plan.id !== 'credits' && billing === 'yearly' && plan.priceAlt
              ? plan.priceAlt
              : `${plan.price}${plan.priceSub}`;

            return (
              <div key={plan.id} style={{
                background: plan.gradient,
                border: `1px solid ${plan.border}`,
                borderRadius: 18, padding: '20px 18px',
                position: 'relative', overflow: 'hidden',
              }}>
                {/* Badge */}
                <div style={{
                  position: 'absolute', top: 14, right: 14,
                  background: `${plan.badgeColor}22`,
                  border: `1px solid ${plan.badgeColor}44`,
                  color: plan.badgeColor,
                  fontSize: 9, fontWeight: 900, letterSpacing: 1.2,
                  padding: '3px 8px', borderRadius: 8,
                }}>{plan.badge}</div>

                {/* Title row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 24 }}>{plan.icon}</span>
                  <div>
                    <div style={{ fontWeight: 900, fontSize: 17, color: '#f8f8fc' }}>{plan.name}</div>
                    <div style={{ fontSize: 12, color: plan.color, fontWeight: 700 }}>
                      {plan.id !== 'credits' && billing === 'yearly' && plan.priceAlt
                        ? plan.priceAlt
                        : `${plan.price} ${plan.priceSub}`}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div style={{ fontSize: 13, color: 'rgba(248,248,252,0.55)', lineHeight: 1.65, marginBottom: 14 }}>
                  {plan.description}
                </div>

                {/* Features */}
                <ul style={{ margin: '0 0 16px', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {plan.features.map((f) => (
                    <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: 'rgba(248,248,252,0.72)' }}>
                      <span style={{ color: plan.color, flexShrink: 0, marginTop: 1 }}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>

                {/* Fair use note */}
                {plan.fairUse && (
                  <div style={{ fontSize: 11, color: 'rgba(248,248,252,0.3)', marginBottom: 12, fontStyle: 'italic' }}>
                    {plan.fairUse}
                  </div>
                )}

                {/* CTA */}
                <button
                  onClick={() => handlePlan(plan.id)}
                  disabled={!!loading || isCurrentTier}
                  style={{
                    width: '100%',
                    padding: '13px 20px',
                    borderRadius: 13,
                    border: 'none',
                    background: isCurrentTier
                      ? 'rgba(255,255,255,0.06)'
                      : `linear-gradient(135deg, ${plan.color}cc, ${plan.color}88)`,
                    color: isCurrentTier ? 'rgba(248,248,252,0.3)' : '#0a0a0f',
                    fontWeight: 900, fontSize: 14,
                    cursor: isCurrentTier ? 'default' : loading ? 'wait' : 'pointer',
                    opacity: loading && !isLoading ? 0.6 : 1,
                    transition: 'opacity 0.2s',
                  }}
                >
                  {isCurrentTier
                    ? 'Current plan'
                    : isLoading
                    ? 'Opening checkout…'
                    : plan.id === 'credits'
                    ? 'Buy 3 path credits →'
                    : `Upgrade to ${plan.name} →`}
                </button>
              </div>
            );
          })}

          {error && (
            <div style={{ fontSize: 13, color: '#ef4444', textAlign: 'center', padding: '4px 0' }}>{error}</div>
          )}
        </div>
      </div>
    </div>
  );
}
