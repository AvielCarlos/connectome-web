import React from 'react';

const ACCENT = '#00d4aa';

/** Props for the shared high-impact page introduction block. */
export type PageHeroProps = {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  children?: React.ReactNode;
  align?: 'left' | 'center';
  maxWidth?: number;
  style?: React.CSSProperties;
};

/** Shared hero treatment for marketing, app, and contribution pages. */
export function PageHero({ eyebrow, title, children, align = 'center', maxWidth = 760, style }: PageHeroProps) {
  return (
    <section style={{ textAlign: align, marginBottom: 30, ...style }}>
      {eyebrow && (
        <div style={{ display: 'inline-flex', border: '1px solid rgba(0,212,170,0.28)', background: 'rgba(0,212,170,0.08)', color: ACCENT, borderRadius: 999, padding: '7px 12px', fontSize: 12, fontWeight: 900, letterSpacing: 0.9, textTransform: 'uppercase', marginBottom: 16 }}>
          {eyebrow}
        </div>
      )}
      <h1 style={{ fontSize: 'clamp(36px, 7vw, 70px)', lineHeight: 0.98, letterSpacing: -2.2, margin: '0 0 16px', fontWeight: 950 }}>{title}</h1>
      {children && <div style={{ margin: align === 'center' ? '0 auto' : 0, maxWidth, color: 'rgba(248,248,252,0.62)', fontSize: 17, lineHeight: 1.65 }}>{children}</div>}
    </section>
  );
}

/** Props for the shared elevated panel/card container. */
export type SectionCardProps = React.PropsWithChildren<{
  as?: 'section' | 'div' | 'article';
  accent?: boolean;
  padding?: number;
  style?: React.CSSProperties;
  className?: string;
  ariaLabel?: string;
}>;

/** Reusable Connectome dark glass section card. */
export function SectionCard({ as = 'section', accent = false, padding = 24, style, className, ariaLabel, children }: SectionCardProps) {
  const Component = as;
  return (
    <Component
      className={className}
      aria-label={ariaLabel}
      style={{
        background: 'linear-gradient(180deg, rgba(18,18,26,0.96), rgba(12,12,18,0.96))',
        border: accent ? '1px solid rgba(0,212,170,0.18)' : '1px solid rgba(255,255,255,0.08)',
        borderRadius: 22,
        boxShadow: '0 18px 60px rgba(0,0,0,0.24)',
        padding,
        ...style,
      }}
    >
      {children}
    </Component>
  );
}

/** Props for a reusable primary CTA that can render as a link or button. */
export type PrimaryCTAProps = React.PropsWithChildren<{
  href?: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  target?: string;
  rel?: string;
  style?: React.CSSProperties;
  type?: 'button' | 'submit';
}>;

/** Shared pill CTA for Aura/Connectome actions. */
export function PrimaryCTA({ href, onClick, variant = 'primary', target, rel, style, type = 'button', children }: PrimaryCTAProps) {
  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: variant === 'primary' ? ACCENT : 'rgba(255,255,255,0.07)',
    color: variant === 'primary' ? '#06100e' : '#f8f8fc',
    border: variant === 'primary' ? 'none' : '1px solid rgba(255,255,255,0.12)',
    borderRadius: 999,
    padding: '10px 14px',
    fontWeight: variant === 'primary' ? 950 : 850,
    textDecoration: 'none',
    cursor: 'pointer',
    ...style,
  };

  if (href) {
    return <a href={href} target={target} rel={rel} style={baseStyle}>{children}</a>;
  }

  return <button type={type} onClick={onClick} style={baseStyle}>{children}</button>;
}
