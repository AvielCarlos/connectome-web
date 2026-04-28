/**
 * LandingRouter — routes to the assigned A/B variant for the primary landing experience.
 * Variant assignment is cached in localStorage for 7 days.
 * Override: ?variant=B  |  Force feed: sessionStorage.ab_skip = '1'
 */
import React, { useEffect, useRef, useState } from 'react';
import { OraClient } from '../lib/OraClient';
import VariantA from './variants/VariantA';
import VariantB from './variants/VariantB';
import VariantC from './variants/VariantC';
import VariantD from './variants/VariantD';

const EXPERIMENT_ID = 'primary_landing_v1';
const VALID_VARIANTS = ['A', 'B', 'C', 'D'] as const;
type Variant = typeof VALID_VARIANTS[number];

// ── Admin badge ───────────────────────────────────────────────────────────

function AdminBadge({
  variant,
  onSwitch,
  experimentId,
}: {
  variant: Variant;
  onSwitch: (v: Variant) => void;
  experimentId: string;
}) {
  const cycle = () => {
    const next = VALID_VARIANTS[(VALID_VARIANTS.indexOf(variant) + 1) % VALID_VARIANTS.length];
    localStorage.setItem(`ab_variant_${experimentId}`, next);
    localStorage.setItem(`ab_variant_ts_${experimentId}`, Date.now().toString());
    onSwitch(next);
  };

  return (
    <div
      onClick={cycle}
      title="A/B Admin — tap to cycle variant"
      style={{
        position: 'fixed',
        bottom: 80,
        left: 12,
        zIndex: 9999,
        background: 'rgba(0,0,0,0.75)',
        border: '1px solid rgba(255,255,255,0.2)',
        borderRadius: 10,
        padding: '6px 12px',
        color: '#00d4aa',
        fontSize: 13,
        fontWeight: 700,
        cursor: 'pointer',
        userSelect: 'none',
        backdropFilter: 'blur(8px)',
        letterSpacing: 0.5,
      }}
    >
      A/B: {variant}
    </div>
  );
}

// ── Variant renderer ──────────────────────────────────────────────────────

function renderVariant(v: Variant): React.ReactElement {
  switch (v) {
    case 'B': return <VariantB />;
    case 'C': return <VariantC />;
    case 'D': return <VariantD />;
    default:  return <VariantA />;
  }
}

// ── Router ────────────────────────────────────────────────────────────────

export default function LandingRouter() {
  const [variant, setVariant] = useState<Variant | null>(null);
  const sessionStart = useRef(Date.now());

  useEffect(() => {
    // 1. Skip flag (set by variants B/C CTA buttons)
    if (sessionStorage.getItem('ab_skip')) {
      sessionStorage.removeItem('ab_skip');
      setVariant('A');
      return;
    }

    // 2. URL override
    const urlVariant = new URLSearchParams(window.location.search).get('variant');
    if (urlVariant && (VALID_VARIANTS as readonly string[]).includes(urlVariant)) {
      setVariant(urlVariant as Variant);
      return;
    }

    // 3. localStorage cache (7 days)
    const cached = localStorage.getItem(`ab_variant_${EXPERIMENT_ID}`);
    const cachedTs = localStorage.getItem(`ab_variant_ts_${EXPERIMENT_ID}`);
    if (cached && cachedTs && Date.now() - parseInt(cachedTs) < 7 * 86400000) {
      if ((VALID_VARIANTS as readonly string[]).includes(cached)) {
        setVariant(cached as Variant);
        return;
      }
    }

    // 4. Check server-side winner first, then fall back to API assignment
    OraClient.getAbWinner(EXPERIMENT_ID)
      .then((winner) => {
        if (winner && (VALID_VARIANTS as readonly string[]).includes(winner)) {
          // Server has promoted a winner — use it unconditionally
          const winnerV = winner as Variant;
          localStorage.setItem(`ab_variant_${EXPERIMENT_ID}`, winnerV);
          localStorage.setItem(`ab_variant_ts_${EXPERIMENT_ID}`, Date.now().toString());
          setVariant(winnerV);
          OraClient.trackAbEvent(EXPERIMENT_ID, winnerV, 'session_start', 1).catch(() => {});
          return;
        }
        // No server winner — fall back to random API assignment
        return OraClient.assignAbVariant(EXPERIMENT_ID).then((v) => {
          const safeV = (VALID_VARIANTS as readonly string[]).includes(v) ? (v as Variant) : 'A';
          localStorage.setItem(`ab_variant_${EXPERIMENT_ID}`, safeV);
          localStorage.setItem(`ab_variant_ts_${EXPERIMENT_ID}`, Date.now().toString());
          setVariant(safeV);
          OraClient.trackAbEvent(EXPERIMENT_ID, safeV, 'session_start', 1).catch(() => {});
        });
      })
      .catch(() =>
        OraClient.assignAbVariant(EXPERIMENT_ID)
          .then((v) => {
            const safeV = (VALID_VARIANTS as readonly string[]).includes(v) ? (v as Variant) : 'A';
            localStorage.setItem(`ab_variant_${EXPERIMENT_ID}`, safeV);
            localStorage.setItem(`ab_variant_ts_${EXPERIMENT_ID}`, Date.now().toString());
            setVariant(safeV);
            OraClient.trackAbEvent(EXPERIMENT_ID, safeV, 'session_start', 1).catch(() => {});
          })
          .catch(() => setVariant('A'))
      );
  }, []);

  // Track session duration on unmount
  useEffect(() => {
    if (!variant) return;
    const start = sessionStart.current;
    return () => {
      OraClient.trackAbEvent(
        EXPERIMENT_ID,
        variant,
        'session_duration_ms',
        Date.now() - start,
      ).catch(() => {});
    };
  }, [variant]);

  if (!variant) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div style={{ fontSize: 32, color: '#00d4aa' }}>◈</div>
      </div>
    );
  }

  // Auto-detect admin from profile (is_admin in profile JSON)
  useEffect(() => {
    OraClient.getProfile().then((p: any) => {
      if (p?.profile?.is_admin) {
        localStorage.setItem('ab_admin', 'true');
      }
    }).catch(() => {});
  }, []);

  const isAdmin = localStorage.getItem('ab_admin') === 'true';

  return (
    <>
      {renderVariant(variant)}
      {isAdmin && (
        <AdminBadge
          variant={variant}
          onSwitch={setVariant}
          experimentId={EXPERIMENT_ID}
        />
      )}
    </>
  );
}
