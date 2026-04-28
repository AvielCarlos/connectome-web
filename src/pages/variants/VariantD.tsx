/**
 * Variant D — "Discovery Grid"
 * 2-column card grid from OraClient.getNextScreenBatch
 */
import React, { useEffect, useState } from 'react';
import { OraClient, ScreenResponse } from '../../lib/OraClient';

const EXPERIMENT_ID = 'primary_landing_v1';
const VARIANT = 'D';

const DOMAIN_COLORS: Record<string, string> = {
  iVive: '#10b981',
  Eviva: '#3b82f6',
  Animus: '#a855f7',
};

function getDomainColor(spec: any): string {
  const d = spec?.metadata?.domain || spec?.domain || '';
  return DOMAIN_COLORS[d] || '#00d4aa';
}

function getTitle(spec: any): string {
  const comps = spec?.components ?? [];
  for (const c of comps) {
    if (c.type === 'heading' && c.text) return c.text;
  }
  return spec?.title || spec?.screen_id || 'Explore';
}

function getCategory(spec: any): string {
  const d = spec?.metadata?.domain;
  if (d) return d;
  const comps = spec?.components ?? [];
  for (const c of comps) {
    if (c.type === 'badge' || c.type === 'tag') return c.text ?? '';
  }
  return 'Discover';
}

// ── Inline detail sheet ────────────────────────────────────────────────────

function DetailSheet({ screen, color, onClose }: { screen: ScreenResponse; color: string; onClose: () => void }) {
  const spec = screen.screen;
  const title = getTitle(spec);
  const comps = spec?.components ?? [];
  const bodyComp = comps.find((c: any) => c.type === 'body' || c.type === 'paragraph' || c.type === 'text');
  const body = bodyComp?.text ?? '';

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'flex-end',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxHeight: '80vh',
          background: '#12121e',
          borderRadius: '24px 24px 0 0',
          border: `1px solid ${color}22`,
          borderBottom: 'none',
          overflowY: 'auto',
          padding: '20px 22px 40px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)' }} />
        </div>
        <div style={{ fontWeight: 800, fontSize: 20, color: '#f8f8fc', marginBottom: 12 }}>{title}</div>
        {body && (
          <div style={{ fontSize: 15, color: 'rgba(248,248,252,0.65)', lineHeight: 1.7 }}>{body}</div>
        )}
        {comps.filter((c: any) => c.type !== 'heading' && c.type !== 'body' && c.type !== 'paragraph' && c.type !== 'text' && c.text).map((c: any, i: number) => (
          <div key={i} style={{ marginTop: 10, fontSize: 14, color: 'rgba(248,248,252,0.55)', lineHeight: 1.6 }}>{c.text}</div>
        ))}
        <button
          onClick={onClose}
          style={{
            marginTop: 24,
            width: '100%',
            padding: '14px',
            background: `${color}22`,
            border: `1px solid ${color}44`,
            borderRadius: 12,
            color,
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}

// ── Mini card ─────────────────────────────────────────────────────────────

function MiniCard({ screen, onClick }: { screen: ScreenResponse; onClick: () => void }) {
  const spec = screen.screen;
  const color = getDomainColor(spec);
  const title = getTitle(spec);
  const category = getCategory(spec);

  return (
    <div
      onClick={onClick}
      style={{
        height: 160,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 14,
        overflow: 'hidden',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.15s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
      onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
    >
      {/* Domain color stripe */}
      <div style={{ height: 3, background: color, flexShrink: 0 }} />

      <div style={{ padding: '10px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {/* Category badge */}
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color,
            background: `${color}18`,
            border: `1px solid ${color}33`,
            borderRadius: 20,
            padding: '2px 8px',
            alignSelf: 'flex-start',
            letterSpacing: 0.3,
            textTransform: 'uppercase',
          }}
        >
          {category}
        </span>

        {/* Title */}
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: '#f8f8fc',
            lineHeight: 1.4,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical' as any,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            flex: 1,
          }}
        >
          {title}
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────

export default function VariantD() {
  const [screens, setScreens] = useState<ScreenResponse[]>([]);
  const [selected, setSelected] = useState<ScreenResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadBatch = async (append = false) => {
    try {
      const batch = await OraClient.getNextScreenBatch(10);
      setScreens((prev) => append ? [...prev, ...batch] : batch);
      OraClient.trackAbEvent(EXPERIMENT_ID, VARIANT, 'batch_loaded', batch.length).catch(() => {});
    } catch {
      // graceful fail
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadBatch(false);
  }, []);

  const handleLoadMore = () => {
    setLoadingMore(true);
    loadBatch(true);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{ fontSize: 32, color: '#00d4aa', animation: 'spin 1.5s linear infinite' }}>◈</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ padding: '16px 12px 80px', background: '#0a0a0f', minHeight: '100vh' }}>
      <div style={{ fontSize: 13, color: 'rgba(248,248,252,0.45)', fontWeight: 600, letterSpacing: 0.5, marginBottom: 14, textAlign: 'center' }}>
        DISCOVER TODAY
      </div>

      {/* 2-column grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
        }}
      >
        {screens.map((s, i) => (
          <MiniCard
            key={s.screen_spec_db_id || i}
            screen={s}
            onClick={() => {
              setSelected(s);
              OraClient.trackAbEvent(EXPERIMENT_ID, VARIANT, 'card_tapped', 1).catch(() => {});
            }}
          />
        ))}
      </div>

      {/* Load more */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
        <button
          onClick={handleLoadMore}
          disabled={loadingMore}
          style={{
            padding: '12px 32px',
            fontSize: 14,
            fontWeight: 600,
            color: '#00d4aa',
            background: 'rgba(0,212,170,0.08)',
            border: '1px solid rgba(0,212,170,0.25)',
            borderRadius: 12,
            cursor: loadingMore ? 'default' : 'pointer',
            opacity: loadingMore ? 0.6 : 1,
          }}
        >
          {loadingMore ? '◈ Loading…' : 'Load more'}
        </button>
      </div>

      {/* Detail sheet */}
      {selected && (
        <DetailSheet
          screen={selected}
          color={getDomainColor(selected.screen)}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
