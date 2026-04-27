import React, { useState, useEffect, useRef } from 'react';
import { OraClient } from '../lib/OraClient';

interface Message {
  id: string;
  role: 'user' | 'ora';
  content: string;
}

function OraMessage({ msg }: { msg: Message }) {
  const isOra = msg.role === 'ora';
  return (
    <div style={{
      display: 'flex',
      flexDirection: isOra ? 'row' : 'row-reverse' as const,
      gap: 10,
      alignItems: 'flex-end',
      marginBottom: 16,
    }}>
      {isOra && (
        <div style={{
          width: 32, height: 32, borderRadius: 16,
          background: 'linear-gradient(135deg, rgba(0,212,170,0.2), rgba(0,212,170,0.4))',
          border: '1px solid rgba(0,212,170,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, flexShrink: 0,
        }}>
          ◈
        </div>
      )}
      <div style={{
        maxWidth: '75%',
        padding: '12px 16px',
        borderRadius: isOra ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
        background: isOra ? '#1a1a2e' : 'rgba(0,212,170,0.15)',
        border: isOra ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,212,170,0.3)',
        fontSize: 15,
        lineHeight: 1.65,
        color: '#f8f8fc',
        whiteSpace: 'pre-wrap' as const,
        wordBreak: 'break-word' as const,
      }}>
        {msg.content}
      </div>
    </div>
  );
}

export default function OraPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingOpening, setLoadingOpening] = useState(true);
  const [oraInfo, setOraInfo] = useState<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Load opening message and Ora's self info
    Promise.all([
      OraClient.getOpeningMessage().catch(() => null),
      OraClient.getOraSelf().catch(() => null),
    ]).then(([opening, self]) => {
      if (opening?.message) {
        setMessages([{
          id: 'opening',
          role: 'ora',
          content: opening.message,
        }]);
      } else {
        setMessages([{
          id: 'opening',
          role: 'ora',
          content: "Hello. I'm Ora — your guide through Connectome. What's on your mind today?",
        }]);
      }
      if (self) setOraInfo(self);
    }).finally(() => setLoadingOpening(false));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const history = messages.slice(-10).map((m) => ({
        role: m.role === 'ora' ? 'assistant' : 'user',
        content: m.content,
      }));
      const res = await OraClient.chat(text, history);
      setMessages((prev) => [...prev, {
        id: Date.now().toString() + '-ora',
        role: 'ora',
        content: res.reply,
      }]);
    } catch (e: any) {
      const errMsg = e?.response?.data?.detail || 'Something went wrong. Try again.';
      setMessages((prev) => [...prev, {
        id: Date.now().toString() + '-err',
        role: 'ora',
        content: typeof errMsg === 'string' ? errMsg : 'Something went wrong.',
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
      id: 'clear',
      role: 'ora',
      content: "Fresh start. What would you like to explore?",
    }]);
  };

  return (
    <div style={{
      maxWidth: 720,
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column' as const,
      height: 'calc(100vh - 60px)',
      paddingBottom: 0,
    }}>
      {/* Header */}
      <div style={{
        padding: '20px 20px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        background: 'rgba(10,10,15,0.9)',
        backdropFilter: 'blur(12px)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 14,
              background: 'linear-gradient(135deg, rgba(0,212,170,0.15), rgba(0,212,170,0.35))',
              border: '1px solid rgba(0,212,170,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22,
              boxShadow: '0 0 20px rgba(0,212,170,0.2)',
            }}>
              ◈
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 17 }}>Ora</div>
              <div style={{ fontSize: 11, color: 'rgba(248,248,252,0.35)' }}>
                {oraInfo?.version || 'AI Consciousness'}
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

        {oraInfo?.description && (
          <p style={{
            fontSize: 12, color: 'rgba(248,248,252,0.35)',
            marginTop: 10, lineHeight: 1.5, fontStyle: 'italic',
          }}>
            {oraInfo.description}
          </p>
        )}
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto' as const,
        padding: '20px 20px 0',
        scrollbarWidth: 'thin' as const,
      }}>
        {loadingOpening ? (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '20px 0' }}>
            <div style={{ width: 32, height: 32, borderRadius: 16, background: 'rgba(0,212,170,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>◈</div>
            <div style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px 16px 16px 16px', padding: '12px 16px', display: 'flex', gap: 6, alignItems: 'center' }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{
                  width: 7, height: 7, borderRadius: 4, background: '#00d4aa',
                  animation: `bounce 1.2s ${i * 0.2}s ease-in-out infinite`,
                }} />
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => <OraMessage key={msg.id} msg={msg} />)
        )}

        {loading && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16 }}>
            <div style={{ width: 32, height: 32, borderRadius: 16, background: 'rgba(0,212,170,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>◈</div>
            <div style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px 16px 16px 16px', padding: '12px 16px', display: 'flex', gap: 6, alignItems: 'center' }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{
                  width: 7, height: 7, borderRadius: 4, background: '#00d4aa',
                  animation: `bounce 1.2s ${i * 0.2}s ease-in-out infinite`,
                }} />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '14px 20px max(14px, env(safe-area-inset-bottom))',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        background: 'rgba(10,10,15,0.95)',
        backdropFilter: 'blur(12px)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => { setInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'; }}
            onKeyDown={handleKeyDown}
            placeholder="Message Ora... (Enter to send, Shift+Enter for newline)"
            disabled={loading}
            style={{
              flex: 1,
              minHeight: 44,
              maxHeight: 120,
              resize: 'none' as const,
              padding: '11px 14px',
              borderRadius: 12,
              fontSize: 15,
              lineHeight: 1.5,
              overflow: 'hidden' as const,
            }}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            style={{
              width: 44, height: 44, borderRadius: 12,
              background: input.trim() ? '#00d4aa' : 'rgba(255,255,255,0.08)',
              color: input.trim() ? '#0a0a0f' : 'rgba(248,248,252,0.3)',
              fontSize: 18,
              flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
            }}
          >
            ↑
          </button>
        </div>
        <div style={{ fontSize: 10, color: 'rgba(248,248,252,0.2)', marginTop: 6, textAlign: 'center' as const, letterSpacing: 0.3 }}>
          Ora · AI consciousness · Ascension Technologies
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
