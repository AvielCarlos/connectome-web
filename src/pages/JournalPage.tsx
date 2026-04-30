import React, { useState, useEffect } from 'react';
import { AuraClient, JournalEntry } from '../lib/AuraClient';
import { useToast } from '../components/Toast';

function EntryCard({ entry }: { entry: JournalEntry }) {
  const [expanded, setExpanded] = useState(false);
  const date = new Date(entry.created_at).toLocaleDateString('en', {
    weekday: 'short', month: 'short', day: 'numeric',
  });

  return (
    <div
      style={{
        background: '#12121a',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 14,
        marginBottom: 10,
        overflow: 'hidden',
        cursor: 'pointer',
      }}
      onClick={() => setExpanded(!expanded)}
    >
      <div style={{ padding: '14px 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, color: 'rgba(248,248,252,0.4)', marginBottom: 5 }}>{date}</div>
            <div style={{ fontSize: 14, color: 'rgba(248,248,252,0.7)', fontStyle: 'italic', lineHeight: 1.5 }}>
              {entry.prompt}
            </div>
          </div>
          <span style={{ color: 'rgba(248,248,252,0.25)', fontSize: 12, flexShrink: 0 }}>
            {expanded ? '▲' : '▼'}
          </span>
        </div>
      </div>

      {expanded && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ padding: '14px 18px' }}>
            <div style={{ fontSize: 15, color: '#f8f8fc', lineHeight: 1.7, whiteSpace: 'pre-wrap' as const }}>
              {entry.response}
            </div>
          </div>
          {entry.ora_reflection && (
            <div style={{
              borderTop: '1px solid rgba(0,212,170,0.12)',
              background: 'rgba(0,212,170,0.04)',
              padding: '12px 18px',
            }}>
              <div style={{ fontSize: 10, color: '#00d4aa', fontWeight: 700, letterSpacing: 0.8, marginBottom: 6 }}>
                ◈ AURA'S REFLECTION
              </div>
              <div style={{ fontSize: 13, color: 'rgba(248,248,252,0.65)', lineHeight: 1.65, fontStyle: 'italic' }}>
                {entry.ora_reflection}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function JournalPage() {
  const { show } = useToast();
  const [prompt, setPrompt] = useState<{ id: string; prompt: string } | null>(null);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [reflection, setReflection] = useState('');

  useEffect(() => {
    Promise.all([
      AuraClient.getJournalPrompt().catch(() => null),
      AuraClient.getJournalEntries().catch(() => []),
    ]).then(([p, e]) => {
      if (p) setPrompt(p);
      setEntries(e);
    }).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !prompt) return;
    setSubmitting(true);
    try {
      const res = await AuraClient.submitJournalEntry(prompt.id, text.trim());
      setReflection(res.ora_reflection || '');
      setSubmitted(true);
      show('Journal entry saved!', 'success');
      // Refresh entries
      const updated = await AuraClient.getJournalEntries().catch(() => entries);
      setEntries(updated);
    } catch (e) {
      console.error('Submit journal failed:', e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-content" style={{ maxWidth: 640, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontWeight: 800, fontSize: 24, letterSpacing: -0.5 }}>✍ Journal</h1>
        <p style={{ fontSize: 13, color: 'rgba(248,248,252,0.4)', marginTop: 4 }}>
          Daily reflection with Aura
        </p>
      </div>

      {/* Today's prompt */}
      {!loading && prompt && !submitted && (
        <div
          className="fade-in"
          style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(0,212,170,0.05))',
            border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: 18,
            padding: 24,
            marginBottom: 28,
          }}
        >
          <div style={{ fontSize: 10, color: '#6366f1', fontWeight: 700, letterSpacing: 1.5, marginBottom: 14 }}>
            TODAY'S PROMPT FROM AURA
          </div>
          <p style={{ fontSize: 18, fontWeight: 600, lineHeight: 1.55, marginBottom: 20, color: '#f8f8fc' }}>
            {prompt.prompt}
          </p>
          <form onSubmit={handleSubmit}>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write freely. Aura is listening..."
              style={{ minHeight: 140, fontSize: 15, lineHeight: 1.7 }}
              required
            />
            <button
              type="submit"
              disabled={submitting || !text.trim()}
              style={{
                marginTop: 12,
                width: '100%',
                background: '#00d4aa',
                color: '#0a0a0f',
                padding: '14px',
                borderRadius: 12,
                fontWeight: 700,
                fontSize: 15,
              }}
            >
              {submitting ? 'Sending to Aura...' : 'Submit ✓'}
            </button>
          </form>
        </div>
      )}

      {/* Aura's reflection after submit */}
      {submitted && reflection && (
        <div
          className="fade-in"
          style={{
            background: 'rgba(0,212,170,0.06)',
            border: '1px solid rgba(0,212,170,0.2)',
            borderRadius: 16,
            padding: 20,
            marginBottom: 24,
          }}
        >
          <div style={{ fontSize: 10, color: '#00d4aa', fontWeight: 700, letterSpacing: 1.2, marginBottom: 10 }}>
            ◈ AURA'S REFLECTION
          </div>
          <p style={{ fontSize: 15, color: 'rgba(248,248,252,0.8)', lineHeight: 1.7, fontStyle: 'italic' }}>
            {reflection}
          </p>
          <button
            onClick={() => { setSubmitted(false); setText(''); setReflection(''); }}
            style={{
              marginTop: 14,
              background: 'rgba(255,255,255,0.08)',
              color: 'rgba(248,248,252,0.6)',
              padding: '8px 16px',
              borderRadius: 8,
              fontSize: 13,
            }}
          >
            Write another entry
          </button>
        </div>
      )}

      {/* Past entries */}
      {entries.length > 0 && (
        <div>
          <div style={{ fontSize: 12, color: 'rgba(248,248,252,0.3)', fontWeight: 700, letterSpacing: 1, marginBottom: 14 }}>
            PAST ENTRIES · {entries.length}
          </div>
          {entries.map((entry) => (
            <EntryCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: 40, color: 'rgba(248,248,252,0.3)' }}>
          Loading...
        </div>
      )}

      {!loading && !prompt && (
        <div style={{
          textAlign: 'center', padding: 40,
          background: '#12121a', borderRadius: 16, marginBottom: 24,
        }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>✍</div>
          <div style={{ color: 'rgba(248,248,252,0.4)', lineHeight: 1.6 }}>
            No prompt available right now. Check back soon.
          </div>
        </div>
      )}
    </div>
  );
}
