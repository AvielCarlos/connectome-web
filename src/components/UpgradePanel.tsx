/**
 * UpgradePanel — glass upgrade sheet with Stripe checkout and drag-to-dismiss.
 */
import React, { useRef, useState } from 'react';
import { AuraClient } from '../lib/AuraClient';
import { billingCancelUrl, billingSuccessUrl, checkoutReturnUrl } from '../lib/checkoutUrls';

interface Props {
  currentTier: string;
  onClose: () => void;
}

type PlanId = 'credits' | 'explorer' | 'sovereign';
type Billing = 'monthly' | 'yearly';

const PLANS: Array<{
  id: PlanId;
  name: string;
  badge: string;
  badgeColor: string;
  price: string;
  priceSub: string;
  yearlyPrice?: string;
  yearlySub?: string;
  color: string;
  gradient: string;
  border: string;
  icon: string;
  description: string;
  unlocks: string[];
  fairUse?: string;
}> = [
  {
    id: 'credits',
    name: '3 Path Credits',
    badge: 'ONE-TIME',
    badgeColor: '#fbbf24',
    price: '$9',
    priceSub: 'one-time · no subscription',
    color: '#fbbf24',
    gradient: 'linear-gradient(135deg, rgba(251,191,36,0.10) 0%, rgba(10,10,15,0) 100%)',
    border: 'rgba(251,191,36,0.28)',
    icon: '⚡',
    description: 'A simple one-time unlock when you want more active paths without a subscription.',
    unlocks: [
      '3 extra active IOO paths',
      'Use credits whenever you hit the free path limit',
      'No monthly or annual commitment',
      'Keeps your current tier unchanged',
      'Secure Stripe checkout',
    ],
  },
  {
    id: 'explorer',
    name: 'Explorer',
    badge: 'MOST POPULAR',
    badgeColor: '#818cf8',
    price: '$9',
    priceSub: '/month · cancel anytime',
    yearlyPrice: '$72',
    yearlySub: '/year · 2 months free',
    color: '#818cf8',
    gradient: 'linear-gradient(135deg, rgba(99,102,241,0.13) 0%, rgba(10,10,15,0) 100%)',
    border: 'rgba(99,102,241,0.34)',
    icon: '◈',
    description: 'For people actively building their life graph with Aura.',
    unlocks: [
      '12 active IOO paths',
      'Unlimited daily discovery cards',
      'Full Aura chat with higher daily usage',
      'Travel Mode for non-local opportunities',
      'Google Drive connection',
      'Personalised local events feed',
      'AI step generation for goals',
      'WebSpawn personalised surfaces',
      'Founding member badge for early users',
    ],
  },
  {
    id: 'sovereign',
    name: 'Sovereign',
    badge: 'FULL POWER',
    badgeColor: '#a78bfa',
    price: '$29',
    priceSub: '/month · cancel anytime',
    yearlyPrice: '$228',
    yearlySub: '/year · 2 months free',
    color: '#a78bfa',
    gradient: 'linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(10,10,15,0) 100%)',
    border: 'rgba(139,92,246,0.38)',
    icon: '✦',
    description: 'Aura as a deeper intelligence layer — proactive, connected, and working on your behalf.',
    unlocks: [
      'Unlimited active IOO paths',
      'Everything in Explorer',
      'Highest Aura usage tier',
      'Full Google Drive indexing',
      'Proactive Aura nudges and check-ins',
      'Travel Mode and destination discovery',
      'API access for custom integrations',
      'DAO governance weight ×3',
      'CP multiplier 2×',
      'Direct input into Aura roadmap priorities',
    ],
    fairUse: 'Fair-use: about 500 Aura chat calls/month included while we scale capacity.',
  },
];

export function UpgradePanel({ currentTier, onClose }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [billing, setBilling] = useState<Billing>('monthly');
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);

  const handlePlan = async (planId: PlanId) => {
    if (loading || planId === currentTier) return;
    setLoading(planId);
    setError(null);
    try {
      if (planId === 'credits') {
        const res: any = await AuraClient['client'].post('/api/payments/credits/checkout', {
          success_url: checkoutReturnUrl('/app/profile?credits=granted'),
          cancel_url: checkoutReturnUrl('/app/profile?checkout=cancelled'),
        }).then((r: any) => r.data);
        window.location.href = res.checkout_url;
        return;
      }

      const res: any = await AuraClient['client'].post('/api/payments/checkout', {
        tier: planId,
        billing,
        success_url: billingSuccessUrl(planId),
        cancel_url: billingCancelUrl(),
      }).then((r: any) => r.data);
      window.location.href = res.checkout_url;
    } catch (e: any) {
      const msg = e?.response?.data?.detail;
      setError(typeof msg === 'string' ? msg : typeof msg === 'object' ? JSON.stringify(msg) : 'Something went wrong — please try again.');
      setLoading(null);
    }
  };

  const startDrag = (e: React.PointerEvent) => {
    dragStartY.current = e.clientY;
    setIsDragging(true);
    setDragY(0);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const moveDrag = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setDragY(Math.max(0, e.clientY - dragStartY.current));
  };

  const endDrag = () => {
    if (!isDragging) return;
    if (dragY > 90) {
      onClose();
      return;
    }
    setIsDragging(false);
    setDragY(0);
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: `rgba(5,5,10,${Math.max(0.35, 0.88 - dragY / 600)})`,
        backdropFilter: 'blur(16px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: '100%', maxWidth: 480,
        maxHeight: '94dvh',
        background: 'linear-gradient(180deg, #111118 0%, #0d0d14 100%)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '24px 24px 0 0',
        boxShadow: '0 -20px 80px rgba(0,0,0,0.45)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        transform: `translateY(${dragY}px)`,
        transition: isDragging ? 'none' : 'transform 220ms cubic-bezier(.2,.8,.2,1)',
      }}>
        <div
          onPointerDown={startDrag}
          onPointerMove={moveDrag}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          style={{ padding: '12px 20px 0', flexShrink: 0, touchAction: 'none', cursor: 'grab' }}
        >
          <div style={{ width: 44, height: 5, borderRadius: 999, background: 'rgba(255,255,255,0.18)', margin: '0 auto 14px' }} />
        </div>

        <div style={{ padding: '0 20px 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 14 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 950, fontSize: 23, letterSpacing: -0.6, color: '#f8f8fc' }}>Expand your path</div>
              <div style={{ fontSize: 13, color: 'rgba(248,248,252,0.48)', marginTop: 5, lineHeight: 1.45 }}>
                {currentTier === 'free' ? 'Free tier · 4 active paths' : `Current tier · ${currentTier}`}
              </div>
            </div>
            <button type="button" onClick={onClose} aria-label="Close upgrade panel" style={{
              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(248,248,252,0.72)',
              width: 36, height: 36, borderRadius: 18, cursor: 'pointer', fontSize: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>✕</button>
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 18, padding: 3, marginBottom: 14,
          }}>
            {(['monthly', 'yearly'] as const).map((b) => (
              <button key={b} type="button" onClick={() => setBilling(b)} style={{
                padding: '9px 10px', borderRadius: 15, border: 'none',
                background: billing === b ? 'rgba(255,255,255,0.14)' : 'transparent',
                color: billing === b ? '#f8f8fc' : 'rgba(248,248,252,0.5)',
                fontWeight: 850, fontSize: 12, cursor: 'pointer',
              }}>
                {b === 'monthly' ? 'Monthly' : 'Annual · 2 months free'}
              </button>
            ))}
          </div>
        </div>

        <div style={{ overflowY: 'auto', padding: '0 20px calc(env(safe-area-inset-bottom, 0px) + 28px)', flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {PLANS.map((plan) => {
            const isCurrentTier = plan.id === currentTier;
            const isLoading = loading === plan.id;
            const isSubscription = plan.id !== 'credits';
            const price = isSubscription && billing === 'yearly' && plan.yearlyPrice ? plan.yearlyPrice : plan.price;
            const sub = isSubscription && billing === 'yearly' && plan.yearlySub ? plan.yearlySub : plan.priceSub;

            return (
              <section key={plan.id} style={{
                background: plan.gradient,
                border: `1px solid ${plan.border}`,
                borderRadius: 18,
                padding: '18px 16px 16px',
                position: 'relative',
                overflow: 'visible',
              }}>
                <div style={{
                  display: 'inline-flex',
                  background: `${plan.badgeColor}20`,
                  border: `1px solid ${plan.badgeColor}44`,
                  color: plan.badgeColor,
                  fontSize: 9, fontWeight: 950, letterSpacing: 1.1,
                  padding: '4px 8px', borderRadius: 999,
                  marginBottom: 11,
                  maxWidth: '100%',
                }}>{plan.badge}</div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11, marginBottom: 10 }}>
                  <span style={{ fontSize: 25, lineHeight: 1.1, flexShrink: 0 }}>{plan.icon}</span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 950, fontSize: 18, color: '#f8f8fc', lineHeight: 1.2 }}>{plan.name}</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                      <span style={{ fontSize: 20, color: plan.color, fontWeight: 950 }}>{price}</span>
                      <span style={{ fontSize: 12, color: 'rgba(248,248,252,0.58)', fontWeight: 700 }}>{sub}</span>
                    </div>
                  </div>
                </div>

                <p style={{ fontSize: 13, color: 'rgba(248,248,252,0.62)', lineHeight: 1.6, margin: '0 0 13px' }}>
                  {plan.description}
                </p>

                <div style={{ fontSize: 11, fontWeight: 950, letterSpacing: 0.9, color: 'rgba(248,248,252,0.42)', textTransform: 'uppercase', marginBottom: 8 }}>
                  Unlocks
                </div>
                <ul style={{ margin: '0 0 15px', padding: 0, listStyle: 'none', display: 'grid', gap: 7 }}>
                  {plan.unlocks.map((f) => (
                    <li key={f} style={{ display: 'grid', gridTemplateColumns: '18px 1fr', gap: 8, fontSize: 13, lineHeight: 1.45, color: 'rgba(248,248,252,0.78)' }}>
                      <span style={{ color: plan.color, fontWeight: 950, marginTop: -1 }}>✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                {plan.fairUse && (
                  <div style={{ fontSize: 11.5, color: 'rgba(248,248,252,0.42)', marginBottom: 13, lineHeight: 1.45 }}>
                    {plan.fairUse}
                  </div>
                )}

                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handlePlan(plan.id); }}
                  disabled={!!loading || isCurrentTier}
                  style={{
                    width: '100%',
                    padding: '14px 18px',
                    borderRadius: 14,
                    border: `1px solid ${isCurrentTier ? 'rgba(255,255,255,0.09)' : plan.color + '55'}`,
                    background: isCurrentTier
                      ? 'rgba(255,255,255,0.06)'
                      : `linear-gradient(135deg, ${plan.color}, ${plan.color}b8)`,
                    color: isCurrentTier ? 'rgba(248,248,252,0.38)' : '#08080d',
                    fontWeight: 950,
                    fontSize: 14,
                    cursor: isCurrentTier ? 'default' : loading ? 'wait' : 'pointer',
                    opacity: loading && !isLoading ? 0.55 : 1,
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  {isCurrentTier
                    ? 'Current plan'
                    : isLoading
                    ? 'Opening Stripe checkout…'
                    : plan.id === 'credits'
                    ? 'Buy 3 path credits →'
                    : `Choose ${plan.name} ${billing === 'yearly' ? 'annual' : 'monthly'} →`}
                </button>
              </section>
            );
          })}

          {error && (
            <div style={{ fontSize: 13, color: '#ef4444', textAlign: 'center', padding: '4px 0', lineHeight: 1.45 }}>{error}</div>
          )}

          <div style={{ fontSize: 11.5, color: 'rgba(248,248,252,0.36)', textAlign: 'center', lineHeight: 1.45 }}>
            Secure Stripe checkout · Cancel subscriptions anytime · Swipe the handle down to dismiss
          </div>
        </div>
      </div>
    </div>
  );
}
