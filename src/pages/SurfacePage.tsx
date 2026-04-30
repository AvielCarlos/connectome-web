/**
 * SurfacePage — Aura's generative web surface renderer.
 *
 * Loads the surface spec from /api/surfaces/:surfaceId/data and renders it
 * dynamically. Aura freely designs any layout; this renderer supports the full
 * section vocabulary she generates.
 *
 * Sections:  header | metric | progress | checklist | countdown |
 *            steps  | text   | links    | chart_bar | chart_line |
 *            table  | kanban | calculator | form
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { API_URL } from '../lib/config';

const API = API_URL;

// ─── Colour tokens ────────────────────────────────────────────────────────────
const C = {
  bg:      '#0a0a0f',
  card:    'rgba(255,255,255,0.04)',
  border:  'rgba(255,255,255,0.08)',
  accent:  '#8b5cf6',
  accent2: '#00d4aa',
  text:    '#f8f8fc',
  muted:   'rgba(248,248,252,0.45)',
  danger:  '#ef4444',
};

// ─── Section renderers ────────────────────────────────────────────────────────

function SectionHeader({ sec }: { sec: any }) {
  return (
    <div style={{ textAlign: 'center', padding: '24px 0 8px' }}>
      {sec.icon && (
        <div style={{ fontSize: 36, marginBottom: 8 }}>{sec.icon}</div>
      )}
      <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: C.text }}>
        {sec.title}
      </h1>
      {sec.subtitle && (
        <p style={{ fontSize: 13, color: C.muted, margin: '6px 0 0' }}>
          {sec.subtitle}
        </p>
      )}
    </div>
  );
}

function SectionMetric({ sec }: { sec: any }) {
  const trendColor = sec.trend === 'up' ? C.accent2 : sec.trend === 'down' ? C.danger : C.muted;
  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: 1 }}>
            {sec.label}
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: C.text, lineHeight: 1.1, marginTop: 4 }}>
            {sec.value}
            {sec.unit && (
              <span style={{ fontSize: 14, fontWeight: 400, color: C.muted, marginLeft: 4 }}>
                {sec.unit}
              </span>
            )}
          </div>
        </div>
        {sec.change != null && (
          <div style={{ fontSize: 13, color: trendColor, fontWeight: 700, paddingTop: 4 }}>
            {sec.trend === 'up' ? '↑' : sec.trend === 'down' ? '↓' : '→'} {sec.change}
          </div>
        )}
      </div>
    </Card>
  );
}

function SectionProgress({ sec }: { sec: any }) {
  const pct = Math.min(100, Math.max(0, ((sec.value ?? 0) / (sec.max || 100)) * 100));
  const color = sec.color || C.accent;
  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{sec.label}</span>
        <span style={{ fontSize: 12, color: C.muted }}>{pct.toFixed(0)}%</span>
      </div>
      <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          borderRadius: 4,
          background: color,
          transition: 'width 0.6s ease',
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
        <span style={{ fontSize: 11, color: C.muted }}>0</span>
        <span style={{ fontSize: 11, color: C.muted }}>{sec.max}</span>
      </div>
    </Card>
  );
}

function SectionChecklist({
  sec,
  userData,
  onAction,
}: {
  sec: any;
  userData: any;
  onAction: (type: string, payload: any) => void;
}) {
  const checks: Record<string, boolean> = userData?.checks || {};
  return (
    <Card>
      {sec.title && (
        <h3 style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: '0 0 12px' }}>
          {sec.title}
        </h3>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {(sec.items || []).map((item: any) => {
          const done = checks[item.id] ?? item.done ?? false;
          return (
            <label
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                cursor: 'pointer',
                padding: '6px 0',
                borderBottom: `1px solid ${C.border}`,
              }}
            >
              <div
                onClick={() => onAction('check_item', { item_id: item.id, done: !done })}
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 6,
                  border: `2px solid ${done ? C.accent : C.border}`,
                  background: done ? C.accent : 'transparent',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s',
                }}
              >
                {done && <span style={{ fontSize: 12, color: '#fff' }}>✓</span>}
              </div>
              <span style={{
                fontSize: 13,
                color: done ? C.muted : C.text,
                textDecoration: done ? 'line-through' : 'none',
              }}>
                {item.text}
              </span>
            </label>
          );
        })}
      </div>
    </Card>
  );
}

function SectionCountdown({ sec }: { sec: any }) {
  const target = new Date(sec.target_date).getTime();
  const now    = Date.now();
  const diffMs = target - now;
  const diffDays  = Math.floor(diffMs / 86_400_000);
  const diffHours = Math.floor((diffMs % 86_400_000) / 3_600_000);

  const isPast = diffMs < 0;
  const label  = isPast ? 'days since' : 'days left';
  const days   = Math.abs(diffDays);

  return (
    <Card>
      <div style={{ textAlign: 'center', padding: '8px 0' }}>
        <div style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
          {sec.label}
        </div>
        <div style={{
          fontSize: 56,
          fontWeight: 900,
          color: isPast ? C.accent2 : C.accent,
          lineHeight: 1,
        }}>
          {days}
        </div>
        <div style={{ fontSize: 16, color: C.muted, marginTop: 4 }}>{label}</div>
        {!isPast && (
          <div style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>
            {diffHours}h remaining today
          </div>
        )}
        {sec.note && (
          <div style={{ fontSize: 12, color: C.muted, marginTop: 8, fontStyle: 'italic' }}>
            {sec.note}
          </div>
        )}
      </div>
    </Card>
  );
}

function SectionSteps({
  sec,
  userData,
  onAction,
}: {
  sec: any;
  userData: any;
  onAction: (type: string, payload: any) => void;
}) {
  const stepsDone: Record<string, boolean> = userData?.steps_done || {};
  return (
    <Card>
      {sec.title && (
        <h3 style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: '0 0 12px' }}>
          {sec.title}
        </h3>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {(sec.items || []).map((item: any, idx: number) => {
          const done = stepsDone[String(idx)] ?? item.done ?? false;
          return (
            <div key={idx} style={{ display: 'flex', gap: 12 }}>
              {/* Step number / check */}
              <div
                onClick={() => onAction('update_step', { step_index: idx, done: !done })}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  border: `2px solid ${done ? C.accent2 : C.border}`,
                  background: done ? C.accent2 : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  cursor: 'pointer',
                  fontSize: 11,
                  fontWeight: 700,
                  color: done ? '#0a0a0f' : C.muted,
                }}
              >
                {done ? '✓' : item.step ?? idx + 1}
              </div>
              <div style={{ paddingTop: 2 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: done ? C.muted : C.text }}>
                  {item.title}
                </div>
                {item.description && (
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 3, lineHeight: 1.5 }}>
                    {item.description}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function SectionText({ sec }: { sec: any }) {
  const isCallout = sec.style === 'callout';
  const isQuote   = sec.style === 'quote';
  return (
    <Card
      style={
        isCallout
          ? { background: `${C.accent}18`, border: `1px solid ${C.accent}33` }
          : isQuote
          ? { borderLeft: `3px solid ${C.accent2}`, background: 'transparent' }
          : {}
      }
    >
      <p style={{
        fontSize: 13,
        color: isCallout ? C.text : C.muted,
        lineHeight: 1.7,
        margin: 0,
        fontStyle: isQuote ? 'italic' : 'normal',
        whiteSpace: 'pre-wrap',
      }}>
        {/* Minimal markdown: **bold** */}
        {renderSimpleMarkdown(sec.content || '')}
      </p>
    </Card>
  );
}

function SectionLinks({ sec }: { sec: any }) {
  return (
    <Card>
      {sec.title && (
        <h3 style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: '0 0 12px' }}>
          {sec.title}
        </h3>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {(sec.items || []).map((item: any, idx: number) => (
          <a
            key={idx}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              flexDirection: 'column',
              padding: '10px 12px',
              borderRadius: 10,
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${C.border}`,
              textDecoration: 'none',
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 700, color: C.accent }}>{item.title}</span>
            {item.description && (
              <span style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{item.description}</span>
            )}
          </a>
        ))}
      </div>
    </Card>
  );
}

function SectionChartBar({ sec }: { sec: any }) {
  const max = Math.max(...(sec.values || [1]));
  return (
    <Card>
      {sec.title && (
        <h3 style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: '0 0 16px' }}>
          {sec.title}
        </h3>
      )}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 100 }}>
        {(sec.values || []).map((v: number, i: number) => (
          <div
            key={i}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
          >
            <div
              style={{
                width: '100%',
                height: `${(v / max) * 80}px`,
                background: `linear-gradient(to top, ${C.accent}, ${C.accent}99)`,
                borderRadius: '4px 4px 0 0',
                minHeight: 4,
                transition: 'height 0.5s ease',
              }}
            />
            <span style={{ fontSize: 10, color: C.muted }}>{sec.labels?.[i] || ''}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function SectionTable({ sec }: { sec: any }) {
  return (
    <Card style={{ overflowX: 'auto' }}>
      {sec.title && (
        <h3 style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: '0 0 12px' }}>
          {sec.title}
        </h3>
      )}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr>
            {(sec.headers || []).map((h: string, i: number) => (
              <th key={i} style={{
                padding: '8px 10px', textAlign: 'left', color: C.muted,
                borderBottom: `1px solid ${C.border}`, fontWeight: 700, textTransform: 'uppercase', fontSize: 11,
              }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(sec.rows || []).map((row: any[], ri: number) => (
            <tr key={ri}>
              {row.map((cell: any, ci: number) => (
                <td key={ci} style={{
                  padding: '8px 10px', color: ci === 0 ? C.text : C.muted,
                  borderBottom: `1px solid ${C.border}`,
                }}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

function SectionKanban({
  sec,
  userData,
  onAction,
}: {
  sec: any;
  userData: any;
  onAction: (type: string, payload: any) => void;
}) {
  const kanban: Record<string, string> = userData?.kanban || {};
  const columns: any[] = sec.columns || [];

  // Build card→column map with overrides from userData
  const cardCol: Record<string, string> = {};
  columns.forEach((col: any) => {
    (col.cards || []).forEach((card: any) => {
      cardCol[card.id] = kanban[card.id] || col.title;
    });
  });

  return (
    <Card>
      {sec.title && (
        <h3 style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: '0 0 12px' }}>
          {sec.title}
        </h3>
      )}
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
        {columns.map((col: any, ci: number) => {
          const colCards = columns
            .flatMap((c: any) => c.cards || [])
            .filter((card: any) => cardCol[card.id] === col.title);
          return (
            <div
              key={ci}
              style={{
                minWidth: 140,
                flex: '0 0 140px',
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid ${C.border}`,
                borderRadius: 10,
                padding: '10px 8px',
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', marginBottom: 8 }}>
                {col.title}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {colCards.map((card: any) => (
                  <div
                    key={card.id}
                    style={{
                      fontSize: 12,
                      color: C.text,
                      background: 'rgba(255,255,255,0.06)',
                      border: `1px solid ${C.border}`,
                      borderRadius: 6,
                      padding: '6px 8px',
                    }}
                  >
                    {card.text}
                    {/* Move buttons: simplified — next column only */}
                    {ci < columns.length - 1 && (
                      <button
                        onClick={() =>
                          onAction('kanban_move', {
                            card_id: card.id,
                            from_col: col.title,
                            to_col: columns[ci + 1].title,
                          })
                        }
                        style={{
                          display: 'block',
                          marginTop: 4,
                          fontSize: 10,
                          color: C.accent,
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0,
                        }}
                      >
                        → {columns[ci + 1].title}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function SectionForm({
  sec,
  onAction,
}: {
  sec: any;
  onAction: (type: string, payload: any) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAction('form_submit', { fields: values });
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <Card>
      {sec.title && (
        <h3 style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: '0 0 12px' }}>
          {sec.title}
        </h3>
      )}
      {submitted ? (
        <div style={{ textAlign: 'center', padding: '16px 0', color: C.accent2 }}>
          ✓ Saved
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {(sec.fields || []).map((field: any) => (
            <div key={field.name}>
              <label style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 4 }}>
                {field.label}
              </label>
              {field.type === 'select' ? (
                <select
                  value={values[field.name] || ''}
                  onChange={(e) => setValues((v) => ({ ...v, [field.name]: e.target.value }))}
                  style={inputStyle}
                >
                  <option value="">Select…</option>
                  {(field.options || []).map((opt: string) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : field.type === 'textarea' ? (
                <textarea
                  rows={3}
                  value={values[field.name] || ''}
                  onChange={(e) => setValues((v) => ({ ...v, [field.name]: e.target.value }))}
                  style={{ ...inputStyle, resize: 'vertical' as const }}
                />
              ) : (
                <input
                  type={field.type || 'text'}
                  value={values[field.name] || ''}
                  onChange={(e) => setValues((v) => ({ ...v, [field.name]: e.target.value }))}
                  style={inputStyle}
                />
              )}
            </div>
          ))}
          <button type="submit" style={btnStyle}>
            {sec.action_label || 'Save'}
          </button>
        </form>
      )}
    </Card>
  );
}

function SectionCalculator({ sec }: { sec: any }) {
  const [vals, setVals] = useState<Record<string, string>>({});
  return (
    <Card>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: '0 0 4px' }}>{sec.title}</h3>
      {sec.description && (
        <p style={{ fontSize: 12, color: C.muted, margin: '0 0 12px' }}>{sec.description}</p>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {(sec.fields || []).map((field: any) => (
          <div key={field.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: 12, color: C.muted }}>{field.label}</label>
            <input
              type={field.type || 'number'}
              defaultValue={field.default || ''}
              onChange={(e) => setVals((v) => ({ ...v, [field.name]: e.target.value }))}
              style={{ ...inputStyle, width: 100, textAlign: 'right' as const }}
            />
          </div>
        ))}
        {sec.formula_note && (
          <div style={{
            fontSize: 11,
            color: C.muted,
            padding: '8px 10px',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: 6,
            marginTop: 4,
          }}>
            {sec.formula_note}
          </div>
        )}
      </div>
    </Card>
  );
}

// ─── Shared primitives ────────────────────────────────────────────────────────

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: C.card,
      border: `1px solid ${C.border}`,
      borderRadius: 14,
      padding: '16px',
      ...style,
    }}>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: 8,
  border: `1px solid rgba(255,255,255,0.12)`,
  background: 'rgba(255,255,255,0.06)',
  color: '#f8f8fc',
  fontSize: 13,
  outline: 'none',
  boxSizing: 'border-box',
};

const btnStyle: React.CSSProperties = {
  padding: '10px 20px',
  borderRadius: 10,
  background: '#8b5cf6',
  color: '#fff',
  fontWeight: 700,
  fontSize: 13,
  border: 'none',
  cursor: 'pointer',
  width: '100%',
};

function renderSimpleMarkdown(text: string): React.ReactNode {
  // Handle **bold**
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith('**') && p.endsWith('**')
      ? <strong key={i} style={{ color: '#f8f8fc', fontWeight: 700 }}>{p.slice(2, -2)}</strong>
      : <React.Fragment key={i}>{p}</React.Fragment>
  );
}

// ─── Main section dispatcher ──────────────────────────────────────────────────

function Section({
  sec,
  userData,
  onAction,
}: {
  sec: any;
  userData: any;
  onAction: (type: string, payload: any) => void;
}) {
  switch (sec.kind) {
    case 'header':      return <SectionHeader sec={sec} />;
    case 'metric':      return <SectionMetric sec={sec} />;
    case 'progress':    return <SectionProgress sec={sec} />;
    case 'checklist':   return <SectionChecklist sec={sec} userData={userData} onAction={onAction} />;
    case 'countdown':   return <SectionCountdown sec={sec} />;
    case 'steps':       return <SectionSteps sec={sec} userData={userData} onAction={onAction} />;
    case 'text':        return <SectionText sec={sec} />;
    case 'links':       return <SectionLinks sec={sec} />;
    case 'chart_bar':   return <SectionChartBar sec={sec} />;
    case 'chart_line':  return <SectionChartBar sec={sec} />; // same renderer, line TBD
    case 'table':       return <SectionTable sec={sec} />;
    case 'kanban':      return <SectionKanban sec={sec} userData={userData} onAction={onAction} />;
    case 'calculator':  return <SectionCalculator sec={sec} />;
    case 'form':        return <SectionForm sec={sec} onAction={onAction} />;
    default:
      return null;
  }
}

// ─── Upgrade prompt ───────────────────────────────────────────────────────────

function UpgradePrompt() {
  return (
    <div style={{ maxWidth: 420, margin: '80px auto', padding: '0 20px', textAlign: 'center' }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>✦</div>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: '#f8f8fc', marginBottom: 12 }}>
        This surface is private
      </h2>
      <p style={{ color: 'rgba(248,248,252,0.5)', fontSize: 14, lineHeight: 1.6 }}>
        Aura's WebSpawn pages are personal — each one is built for its owner.
        Sign in to access your surfaces, or upgrade to create your own.
      </p>
      <a href="/connectome-web/" style={{
        display: 'inline-block',
        marginTop: 20,
        padding: '10px 24px',
        background: '#8b5cf6',
        color: '#fff',
        borderRadius: 10,
        fontWeight: 700,
        fontSize: 13,
        textDecoration: 'none',
      }}>
        Go to iDo
      </a>
    </div>
  );
}

// ─── SurfacePage ──────────────────────────────────────────────────────────────

export default function SurfacePage() {
  const { surfaceId } = useParams<{ surfaceId: string }>();
  const [data, setData]         = useState<any>(null);
  const [userData, setUserData] = useState<any>({});
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  const token = localStorage.getItem('connectome_token');

  const load = useCallback(async () => {
    if (!token || !surfaceId) {
      setError('auth');
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${API}/api/surfaces/${surfaceId}/data`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401 || res.status === 403) {
        setError('auth');
        setLoading(false);
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.detail || 'Could not load surface');
        setLoading(false);
        return;
      }
      const json = await res.json();
      setData(json);
      setUserData(json.user_data || {});
    } catch {
      setError('Network error — check your connection and try again.');
    }
    setLoading(false);
  }, [surfaceId, token]);

  useEffect(() => { load(); }, [load]);

  const handleAction = useCallback(
    async (actionType: string, payload: any) => {
      if (!token || !surfaceId) return;
      try {
        const res = await fetch(`${API}/api/surfaces/${surfaceId}/action`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action_type: actionType, payload }),
        });
        if (res.ok) {
          const json = await res.json();
          setUserData(json.user_data || {});
        }
      } catch {
        // Best-effort — optimistic UI already updated
      }
    },
    [surfaceId, token]
  );

  // ── Render states ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{
        minHeight: 'var(--visual-viewport-height, 100dvh)',
        background: C.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 16,
      }}>
        <div style={{
          fontSize: 40,
          color: '#8b5cf6',
          animation: 'spin 2s linear infinite',
        }}>◈</div>
        <p style={{ color: 'rgba(248,248,252,0.4)', fontSize: 13 }}>
          Loading your surface…
        </p>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error === 'auth' || !token) {
    return (
      <div style={{ minHeight: 'var(--visual-viewport-height, 100dvh)', background: C.bg }}>
        <UpgradePrompt />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        minHeight: 'var(--visual-viewport-height, 100dvh)',
        background: C.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 12,
        padding: '0 20px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 32 }}>⚠</div>
        <p style={{ color: 'rgba(248,248,252,0.5)', fontSize: 14 }}>{error}</p>
        <button onClick={load} style={{ ...btnStyle, width: 'auto', padding: '10px 24px' }}>
          Try again
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ minHeight: 'var(--visual-viewport-height, 100dvh)', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'rgba(248,248,252,0.4)', fontSize: 14 }}>Nothing here yet.</p>
      </div>
    );
  }

  // ── Full render ────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: 'var(--visual-viewport-height, 100dvh)', background: C.bg, color: C.text }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '20px 16px 80px' }}>
        {/* Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {(data.sections || []).map((sec: any, i: number) => (
            <Section key={i} sec={sec} userData={userData} onAction={handleAction} />
          ))}
        </div>

        {/* Footer */}
        <div style={{
          marginTop: 32,
          paddingTop: 20,
          borderTop: `1px solid ${C.border}`,
          textAlign: 'center',
        }}>
          <a
            href="/connectome-web/"
            style={{ fontSize: 11, color: 'rgba(248,248,252,0.25)', textDecoration: 'none' }}
          >
            Powered by Connectome · Aura
          </a>
        </div>
      </div>
    </div>
  );
}
