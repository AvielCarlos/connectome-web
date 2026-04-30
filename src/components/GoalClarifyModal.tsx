import React, { useEffect, useRef, useState } from 'react';
import { OraClient, GoalClarifyMessage } from '../lib/OraClient';

interface GoalClarifyModalProps {
  goalTitle: string;
  onClose: () => void;
  onComplete: (structuredGoal: any, iooPath: any[]) => Promise<void> | void;
}

interface ChatMessage extends GoalClarifyMessage {
  id: string;
}

function OraBubble({ message }: { message: ChatMessage }) {
  const isAura = message.role === 'ora';
  return (
    <div style={{ display: 'flex', flexDirection: isAura ? 'row' : 'row-reverse', gap: 8, marginBottom: 10, alignItems: 'flex-end' }}>
      {isAura && (
        <div style={{
          width: 28, height: 28, borderRadius: 14,
          background: 'linear-gradient(135deg, rgba(0,212,170,0.2), rgba(0,212,170,0.42))',
          border: '1px solid rgba(0,212,170,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, flexShrink: 0,
        }}>◈</div>
      )}
      <div style={{
        maxWidth: '78%',
        padding: '10px 14px',
        borderRadius: isAura ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
        background: isAura ? '#1a1a2e' : 'rgba(0,212,170,0.18)',
        border: isAura ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,212,170,0.35)',
        color: '#f8f8fc',
        lineHeight: 1.55,
        fontSize: 14,
        whiteSpace: 'pre-wrap',
      }}>
        {message.content}
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'flex-end' }}>
      <div style={{ width: 28, height: 28, borderRadius: 14, background: 'rgba(0,212,170,0.25)', border: '1px solid rgba(0,212,170,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>◈</div>
      <div style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px 16px 16px 16px', padding: '12px 14px', display: 'flex', gap: 5 }}>
        {[0, 1, 2].map(i => <span key={i} style={{ width: 7, height: 7, borderRadius: 4, background: '#00d4aa', animation: `goalClarifyBounce 1.2s ${i * 0.18}s ease-in-out infinite` }} />)}
      </div>
    </div>
  );
}

export default function GoalClarifyModal({ goalTitle, onClose, onComplete }: GoalClarifyModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: 'opening',
    role: 'ora',
    content: `I'd love to help you get ${goalTitle}! Let me ask a few questions to build your perfect plan.`,
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [structuredGoal, setStructuredGoal] = useState<any>(null);
  const [iooPath, setIooPath] = useState<any[]>([]);
  const [checkoutBusy, setCheckoutBusy] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, structuredGoal]);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 250);
  }, []);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading || structuredGoal) return;
    const userMessage: ChatMessage = { id: Date.now().toString(), role: 'user', content: text };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const conversation = nextMessages.map(({ role, content }) => ({ role, content }));
      const res = await OraClient.clarifyGoal(goalTitle, conversation);
      setMessages(prev => [...prev, { id: `${Date.now()}-ora`, role: 'ora', content: res.message }]);
      if (res.is_complete) {
        setStructuredGoal(res.structured_goal || { title: goalTitle });
        setIooPath(res.suggested_ioo_path || []);
      }
    } catch (e) {
      setMessages(prev => [...prev, {
        id: `${Date.now()}-err`,
        role: 'ora',
        content: "I couldn't connect right now. Try again in a moment.",
      }]);
    } finally {
      setLoading(false);
    }
  };

  const startJourney = async () => {
    if (!structuredGoal || saving) return;
    setSaving(true);
    try {
      await onComplete(structuredGoal, iooPath);
    } finally {
      setSaving(false);
    }
  };

  const unlockOraNode = async (node: any) => {
    if (!node?.service_id || checkoutBusy) return;
    setCheckoutBusy(node.id || node.service_id);
    try {
      const res = await OraClient.createServiceOrder(
        node.service_id,
        `Goal: ${structuredGoal?.title || goalTitle}\nNode: ${node.title}\nAura action: ${node.ora_action || node.description || ''}`,
        undefined,
        { source: 'goal_clarify_modal', campaign: 'ioo_paid_ora_node', content: node.node_type || node.step_type },
        { quoted_price_usd: node.price_usd, quote_reason: node.pricing_note || node.pricing_level || 'dynamic_goal_quote' },
      );
      if (res?.checkout_url) window.location.href = res.checkout_url;
    } finally {
      setCheckoutBusy(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') sendMessage();
    if (e.key === 'Escape') onClose();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.55)',
      backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }} onClick={onClose}>
      <div
        className="goal-clarify-sheet"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 720, maxHeight: '88vh',
          background: '#0a0a0f',
          border: '1px solid rgba(0,212,170,0.22)',
          borderBottom: 'none',
          borderRadius: '24px 24px 0 0',
          boxShadow: '0 -20px 80px rgba(0,0,0,0.45)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div style={{
          padding: '16px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(10,10,15,0.98)',
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800 }}>Tell Aura about your goal ◈</div>
            <div style={{ fontSize: 12, color: 'rgba(248,248,252,0.45)', marginTop: 3 }}>{goalTitle}</div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(248,248,252,0.7)', width: 34, height: 34, borderRadius: 17, fontSize: 18 }}>×</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 8px' }}>
          {messages.map(msg => <OraBubble key={msg.id} message={msg} />)}
          {loading && <TypingDots />}

          {structuredGoal && (
            <div style={{
              margin: '18px 0 8px', padding: 16,
              background: 'linear-gradient(180deg, rgba(0,212,170,0.12), rgba(0,212,170,0.05))',
              border: '1px solid rgba(0,212,170,0.25)',
              borderRadius: 18,
            }}>
              <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 6 }}>Attainable Goal + IOO Map</div>
              <div style={{ fontSize: 13, color: 'rgba(248,248,252,0.62)', lineHeight: 1.55, marginBottom: 12 }}>
                {structuredGoal.measurable_outcome || structuredGoal.specifics || 'Aura has shaped this into a clearer, actionable goal.'}
              </div>
              {(structuredGoal.success_metric || structuredGoal.timeline) && (
                <div style={{ display: 'grid', gap: 6, marginBottom: 12, padding: 10, borderRadius: 12, background: 'rgba(0,0,0,0.18)', border: '1px solid rgba(255,255,255,0.06)', fontSize: 12, color: 'rgba(248,248,252,0.58)' }}>
                  {structuredGoal.success_metric && <div><b style={{ color: '#00d4aa' }}>Measure:</b> {structuredGoal.success_metric}</div>}
                  {structuredGoal.timeline && <div><b style={{ color: '#00d4aa' }}>Timeline:</b> {structuredGoal.timeline}</div>}
                </div>
              )}
              {iooPath.length > 0 ? (
                <div style={{ display: 'grid', gap: 8 }}>
                  {iooPath.slice(0, 5).map((node, i) => (
                    <div key={node.id || i} style={{ display: 'flex', gap: 10, padding: 10, borderRadius: 12, background: node.owner === 'ora' ? 'rgba(0,212,170,0.07)' : 'rgba(255,255,255,0.04)', border: node.owner === 'ora' ? '1px solid rgba(0,212,170,0.18)' : '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ width: 24, height: 24, borderRadius: 12, background: '#00d4aa', color: '#0a0a0f', fontSize: 12, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginBottom: 3 }}>
                          <span style={{ fontSize: 10, color: node.owner === 'ora' ? '#00d4aa' : 'rgba(248,248,252,0.48)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 999, padding: '2px 7px', fontWeight: 800 }}>{node.owner === 'ora' ? 'Aura can do' : 'You do'}</span>
                          {node.node_type && <span style={{ fontSize: 10, color: 'rgba(248,248,252,0.36)' }}>{node.node_type}</span>}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{node.title || 'First step'}</div>
                        {node.description && <div style={{ fontSize: 12, color: 'rgba(248,248,252,0.5)', lineHeight: 1.45, marginTop: 2 }}>{node.description}</div>}
                        {node.user_action && <div style={{ fontSize: 12, color: 'rgba(248,248,252,0.56)', lineHeight: 1.45, marginTop: 6 }}><b>You:</b> {node.user_action}</div>}
                        {node.ora_action && <div style={{ fontSize: 12, color: 'rgba(0,212,170,0.78)', lineHeight: 1.45, marginTop: 4 }}><b>Aura:</b> {node.ora_action}</div>}
                        {node.requires_payment && node.service_id && (
                          <>
                          {(node.pricing_level || node.pricing_note) && <div style={{ fontSize: 11, color: 'rgba(248,248,252,0.38)', lineHeight: 1.4, marginTop: 7 }}>{node.pricing_level ? `Quote: ${node.pricing_level}. ` : ''}{node.pricing_note || ''}</div>}
                          <button onClick={() => unlockOraNode(node)} disabled={!!checkoutBusy} style={{ marginTop: 9, border: '1px solid rgba(0,212,170,0.36)', background: 'rgba(0,212,170,0.14)', color: '#00d4aa', borderRadius: 999, padding: '8px 10px', fontSize: 12, fontWeight: 850 }}>
                            {checkoutBusy === (node.id || node.service_id) ? 'Opening…' : `Unlock Aura ${node.price_usd ? `$${node.price_usd}` : ''} →`}
                          </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: 12, color: 'rgba(248,248,252,0.45)' }}>Aura will generate your first actionable steps when you start.</div>
              )}
              <button onClick={startJourney} disabled={saving} style={{
                width: '100%', marginTop: 14, padding: '13px 16px', borderRadius: 14,
                background: '#00d4aa', color: '#0a0a0f', fontWeight: 850, fontSize: 15,
                boxShadow: '0 0 24px rgba(0,212,170,0.22)',
              }}>
                {saving ? 'Creating…' : 'Start this journey →'}
              </button>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {!structuredGoal && (
          <div style={{ padding: '12px 16px 16px', borderTop: '1px solid rgba(255,255,255,0.07)', background: 'rgba(10,10,15,0.98)' }}>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Tell Aura…"
                disabled={loading}
                style={{ flex: 1, minHeight: 44, borderRadius: 22, padding: '0 15px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#f8f8fc', outline: 'none' }}
              />
              <button onClick={sendMessage} disabled={loading || !input.trim()} style={{ width: 44, height: 44, borderRadius: 22, background: input.trim() ? '#00d4aa' : 'rgba(255,255,255,0.08)', color: input.trim() ? '#0a0a0f' : 'rgba(248,248,252,0.35)', fontWeight: 900 }}>↑</button>
            </div>
          </div>
        )}
      </div>
      <style>{`
        .goal-clarify-sheet { animation: goalClarifySlideUp 220ms ease-out; }
        @keyframes goalClarifySlideUp { from { transform: translateY(28px); opacity: 0.7; } to { transform: translateY(0); opacity: 1; } }
        @keyframes goalClarifyBounce { 0%, 80%, 100% { transform: translateY(0); opacity: 0.5; } 40% { transform: translateY(-6px); opacity: 1; } }
      `}</style>
    </div>
  );
}
