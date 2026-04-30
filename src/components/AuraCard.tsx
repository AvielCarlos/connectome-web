/**
 * AuraCard — renders any ScreenSpec component type in the browser
 */
import React, { useState } from 'react';
import { ScreenComponent } from '../lib/AuraClient';

const DOMAIN_CONFIG: Record<string, { emoji: string; color: string }> = {
  iVive:  { emoji: '🌱', color: '#10b981' },
  Eviva:  { emoji: '🌊', color: '#6366f1' },
  Aventi: { emoji: '🚀', color: '#f59e0b' },
};

interface AuraCardProps {
  component: ScreenComponent;
  index: number;
  onAction?: (action: any) => void;
}

export function AuraCard({ component: comp, index, onAction }: AuraCardProps) {
  const [moodSelected, setMoodSelected] = useState<number | null>(null);
  const [reflectionText, setReflectionText] = useState('');
  const [reflectionSubmitted, setReflectionSubmitted] = useState(false);

  const handleAction = (action: any) => {
    if (!action) return;
    if (action.type === 'open_url' && action.url) {
      const url = String(action.url);
      // Internal app protocols such as ido:// and ioo:// are signals for Aura's
      // pathway/execution layer. Browsers open them as blank pages, so pass
      // them to the parent instead of window.open.
      if (!/^https?:\/\//i.test(url) && !/^mailto:/i.test(url) && !/^tel:/i.test(url)) {
        onAction?.(action);
        return;
      }
      window.open(action.url, '_blank', 'noopener');
    } else if (onAction) {
      onAction(action);
    }
  };

  switch (comp.type) {
    case 'hero_image':
      return (
        <div key={index} style={{ margin: '-24px -24px 20px', overflow: 'hidden', borderRadius: '16px 16px 0 0' }}>
          <img
            src={comp.source}
            alt={comp.alt || ''}
            style={{ width: '100%', height: 220, objectFit: 'cover', display: 'block' }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        </div>
      );

    case 'headline':
      return (
        <h2 key={index} style={{
          color: comp.color || '#f8f8fc',
          fontSize: comp.style === 'large_bold' ? 26 : 20,
          fontWeight: comp.style === 'large_bold' ? 800 : 700,
          lineHeight: 1.35,
          marginBottom: 10,
          letterSpacing: -0.3,
        }}>
          {comp.text}
        </h2>
      );

    case 'body_text':
      return (
        <p key={index} style={{
          color: 'rgba(248,248,252,0.7)',
          fontSize: comp.style === 'subtitle' ? 14 : 15,
          lineHeight: 1.7,
          marginBottom: 14,
        }}>
          {comp.text}
        </p>
      );

    case 'section_header':
      return (
        <div key={index} style={{
          color: comp.color || '#00d4aa',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 2,
          textTransform: 'uppercase' as const,
          marginBottom: 10,
          marginTop: 6,
        }}>
          {comp.text}
        </div>
      );

    case 'category_badge':
    case 'type_badge':
    case 'pattern_badge':
    case 'meta': {
      const color = comp.color || '#00d4aa';
      return (
        <span key={index} style={{
          display: 'inline-block',
          background: color + '22',
          color,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 1,
          padding: '3px 10px',
          borderRadius: 8,
          marginBottom: 10,
          marginRight: 6,
        }}>
          {comp.text}
        </span>
      );
    }

    case 'body':
      return (
        <p key={index} style={{
          color: 'rgba(248,248,252,0.68)',
          fontSize: 15,
          lineHeight: 1.68,
          marginBottom: 14,
        }}>{comp.text}</p>
      );

    case 'context_strip': {
      const items: any[] = comp.items || [];
      return (
        <div key={index} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
          {items.map((item, i) => (
            <div key={i} style={{ background: 'rgba(0,0,0,0.28)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 14, padding: '8px 10px', minWidth: 78 }}>
              <div style={{ color: 'rgba(248,248,252,0.38)', fontSize: 10, fontWeight: 800, textTransform: 'uppercase' }}>{item.label}</div>
              <div style={{ color: '#f8f8fc', fontSize: 13, fontWeight: 850, marginTop: 2 }}>{item.value}</div>
            </div>
          ))}
        </div>
      );
    }

    case 'choice_grid': {
      const items: any[] = comp.items || [];
      return (
        <div key={index} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 8, marginBottom: 14 }}>
          {items.map((item, i) => (
            <button key={i} onClick={() => handleAction({ type: 'screen_signal', payload: item })} style={{ textAlign: 'left', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 14, padding: '11px 12px', color: '#f8f8fc', fontWeight: 750, fontSize: 13 }}>
              {item.label || item.text || item.value}
            </button>
          ))}
        </div>
      );
    }

    case 'timeline_steps': {
      const items: any[] = comp.items || [];
      return (
        <div key={index} style={{ display: 'grid', gap: 9, marginBottom: 14 }}>
          {items.map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: 'rgba(0,0,0,0.22)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 11 }}>
              <div style={{ width: 24, height: 24, borderRadius: 12, background: 'rgba(0,212,170,0.16)', color: '#00d4aa', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 900, flexShrink: 0 }}>{i + 1}</div>
              <div>
                <div style={{ color: '#f8f8fc', fontSize: 13, fontWeight: 850 }}>{item.title || item}</div>
                {item.body && <div style={{ color: 'rgba(248,248,252,0.48)', fontSize: 12, lineHeight: 1.45, marginTop: 2 }}>{item.body}</div>}
              </div>
            </div>
          ))}
        </div>
      );
    }

    case 'kanban_lite': {
      const columns: any[] = comp.columns || [];
      return (
        <div key={index} style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(columns.length || 1, 3)}, minmax(0,1fr))`, gap: 8, marginBottom: 14 }}>
          {columns.map((col, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.045)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 10 }}>
              <div style={{ color: '#00d4aa', fontSize: 11, fontWeight: 900, marginBottom: 7 }}>{col.label}</div>
              {(col.items || []).map((it: string, j: number) => <div key={j} style={{ color: 'rgba(248,248,252,0.58)', fontSize: 11, lineHeight: 1.45 }}>• {it}</div>)}
            </div>
          ))}
        </div>
      );
    }

    case 'readiness_meter': {
      const items: string[] = comp.items || [];
      return (
        <div key={index} style={{ display: 'grid', gap: 8, marginBottom: 14 }}>
          {items.map((it, i) => <div key={it} style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ width: 70, color: 'rgba(248,248,252,0.58)', fontSize: 12 }}>{it}</span><span style={{ flex: 1, height: 7, borderRadius: 99, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}><span style={{ display: 'block', width: `${35 + i * 12}%`, height: '100%', background: '#00d4aa', borderRadius: 99 }} /></span></div>)}
        </div>
      );
    }

    case 'question_stack': {
      const items: string[] = comp.items || [];
      return <div key={index} style={{ display: 'grid', gap: 8, marginBottom: 14 }}>{items.map((q, i) => <div key={i} style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.24)', borderRadius: 14, padding: 12, color: 'rgba(248,248,252,0.76)', fontSize: 13, lineHeight: 1.45 }}>？ {q}</div>)}</div>;
    }

    case 'split_actions': {
      const items: any[] = comp.items || [];
      return <div key={index} style={{ display: 'grid', gap: 8, marginBottom: 14 }}>{items.map((it, i) => <div key={i} style={{ background: it.owner === 'Aura' ? 'rgba(0,212,170,0.09)' : 'rgba(255,255,255,0.045)', border: it.owner === 'Aura' ? '1px solid rgba(0,212,170,0.2)' : '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 12 }}><div style={{ color: it.owner === 'Aura' ? '#00d4aa' : 'rgba(248,248,252,0.55)', fontSize: 11, fontWeight: 900, marginBottom: 4 }}>{it.owner}</div><div style={{ color: '#f8f8fc', fontSize: 13, lineHeight: 1.45 }}>{it.text}</div></div>)}</div>;
    }

    case 'constraint_panel': {
      const items: any[] = comp.items || [];
      return <div key={index} style={{ background: 'rgba(245,158,11,0.09)', border: '1px solid rgba(245,158,11,0.22)', borderRadius: 14, padding: 12, marginBottom: 14 }}><div style={{ color: '#fbbf24', fontSize: 11, fontWeight: 900, marginBottom: 7 }}>Prerequisites</div>{items.map((it, i) => <div key={i} style={{ color: 'rgba(248,248,252,0.66)', fontSize: 12, lineHeight: 1.5 }}>• {it.label || it}</div>)}</div>;
    }

    case 'domain_badge': {
      const cfg = DOMAIN_CONFIG[comp.domain || ''] || { emoji: '◈', color: '#00d4aa' };
      return (
        <span key={index} style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          background: cfg.color + '18',
          border: `1px solid ${cfg.color}44`,
          color: cfg.color,
          fontSize: 12,
          fontWeight: 600,
          padding: '3px 10px',
          borderRadius: 20,
          marginBottom: 12,
        }}>
          {cfg.emoji} {comp.domain}
        </span>
      );
    }

    case 'action_button': {
      const isPrimary = !comp.style || comp.style === 'primary';
      const isSecondary = comp.style === 'secondary';
      return (
        <button
          key={index}
          onClick={() => handleAction(comp.action)}
          style={{
            display: 'block',
            width: '100%',
            padding: '14px 20px',
            borderRadius: 12,
            fontSize: 15,
            fontWeight: 700,
            marginBottom: 8,
            background: isPrimary ? '#00d4aa' : isSecondary ? 'rgba(255,255,255,0.08)' : 'transparent',
            color: isPrimary ? '#0a0a0f' : '#f8f8fc',
            border: isSecondary ? '1px solid rgba(255,255,255,0.12)' : '1px solid transparent',
          }}
        >
          {comp.label || comp.text || 'Open →'}
        </button>
      );
    }

    case 'progress_bar':
      return (
        <div key={index} style={{ marginBottom: 14 }}>
          {comp.label && (
            <div style={{ fontSize: 12, color: 'rgba(248,248,252,0.5)', marginBottom: 6 }}>
              {comp.label}
            </div>
          )}
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{
                width: `${(comp.value || 0) * 100}%`,
                background: comp.color || '#00d4aa',
              }}
            />
          </div>
        </div>
      );

    case 'stat_card':
      return (
        <div key={index} style={{
          background: 'rgba(0,212,170,0.06)',
          border: '1px solid rgba(0,212,170,0.18)',
          borderRadius: 14,
          padding: '16px 20px',
          marginBottom: 12,
          textAlign: 'center' as const,
        }}>
          <div style={{ fontSize: 36, fontWeight: 900, color: '#00d4aa', letterSpacing: -1.5 }}>
            {comp.value || comp.text}
          </div>
          {comp.label && (
            <div style={{ fontSize: 12, color: 'rgba(248,248,252,0.55)', marginTop: 4 }}>
              {comp.label}
            </div>
          )}
        </div>
      );

    case 'streak_banner': {
      const color = comp.color || '#f59e0b';
      return (
        <div key={index} style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: color + '15',
          borderLeft: `3px solid ${color}`,
          borderRadius: 8,
          padding: '10px 14px',
          marginBottom: 10,
        }}>
          <span style={{ fontSize: 20 }}>{comp.icon || '🔥'}</span>
          <span style={{ color, fontWeight: 700, fontSize: 14 }}>{comp.text}</span>
        </div>
      );
    }

    case 'mood_check': {
      const moods = ['😴', '😕', '🙂', '😊', '🤩'];
      return (
        <div key={index} style={{ marginBottom: 16 }}>
          {comp.label && (
            <div style={{ fontSize: 14, color: 'rgba(248,248,252,0.65)', marginBottom: 10 }}>
              {comp.label || 'How are you feeling?'}
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            {moods.map((emoji, i) => (
              <button
                key={i}
                onClick={() => setMoodSelected(i)}
                style={{
                  background: moodSelected === i ? 'rgba(0,212,170,0.2)' : 'rgba(255,255,255,0.06)',
                  border: moodSelected === i ? '1px solid #00d4aa' : '1px solid transparent',
                  borderRadius: 12,
                  padding: '10px 14px',
                  fontSize: 22,
                  transition: 'all 0.15s',
                  transform: moodSelected === i ? 'scale(1.15)' : 'scale(1)',
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      );
    }

    case 'journal_prompt':
      return (
        <div key={index} style={{
          background: 'rgba(99,102,241,0.08)',
          borderLeft: '3px solid #6366f1',
          borderRadius: '0 10px 10px 0',
          padding: '14px 16px',
          marginBottom: 14,
        }}>
          <div style={{ fontSize: 11, color: '#6366f1', fontWeight: 700, letterSpacing: 0.5, marginBottom: 6 }}>
            ✍ JOURNAL PROMPT
          </div>
          <div style={{ fontSize: 15, color: 'rgba(248,248,252,0.8)', lineHeight: 1.6 }}>
            {comp.text || comp.prompt}
          </div>
        </div>
      );

    case 'weekly_letter':
      return (
        <div key={index} style={{
          background: 'rgba(0,212,170,0.05)',
          border: '1px solid rgba(0,212,170,0.15)',
          borderRadius: 14,
          padding: 20,
          marginBottom: 14,
        }}>
          <div style={{ fontSize: 12, color: '#00d4aa', fontWeight: 700, letterSpacing: 0.5, marginBottom: 10 }}>
            ◈ WEEKLY LETTER FROM AURA
          </div>
          <p style={{ fontSize: 15, color: 'rgba(248,248,252,0.8)', lineHeight: 1.7 }}>
            {comp.text}
          </p>
        </div>
      );

    case 'explore_card': {
      const items: any[] = comp.items || [];
      return (
        <div key={index} style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 14,
          padding: 16,
          marginBottom: 12,
        }}>
          {comp.ora_note && (
            <div style={{
              display: 'flex',
              gap: 8,
              background: 'rgba(0,212,170,0.08)',
              borderRadius: 8,
              padding: '8px 12px',
              marginBottom: 12,
            }}>
              <span style={{ color: '#00d4aa', fontSize: 11 }}>✦</span>
              <span style={{ color: 'rgba(248,248,252,0.6)', fontSize: 12, fontStyle: 'italic', lineHeight: 1.5 }}>
                {comp.ora_note}
              </span>
            </div>
          )}
          {comp.headline && (
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>{comp.headline}</div>
          )}
          {items.map((item: any, i: number) => (
            <div key={i} style={{
              display: 'flex',
              gap: 10,
              marginBottom: 12,
              paddingBottom: 12,
              borderBottom: i < items.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
            }}>
              <div style={{
                width: 24, height: 24, borderRadius: 12,
                background: 'rgba(0,212,170,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#00d4aa', fontSize: 11, fontWeight: 800, flexShrink: 0,
              }}>
                {i + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{item.name}</div>
                {item.rating > 0 && (
                  <div style={{ color: '#f59e0b', fontSize: 12, marginTop: 2 }}>
                    {'★'.repeat(Math.round(item.rating))}{'☆'.repeat(5 - Math.round(item.rating))} {item.rating?.toFixed(1)}
                  </div>
                )}
                {item.address && (
                  <div style={{ fontSize: 11, color: 'rgba(248,248,252,0.45)', marginTop: 2 }}>{item.address}</div>
                )}
                <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' as const }}>
                  {item.maps_url && (
                    <a href={item.maps_url} target="_blank" rel="noopener noreferrer" style={{
                      background: '#00d4aa', color: '#0a0a0f',
                      fontSize: 11, fontWeight: 700,
                      padding: '4px 10px', borderRadius: 6,
                      textDecoration: 'none',
                    }}>
                      📍 Directions
                    </a>
                  )}
                  {item.website_url && (
                    <a href={item.website_url} target="_blank" rel="noopener noreferrer" style={{
                      border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(248,248,252,0.6)',
                      fontSize: 11, fontWeight: 600,
                      padding: '4px 10px', borderRadius: 6,
                      textDecoration: 'none',
                    }}>
                      🌐 Website
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    case 'fulfilment_forecast':
      return (
        <div key={index} style={{
          background: 'linear-gradient(135deg, rgba(0,212,170,0.08), rgba(99,102,241,0.08))',
          border: '1px solid rgba(0,212,170,0.2)',
          borderRadius: 14,
          padding: 20,
          marginBottom: 14,
        }}>
          <div style={{ fontSize: 11, color: '#00d4aa', fontWeight: 700, letterSpacing: 1, marginBottom: 10 }}>
            ◈ FULFILMENT FORECAST
          </div>
          {comp.text && <p style={{ fontSize: 15, lineHeight: 1.65 }}>{comp.text}</p>}
          {comp.trend && (
            <div style={{ marginTop: 10, fontSize: 13, color: 'rgba(248,248,252,0.55)' }}>
              Trend: <span style={{ color: comp.trend === 'improving' ? '#10b981' : comp.trend === 'declining' ? '#ef4444' : '#f59e0b', fontWeight: 600 }}>
                {comp.trend}
              </span>
            </div>
          )}
        </div>
      );

    case 'quote':
      return (
        <blockquote key={index} style={{
          borderLeft: '3px solid rgba(0,212,170,0.4)',
          paddingLeft: 16,
          marginBottom: 14,
          color: 'rgba(248,248,252,0.65)',
          fontStyle: 'italic',
          fontSize: 15,
          lineHeight: 1.7,
        }}>
          "{comp.text}"
        </blockquote>
      );

    case 'divider':
      return <hr key={index} style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.08)', margin: '14px 0' }} />;

    case 'spacer':
      return <div key={index} style={{ height: comp.value || 16 }} />;

    case 'reflection_prompt':
      return (
        <div key={index} style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.45, marginBottom: 14 }}>
            {comp.question}
          </div>
          {comp.allow_text_response && (
            <>
              <textarea
                placeholder={comp.response_placeholder || 'Write freely...'}
                value={reflectionText}
                onChange={(e) => setReflectionText(e.target.value)}
                disabled={reflectionSubmitted}
                style={{ opacity: reflectionSubmitted ? 0.5 : 1 }}
              />
              {reflectionText.trim() && !reflectionSubmitted && (
                <button
                  onClick={() => setReflectionSubmitted(true)}
                  style={{
                    marginTop: 8,
                    float: 'right' as const,
                    background: '#00d4aa',
                    color: '#0a0a0f',
                    padding: '8px 20px',
                    borderRadius: 8,
                    fontSize: 13,
                  }}
                >
                  Done ✓
                </button>
              )}
            </>
          )}
        </div>
      );

    case 'social_proof_bar':
      return (
        <div key={index} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(255,255,255,0.04)',
          borderRadius: 8,
          padding: '8px 12px',
          marginBottom: 10,
          fontSize: 13, color: 'rgba(248,248,252,0.55)',
        }}>
          <span>{comp.icon || '🔥'}</span>
          <span>{comp.text}</span>
        </div>
      );

    case 'collective_stat':
      return (
        <div key={index} style={{
          background: 'rgba(99,102,241,0.06)',
          border: '1px solid rgba(99,102,241,0.18)',
          borderRadius: 16,
          padding: '20px 24px',
          textAlign: 'center' as const,
          marginBottom: 14,
        }}>
          <div style={{ fontSize: 42, fontWeight: 900, color: '#6366f1', letterSpacing: -1.5, lineHeight: 1.2 }}>
            {comp.stat || comp.text}
          </div>
          {comp.attribution && (
            <div style={{ fontSize: 11, color: 'rgba(248,248,252,0.4)', marginTop: 6, textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>
              {comp.attribution}
            </div>
          )}
          {comp.context && (
            <div style={{ fontSize: 14, fontWeight: 600, marginTop: 8, lineHeight: 1.45 }}>{comp.context}</div>
          )}
        </div>
      );

    case 'video_card':
      return (
        <div key={index} style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 14,
          padding: 16,
          marginBottom: 12,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ color: '#00d4aa', fontSize: 11, fontWeight: 800, letterSpacing: 0.5 }}>▶ WATCH</span>
            {comp.duration && <span style={{ color: 'rgba(248,248,252,0.4)', fontSize: 11 }}>{comp.duration}</span>}
          </div>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4, lineHeight: 1.4 }}>{comp.title}</div>
          {comp.channel && <div style={{ fontSize: 12, color: 'rgba(248,248,252,0.5)', marginBottom: 8 }}>{comp.channel}</div>}
          {comp.ora_note && <div style={{ fontSize: 12, color: 'rgba(248,248,252,0.55)', fontStyle: 'italic', marginBottom: 10, lineHeight: 1.5 }}>{comp.ora_note}</div>}
          {comp.youtube_url && (
            <a href={comp.youtube_url} target="_blank" rel="noopener noreferrer" style={{
              display: 'block',
              textAlign: 'center' as const,
              background: '#ff0000',
              color: '#fff',
              padding: '10px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              textDecoration: 'none',
            }}>
              ▶ Watch on YouTube
            </a>
          )}
        </div>
      );

    // Skip rendering for purely tracking or unknown types
    case 'tracking_metadata':
    case 'feedback_emoji':
    case 'feedback_one_word':
    case 'feedback_binary':
    case 'feedback_micro_poll':
    case 'feedback_completion_pulse':
    case 'feedback_star_rating':
      return null;

    default:
      // Gracefully skip unknown types
      return null;
  }
}
