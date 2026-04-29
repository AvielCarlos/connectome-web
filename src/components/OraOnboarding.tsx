import React, { useEffect, useRef, useState } from 'react';
import { OraClient, OnboardingMessage } from '../lib/OraClient';

interface ChatMessage extends OnboardingMessage {
  id: string;
}

const TOTAL_QUESTIONS = 6;
const ONBOARDING_CACHE_KEY = 'onboarding_done';

function Bubble({ message }: { message: ChatMessage }) {
  const isOra = message.role === 'ora';
  return (
    <div style={{ display: 'flex', flexDirection: isOra ? 'row' : 'row-reverse', gap: 10, marginBottom: 12, alignItems: 'flex-end' }}>
      {isOra && (
        <div style={{
          width: 32, height: 32, borderRadius: 16,
          background: 'linear-gradient(135deg, rgba(0,212,170,0.22), rgba(0,212,170,0.46))',
          border: '1px solid rgba(0,212,170,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 15, flexShrink: 0,
        }}>◈</div>
      )}
      <div style={{
        maxWidth: '78%',
        padding: '11px 14px',
        borderRadius: isOra ? '5px 18px 18px 18px' : '18px 5px 18px 18px',
        background: isOra ? 'rgba(0,212,170,0.14)' : '#15151f',
        border: isOra ? '1px solid rgba(0,212,170,0.32)' : '1px solid rgba(255,255,255,0.08)',
        color: '#f8f8fc',
        lineHeight: 1.55,
        fontSize: 14,
        whiteSpace: 'pre-wrap',
      }}>{message.content}</div>
    </div>
  );
}

function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'flex-end' }}>
      <div style={{ width: 32, height: 32, borderRadius: 16, background: 'rgba(0,212,170,0.24)', border: '1px solid rgba(0,212,170,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>◈</div>
      <div style={{ background: 'rgba(0,212,170,0.12)', border: '1px solid rgba(0,212,170,0.25)', borderRadius: '5px 18px 18px 18px', padding: '13px 15px', display: 'flex', gap: 5 }}>
        {[0, 1, 2].map(i => <span key={i} style={{ width: 7, height: 7, borderRadius: 4, background: '#00d4aa', animation: `oraOnboardingBounce 1.2s ${i * 0.18}s ease-in-out infinite` }} />)}
      </div>
    </div>
  );
}

export default function OraOnboarding() {
  const [visible, setVisible] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [complete, setComplete] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [checked, setChecked] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    const boot = async () => {
      if (localStorage.getItem(ONBOARDING_CACHE_KEY) === 'true') {
        setChecked(true);
        return;
      }
      try {
        const status = await OraClient.getOnboardingStatus();
        if (cancelled) return;
        if (status.completed) {
          localStorage.setItem(ONBOARDING_CACHE_KEY, 'true');
          setChecked(true);
          return;
        }
        setVisible(true);
        setQuestionIndex(Math.min(status.question_index || 0, TOTAL_QUESTIONS - 1));
        setLoading(true);
        const res = await OraClient.advanceOnboarding([]);
        if (cancelled) return;
        setMessages([{ id: 'opening', role: 'ora', content: res.message }]);
        setQuestionIndex(res.question_index);
      } catch (e) {
        console.error('Onboarding status failed:', e);
      } finally {
        if (!cancelled) {
          setLoading(false);
          setChecked(true);
          setTimeout(() => inputRef.current?.focus(), 150);
        }
      }
    };
    boot();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, complete]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading || complete) return;
    const userMessage: ChatMessage = { id: `${Date.now()}-user`, role: 'user', content: text };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const conversation = nextMessages.map(({ role, content }) => ({ role, content }));
      const res = await OraClient.advanceOnboarding(conversation);
      setMessages(prev => [...prev, { id: `${Date.now()}-ora`, role: 'ora', content: res.message }]);
      setQuestionIndex(Math.min(res.question_index, res.total_questions - 1));
      if (res.is_complete) {
        setComplete(true);
        localStorage.setItem(ONBOARDING_CACHE_KEY, 'true');
        window.setTimeout(() => setVisible(false), 1500);
      }
    } catch (e) {
      console.error('Onboarding send failed:', e);
      setMessages(prev => [...prev, {
        id: `${Date.now()}-err`,
        role: 'ora',
        content: "I couldn't connect right now. Try again in a moment.",
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') sendMessage();
  };

  if (!checked || !visible) return null;

  const progressStep = Math.min(questionIndex + 1, TOTAL_QUESTIONS);
  const progressPct = complete ? 100 : (progressStep / TOTAL_QUESTIONS) * 100;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      background: '#0a0a0f', color: '#f8f8fc',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }}>
      <div className="ora-onboarding-card" style={{
        width: '100%', maxWidth: 760, height: 'min(860px, 94vh)',
        background: 'radial-gradient(circle at top, rgba(0,212,170,0.12), transparent 38%), #0a0a0f',
        border: '1px solid rgba(0,212,170,0.24)',
        borderRadius: 28,
        boxShadow: '0 30px 100px rgba(0,0,0,0.55)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <div style={{ padding: '22px 22px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
            <div className={complete ? 'ora-onboarding-pulse' : undefined} style={{
              width: 52, height: 52, borderRadius: 26,
              background: 'linear-gradient(135deg, #00d4aa, #52ffd7)',
              color: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 950, fontSize: 24,
              boxShadow: '0 0 34px rgba(0,212,170,0.35)',
            }}>◈</div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 900 }}>Getting to know you</div>
              <div style={{ fontSize: 13, color: 'rgba(248,248,252,0.56)', marginTop: 3 }}>
                Step {progressStep} of {TOTAL_QUESTIONS} — so Ora can build your path.
              </div>
            </div>
          </div>
          <div style={{ height: 8, borderRadius: 8, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
            <div style={{ width: `${progressPct}%`, height: '100%', borderRadius: 8, background: 'linear-gradient(90deg, #00d4aa, #52ffd7)', transition: 'width 280ms ease' }} />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 18px 8px' }}>
          {messages.map(msg => <Bubble key={msg.id} message={msg} />)}
          {loading && <TypingDots />}
          {complete && (
            <div style={{
              margin: '20px auto 8px', maxWidth: 420, textAlign: 'center',
              padding: 18, borderRadius: 20,
              background: 'rgba(0,212,170,0.12)', border: '1px solid rgba(0,212,170,0.28)',
              animation: 'oraOnboardingPop 420ms ease-out',
            }}>
              <div style={{ fontSize: 30, marginBottom: 8 }}>✦</div>
              <div style={{ fontWeight: 900 }}>Your Connectome is awake.</div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {!complete && (
          <div style={{ padding: '14px 18px 18px', borderTop: '1px solid rgba(255,255,255,0.07)', background: 'rgba(10,10,15,0.96)' }}>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Reply to Ora…"
                disabled={loading}
                style={{ flex: 1, minHeight: 48, borderRadius: 24, padding: '0 16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#f8f8fc', outline: 'none', fontSize: 15 }}
              />
              <button onClick={sendMessage} disabled={loading || !input.trim()} style={{ width: 48, height: 48, borderRadius: 24, background: input.trim() ? '#00d4aa' : 'rgba(255,255,255,0.08)', color: input.trim() ? '#0a0a0f' : 'rgba(248,248,252,0.35)', fontWeight: 950, fontSize: 18 }}>↑</button>
            </div>
          </div>
        )}
      </div>
      <style>{`
        .ora-onboarding-card { animation: oraOnboardingEnter 260ms ease-out; }
        .ora-onboarding-pulse { animation: oraOnboardingPulse 900ms ease-in-out infinite alternate; }
        @keyframes oraOnboardingEnter { from { transform: translateY(18px); opacity: 0.65; } to { transform: translateY(0); opacity: 1; } }
        @keyframes oraOnboardingBounce { 0%, 80%, 100% { transform: translateY(0); opacity: 0.5; } 40% { transform: translateY(-6px); opacity: 1; } }
        @keyframes oraOnboardingPop { from { transform: scale(0.94); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes oraOnboardingPulse { from { transform: scale(1); } to { transform: scale(1.06); } }
      `}</style>
    </div>
  );
}
