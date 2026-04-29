/**
 * SuggestionButton — Floating Action Button for user suggestions
 * Fixed bottom-right, opens a modal to submit feedback/ideas to Ora.
 * Awards 5 CP per submission.
 */
import React, { useState, useEffect, useRef } from 'react';
import { OraClient } from '../lib/OraClient';
import { useToast } from './Toast';

const CATEGORIES = [
  { id: 'feature', label: '💡 Feature Idea', desc: 'Something new you want' },
  { id: 'bug', label: '🐛 Bug Report', desc: 'Something broken or wrong' },
  { id: 'ux', label: '✨ UX Feedback', desc: 'Improve how it feels' },
  { id: 'content', label: '📚 Content', desc: 'Topics or content ideas' },
  { id: 'other', label: '💬 Other', desc: 'Anything on your mind' },
];

const STATUS_COLORS: Record<string, string> = {
  pending: '#6b7280',
  accepted: '#10b981',
  implemented: '#6366f1',
  rejected: '#ef4444',
};

interface SubmissionResult {
  ora_response: string;
  cp_earned: number;
  total_dao_cp: number;
}

export default function SuggestionButton() {
  const { showCP } = useToast();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState('feature');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Capture page context automatically
  const pageContext = typeof window !== 'undefined'
    ? window.location.pathname.replace('/', '') || 'home'
    : undefined;

  useEffect(() => {
    if (open && !result) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [open, result]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const handleClose = () => {
    setOpen(false);
    setContent('');
    setCategory('feature');
    setResult(null);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!content.trim() || content.trim().length < 5) {
      setError('Please write at least a few words!');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await OraClient.submitSuggestion(content.trim(), category, pageContext);
      setResult({
        ora_response: res.ora_response,
        cp_earned: res.cp_earned,
        total_dao_cp: res.total_dao_cp,
      });
      showCP(res.cp_earned, res.total_dao_cp);
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* FAB Button */}
      <button
        onClick={() => setOpen(true)}
        title="Share a suggestion with Ora (+5 CP)"
        style={{
          position: 'fixed',
          top: 12,
          right: 16,
          width: 52,
          height: 52,
          borderRadius: 26,
          background: 'linear-gradient(135deg, #6366f1, #00d4aa)',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 22,
          boxShadow: '0 0 0 0 rgba(99,102,241,0.4)',
          animation: 'suggestion-pulse 2.5s ease-in-out infinite',
          zIndex: 900,
          transition: 'transform 0.15s ease',
        }}
        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.08)')}
        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
      >
        💬
      </button>

      {/* Pulse keyframe via style tag */}
      <style>{`
        @keyframes suggestion-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(99,102,241,0.35); }
          50% { box-shadow: 0 0 0 10px rgba(99,102,241,0); }
        }
      `}</style>

      {/* Backdrop */}
      {open && (
        <div
          onClick={handleClose}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            padding: '0 0 20px',
          }}
        >
          {/* Modal */}
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#12121a',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '20px 20px 16px 16px',
              padding: 24,
              width: '100%',
              maxWidth: 520,
              maxHeight: '85vh',
              overflowY: 'auto',
            }}
          >
            {result ? (
              // ── Success State ──
              <div style={{ textAlign: 'center', padding: '8px 0' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>✨</div>
                <h3 style={{ fontWeight: 700, fontSize: 18, marginBottom: 12 }}>
                  Ora heard you
                </h3>
                <div style={{
                  background: 'rgba(99,102,241,0.08)',
                  border: '1px solid rgba(99,102,241,0.2)',
                  borderRadius: 12,
                  padding: '14px 16px',
                  marginBottom: 16,
                  fontSize: 14,
                  color: 'rgba(248,248,252,0.8)',
                  lineHeight: 1.6,
                  fontStyle: 'italic',
                  textAlign: 'left',
                }}>
                  {result.ora_response}
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 12,
                  marginBottom: 20,
                }}>
                  <div style={{
                    background: 'rgba(244,194,107,0.1)',
                    border: '1px solid rgba(244,194,107,0.3)',
                    borderRadius: 10,
                    padding: '8px 14px',
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#f4c26b',
                  }}>
                    +{result.cp_earned} CP earned
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(248,248,252,0.4)' }}>
                    {result.total_dao_cp} CP total
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: 'none',
                    borderRadius: 10,
                    padding: '10px 24px',
                    color: 'rgba(248,248,252,0.7)',
                    fontSize: 14,
                    cursor: 'pointer',
                    width: '100%',
                  }}
                >
                  Done
                </button>
              </div>
            ) : (
              // ── Form State ──
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                  <div>
                    <h3 style={{ fontWeight: 700, fontSize: 17, margin: 0 }}>Share with Ora</h3>
                    <p style={{ fontSize: 12, color: 'rgba(248,248,252,0.4)', margin: '3px 0 0' }}>
                      Every suggestion earns{' '}
                      <span style={{ color: '#f4c26b', fontWeight: 600 }}>+5 CP</span>
                    </p>
                  </div>
                  <button
                    onClick={handleClose}
                    style={{
                      background: 'none', border: 'none', color: 'rgba(248,248,252,0.4)',
                      fontSize: 20, cursor: 'pointer', lineHeight: 1,
                    }}
                  >
                    ✕
                  </button>
                </div>

                {/* Category selector */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setCategory(cat.id)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 600,
                        border: `1px solid ${category === cat.id ? '#6366f1' : 'rgba(255,255,255,0.1)'}`,
                        background: category === cat.id ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
                        color: category === cat.id ? '#a5b4fc' : 'rgba(248,248,252,0.5)',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Textarea */}
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={e => { setContent(e.target.value); setError(null); }}
                  placeholder={
                    category === 'feature' ? "What would make Ora more valuable for you?"
                    : category === 'bug' ? "Describe what happened and what you expected..."
                    : category === 'ux' ? "What felt confusing or could feel better?"
                    : category === 'content' ? "What topics or content would you love to see?"
                    : "What's on your mind?"
                  }
                  rows={4}
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.04)',
                    border: `1px solid ${error ? '#ef4444' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: 12,
                    padding: '12px 14px',
                    color: '#f8f8fc',
                    fontSize: 14,
                    lineHeight: 1.6,
                    resize: 'none',
                    outline: 'none',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={e => (e.target.style.borderColor = 'rgba(99,102,241,0.5)')}
                  onBlur={e => (e.target.style.borderColor = error ? '#ef4444' : 'rgba(255,255,255,0.1)')}
                />

                {/* Context tag */}
                {pageContext && (
                  <div style={{ fontSize: 11, color: 'rgba(248,248,252,0.3)', marginTop: 6 }}>
                    📍 Context captured: <em>{pageContext}</em>
                  </div>
                )}

                {error && (
                  <div style={{ color: '#ef4444', fontSize: 12, marginTop: 8 }}>{error}</div>
                )}

                {/* Submit */}
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !content.trim()}
                  style={{
                    width: '100%',
                    marginTop: 14,
                    padding: '12px 0',
                    borderRadius: 12,
                    border: 'none',
                    background: submitting || !content.trim()
                      ? 'rgba(255,255,255,0.08)'
                      : 'linear-gradient(135deg, #6366f1, #00d4aa)',
                    color: submitting || !content.trim() ? 'rgba(248,248,252,0.3)' : '#fff',
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: submitting || !content.trim() ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {submitting ? 'Sending to Ora…' : 'Send + Earn 5 CP →'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
