import React, { useState, useEffect, useRef } from 'react';
import { OraClient } from '../lib/OraClient';
import { useExperiment } from '../lib/useExperiment';

interface Message {
  id: string;
  role: 'user' | 'ora';
  content: string;
  ts: number;
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function OraMessage({ msg, showTime }: { msg: Message; showTime: boolean }) {
  const isOra = msg.role === 'ora';
  return (
    <div style={{
      display: 'flex',
      flexDirection: isOra ? 'row' : 'row-reverse',
      gap: 8,
      alignItems: 'flex-end',
      marginBottom: 6,
    }}>
      {isOra && (
        <div style={{
          width: 28, height: 28, borderRadius: 14,
          background: 'linear-gradient(135deg, rgba(0,212,170,0.2), rgba(0,212,170,0.4))',
          border: '1px solid rgba(0,212,170,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, flexShrink: 0,
        }}>◈</div>
      )}
      <div style={{ maxWidth: '78%', display: 'flex', flexDirection: 'column', alignItems: isOra ? 'flex-start' : 'flex-end', gap: 3 }}>
        <div style={{
          padding: '10px 14px',
          borderRadius: isOra ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
          background: isOra ? '#1a1a2e' : 'rgba(0,212,170,0.18)',
          border: isOra ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,212,170,0.35)',
          fontSize: 15,
          lineHeight: 1.65,
          color: '#f8f8fc',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          boxShadow: isOra ? 'none' : '0 2px 12px rgba(0,212,170,0.1)',
        }}>
          {msg.content}
        </div>
        {showTime && (
          <div style={{
            fontSize: 10,
            color: 'rgba(248,248,252,0.25)',
            letterSpacing: 0.3,
            padding: '0 2px',
          }}>
            {formatTime(msg.ts)}
          </div>
        )}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 6 }}>
      <div style={{
        width: 28, height: 28, borderRadius: 14,
        background: 'linear-gradient(135deg, rgba(0,212,170,0.2), rgba(0,212,170,0.4))',
        border: '1px solid rgba(0,212,170,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, flexShrink: 0,
      }}>◈</div>
      <div style={{
        background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '4px 16px 16px 16px',
        padding: '10px 14px',
        display: 'flex', gap: 5, alignItems: 'center',
      }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{
            width: 7, height: 7, borderRadius: 4, background: '#00d4aa',
            animation: `bounce 1.2s ${i * 0.18}s ease-in-out infinite`,
          }} />
        ))}
      </div>
    </div>
  );
}

export default function OraPage() {
  // ─── A/B experiments ────────────────────────────────────────────────────
  const { variant: greetingVariant } = useExperiment('ora_greeting');
  const { variant: responseLengthVariant } = useExperiment('ora_response_length');
  const { variant: proactiveSuggestionsVariant, trackEvent: trackOraEvent } = useExperiment('ora_proactive_suggestions');

  const ORA_GREETINGS: Record<string, string> = {
    A: "Hey! I'm Ora. What do you want to work toward?",
    B: '◈ What\'s on your mind?',
    C: 'Hey. What are we working on today?',
    D: "I've been thinking about your goals. Want to pick up where we left off?",
  };

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingOpening, setLoadingOpening] = useState(true);
  const [oraInfo, setOraInfo] = useState<any>(null);
  const [keyboardUp, setKeyboardUp] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      OraClient.getOpeningMessage().catch(() => null),
      OraClient.getOraSelf().catch(() => null),
    ]).then(([opening, self]) => {
      // Use A/B greeting variant if no server-provided message
      const defaultGreeting = ORA_GREETINGS[greetingVariant] || ORA_GREETINGS['A'];
      const content = opening?.message || defaultGreeting;
      setMessages([{ id: 'opening', role: 'ora', content, ts: Date.now() }]);
      if (self) setOraInfo(self);
    }).finally(() => setLoadingOpening(false));
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Track keyboard (mobile)
  useEffect(() => {
    const onFocus = () => {
      setKeyboardUp(true);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 300);
    };
    const onBlur = () => setKeyboardUp(false);
    const input = inputRef.current;
    input?.addEventListener('focus', onFocus);
    input?.addEventListener('blur', onBlur);
    return () => {
      input?.removeEventListener('focus', onFocus);
      input?.removeEventListener('blur', onBlur);
    };
  }, []);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    // Reset textarea height
    if (inputRef.current) inputRef.current.style.height = 'auto';

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text, ts: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    // Track message sent event
    trackOraEvent('message_sent', 1);

    try {
      const history = messages.slice(-12).map((m) => ({
        role: m.role === 'ora' ? 'assistant' : 'user',
        content: m.content,
      }));
      const res = await OraClient.chat(text, history);
      setMessages((prev) => [...prev, {
        id: Date.now().toString() + '-ora',
        role: 'ora',
        content: res.reply,
        ts: Date.now(),
      }]);
    } catch (e: any) {
      const errMsg = e?.response?.data?.detail || 'Something went wrong. Try again.';
      setMessages((prev) => [...prev, {
        id: Date.now().toString() + '-err',
        role: 'ora',
        content: typeof errMsg === 'string' ? errMsg : 'Something went wrong.',
        ts: Date.now(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([{
      id: 'clear-' + Date.now(),
      role: 'ora',
      content: "Fresh start. What would you like to explore?",
      ts: Date.now(),
    }]);
  };

  // Show timestamps on last message per group
  const shouldShowTime = (i: number) =>
    i === messages.length - 1 || messages[i + 1]?.role !== messages[i].role;

  return (
    <div
      ref={containerRef}
      className="ora-container"
      style={{
        maxWidth: 720,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div style={{
        padding: '14px 20px 12px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        background: 'rgba(10,10,15,0.95)',
        backdropFilter: 'blur(12px)',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'linear-gradient(135deg, rgba(0,212,170,0.15), rgba(0,212,170,0.35))',
            border: '1px solid rgba(0,212,170,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20,
            boxShadow: '0 0 16px rgba(0,212,170,0.15)',
          }}>◈</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16 }}>Ora</div>
            <div style={{ fontSize: 11, color: '#00d4aa', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: 3, background: '#00d4aa', display: 'inline-block', animation: 'pulse 2s ease-in-out infinite' }} />
              Online
            </div>
          </div>
        </div>
        <button
          onClick={clearChat}
          style={{
            background: 'rgba(255,255,255,0.07)',
            color: 'rgba(248,248,252,0.5)',
            padding: '6px 12px',
            borderRadius: 8,
            fontSize: 12,
          }}
        >
          Clear
        </button>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px 16px 8px',
        scrollbarWidth: 'thin',
      }}>
        {loadingOpening ? (
          <TypingIndicator />
        ) : (
          messages.map((msg, i) => (
            <OraMessage key={msg.id} msg={msg} showTime={shouldShowTime(i)} />
          ))
        )}
        {loading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Input — stays above keyboard on mobile */}
      <div style={{
        padding: '12px 16px 16px',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        background: 'rgba(10,10,15,0.98)',
        backdropFilter: 'blur(12px)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', maxWidth: 720, margin: '0 auto' }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
            onKeyDown={handleKeyDown}
            placeholder="Message Ora…"
            disabled={loading}
            rows={1}
            style={{
              flex: 1,
              minHeight: 44,
              maxHeight: 120,
              resize: 'none',
              padding: '11px 14px',
              borderRadius: 22,
              fontSize: 15,
              lineHeight: 1.5,
              overflow: 'hidden',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            style={{
              width: 44, height: 44, borderRadius: 22,
              background: input.trim() ? '#00d4aa' : 'rgba(255,255,255,0.08)',
              color: input.trim() ? '#0a0a0f' : 'rgba(248,248,252,0.3)',
              fontSize: 18, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
              boxShadow: input.trim() ? '0 0 16px rgba(0,212,170,0.3)' : 'none',
            }}
          >
            ↑
          </button>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
