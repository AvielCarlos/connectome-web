import React from 'react';

export type AuraRecommendationDomain = 'iVive' | 'Eviva' | 'Aventi' | 'Rest' | string;

export type AuraRecommendation = {
  eyebrow: string;
  title: string;
  body: string;
  cta?: string;
  domain?: AuraRecommendationDomain;
  evidenceHint?: string;
};

const DOMAIN_CONFIG: Record<string, { emoji: string; color: string; label: string }> = {
  iVive: { emoji: '🌱', color: '#10b981', label: 'Self / capacity' },
  Eviva: { emoji: '🌊', color: '#6366f1', label: 'Contribution' },
  Aventi: { emoji: '🚀', color: '#f59e0b', label: 'Experience' },
};

function domainConfig(domain?: AuraRecommendationDomain) {
  const normalized = domain === 'Rest' ? 'iVive' : domain;
  return DOMAIN_CONFIG[normalized || ''] || { emoji: '◈', color: '#00d4aa', label: 'Path' };
}

export function AuraRecommendationStrip({
  recommendation,
  onAction,
  actionLabel,
}: {
  recommendation: AuraRecommendation;
  onAction?: () => void;
  actionLabel?: string;
}) {
  const cfg = domainConfig(recommendation.domain);
  const cta = actionLabel || recommendation.cta;

  return (
    <section style={{ position: 'relative', overflow: 'hidden', border: `1px solid ${cfg.color}24`, background: 'linear-gradient(135deg, rgba(255,255,255,0.055), rgba(0,212,170,0.045))', borderRadius: 26, padding: 16, margin: '0 0 16px' }}>
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 12% 0%, ${cfg.color}1f, transparent 42%)`, pointerEvents: 'none' }} />
      <div style={{ position: 'relative', display: 'grid', gap: 12 }}>
        <div>
          <div style={{ color: cfg.color, fontSize: 11, fontWeight: 950, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 7 }}>{cfg.emoji} {recommendation.eyebrow}</div>
          <h2 style={{ color: '#f8f8fc', fontSize: 20, letterSpacing: -0.55, lineHeight: 1.15, margin: 0 }}>{recommendation.title}</h2>
          <p style={{ color: 'rgba(248,248,252,0.62)', fontSize: 13, lineHeight: 1.55, margin: '8px 0 0' }}>{recommendation.body}</p>
          {recommendation.evidenceHint && (
            <div style={{ color: 'rgba(248,248,252,0.42)', fontSize: 11, lineHeight: 1.45, marginTop: 8 }}>{recommendation.evidenceHint}</div>
          )}
        </div>
        {cta && onAction && (
          <button onClick={onAction} style={{ justifySelf: 'start', border: `1px solid ${cfg.color}40`, background: `${cfg.color}18`, color: '#dffcf6', borderRadius: 999, padding: '10px 13px', fontSize: 12, fontWeight: 950, cursor: 'pointer' }}>
            {cta} →
          </button>
        )}
      </div>
    </section>
  );
}
