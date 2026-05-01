/**
 * PathLimitSheet — shown inline (as an IOO node sheet) when the user hits
 * the 4-active-path free-tier limit. Never navigates away; stays in context.
 *
 * Three upgrade paths:
 *   1. Archive a path (free)
 *   2. Buy 5 credits — $9 one-time, no commitment
 *   3. Subscribe to Explorer (12 paths) or Sovereign (unlimited)
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuraClient } from '../lib/AuraClient';

interface Props {
  activePaths: number;
  pathLimit: number;
  pathCredits?: number;
  onClose: () => void;
  onArchive?: () => void;
}

export function PathLimitSheet({ activePaths, pathLimit, pathCredits = 0, onClose, onArchive }: Props) {
  const navigate = useNavigate();
  const [buying, setBuying] = useState(false);
  const [subscribing, setSubscribing] = useState<'explorer' | 'sovereign' | null>(null);

  const handleBuyCredits = async () => {
    setBuying(true);
    try {
      const res: any = await AuraClient['client'].post('/api/payments/credits/checkout', {
        success_url: window.location.origin + '/app/goals?credits=granted',
        cancel_url: window.location.origin + '/app/goals',
      }).then((r: any) => r.data);
      window.location.href = res.checkout_url;
    } catch {
      setBuying(false);
    }
  };

  const handleSubscribe = async (tier: 'explorer' | 'sovereign') => {
    setSubscribing(tier);
    try {
      const res: any = await AuraClient['client'].post('/api/payments/checkout', {
        tier,
        billing: 'monthly',
        success_url: window.location.origin + '/app/goals?upgrade=' + tier,
        cancel_url: window.location.origin + '/app/goals',
      }).then((r: any) => r.data);
      window.location.href = res.checkout_url;
    } catch {
      setSubscribing(null);
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(10,10,15,0.85)', backdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: '100%', maxWidth: 480,
        background: 'linear-gradient(160deg, #0f0f1a 0%, #141420 100%)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '24px 24px 0 0',
        padding: '32px 24px 40px',
        display: 'flex', flexDirection: 'column', gap: 20,
      }}>
        {/* Handle */}
        <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)', margin: '0 auto -8px' }} />

        {/* Icon + title */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>◈</div>
          <div style={{ fontWeight: 900, fontSize: 20, color: '#f8f8fc', letterSpacing: -0.4 }}>
            {activePaths} of {pathLimit} paths open
          </div>
          <div style={{ fontSize: 14, color: 'rgba(248,248,252,0.45)', marginTop: 8, lineHeight: 1.6 }}>
            Your neural graph supports {pathLimit} active paths on the free tier.
            Complete or archive one to open a new direction — or subscribe to unlock unlimited paths.
          </div>
        </div>

        {/* Path slots visual */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', margin: '4px 0' }}>
          {Array.from({ length: pathLimit }).map((_, i) => (
            <div
              key={i}
              style={{
                width: 44, height: 8, borderRadius: 4,
                background: i < activePaths
                  ? 'linear-gradient(90deg, #00d4aa, #00b896)'
                  : 'rgba(255,255,255,0.1)',
                transition: 'background 0.3s',
              }}
            />
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Free option */}
          {onArchive && (
            <button onClick={onArchive} style={{
              background: 'rgba(0,212,170,0.10)', border: '1px solid rgba(0,212,170,0.3)',
              color: '#00d4aa', padding: '14px 20px', borderRadius: 14,
              fontWeight: 800, fontSize: 15, cursor: 'pointer',
            }}>
              Archive a path to make room →
            </button>
          )}

          {/* Credits — one-time, no commitment */}
          <button onClick={handleBuyCredits} disabled={buying} style={{
            background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.35)',
            color: '#fbbf24', padding: '14px 20px', borderRadius: 14,
            fontWeight: 800, fontSize: 15, cursor: buying ? 'wait' : 'pointer', opacity: buying ? 0.7 : 1,
          }}>
            {buying ? 'Opening checkout…' : '5 extra paths — $9 one-time ☆'}
          </button>

          {/* Subscription tiers */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => handleSubscribe('explorer')} disabled={!!subscribing} style={{
              flex: 1, background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.35)',
              color: '#a78bfa', padding: '13px 12px', borderRadius: 14,
              fontWeight: 800, fontSize: 13, cursor: subscribing ? 'wait' : 'pointer', opacity: subscribing ? 0.7 : 1,
            }}>
              {subscribing === 'explorer' ? '…' : 'Explorer\n12 paths — $9/mo'}
            </button>
            <button onClick={() => handleSubscribe('sovereign')} disabled={!!subscribing} style={{
              flex: 1, background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(109,40,217,0.2))',
              border: '1px solid rgba(139,92,246,0.5)',
              color: '#c4b5fd', padding: '13px 12px', borderRadius: 14,
              fontWeight: 800, fontSize: 13, cursor: subscribing ? 'wait' : 'pointer', opacity: subscribing ? 0.7 : 1,
            }}>
              {subscribing === 'sovereign' ? '…' : 'Sovereign\nUnlimited — $29/mo'}
            </button>
          </div>

          <button onClick={onClose} style={{
            background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(248,248,252,0.35)', padding: '12px 20px', borderRadius: 14,
            fontWeight: 600, fontSize: 13, cursor: 'pointer',
          }}>
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
