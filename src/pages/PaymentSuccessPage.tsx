import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuraClient } from '../lib/AuraClient';
import { useAuth } from '../context/AuthContext';

export default function PaymentSuccessPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { refreshProfile } = useAuth();
  const [message, setMessage] = useState('Confirming your subscription…');

  useEffect(() => {
    let cancelled = false;
    const tier = params.get('tier');

    async function refresh() {
      try {
        // Stripe webhooks are usually immediate, but give them a brief chance to land.
        for (let i = 0; i < 4; i += 1) {
          const sub = await AuraClient.getSubscription();
          if (cancelled) return;
          if (sub.is_paid || (tier && sub.tier === tier)) {
            await refreshProfile();
            setMessage(`You're upgraded to ${sub.tier_name || sub.tier}.`);
            window.setTimeout(() => navigate('/app/profile', { replace: true }), 900);
            return;
          }
          await new Promise((resolve) => window.setTimeout(resolve, 1200));
        }
        await refreshProfile();
        setMessage('Payment received. Aura is still waiting for Stripe confirmation — refresh in a moment if your tier has not updated.');
      } catch {
        setMessage('Payment completed, but Aura could not refresh your subscription yet. Please reopen Profile in a moment.');
      }
    }

    refresh();
    return () => { cancelled = true; };
  }, [navigate, params, refreshProfile]);

  return (
    <div style={{ minHeight: '100%', display: 'grid', placeItems: 'center', padding: 24 }}>
      <div style={{ maxWidth: 420, textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 18, padding: 24, background: 'rgba(255,255,255,0.05)' }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>✦</div>
        <h1 style={{ fontSize: 22, marginBottom: 10 }}>Subscription upgrade</h1>
        <p style={{ color: 'rgba(248,248,252,0.7)', lineHeight: 1.5 }}>{message}</p>
        <button onClick={() => navigate('/app/profile', { replace: true })} style={{ marginTop: 18, border: 0, borderRadius: 999, padding: '11px 18px', fontWeight: 800, background: '#00d4aa', color: '#06110f' }}>
          Back to Profile
        </button>
      </div>
    </div>
  );
}

