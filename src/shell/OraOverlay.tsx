import React, { useEffect, useRef, useState } from 'react';
import { OraClient } from '../lib/OraClient';

type Message = { id: string; role: 'user' | 'ora'; content: string };

interface OraOverlayProps {
  open: boolean;
  onClose: () => void;
}

const quickActions = ['Show my path', 'What should I do today?', 'How am I doing?'];

export default function OraOverlay({ open, onClose }: OraOverlayProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'opening',
      role: 'ora',
      content: "I'm here. Ask me anything, or choose a signal below and I'll orient the whole OS around it.",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
  }, [open, messages, loading]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const sendMessage = async (override?: string) => {
    const text = (override ?? input).trim();
    if (!text || loading) return;
    setInput('');
    setMessages((prev) => [...prev, { id: `${Date.now()}-user`, role: 'user', content: text }]);
    setLoading(true);

    try {
      const history = messages.slice(-10).map((m) => ({
        role: m.role === 'ora' ? 'assistant' : 'user',
        content: m.content,
      }));
      const res = await OraClient.chat(text, history);
      setMessages((prev) => [...prev, { id: `${Date.now()}-ora`, role: 'ora', content: res.reply }]);
    } catch {
      setMessages((prev) => [...prev, {
        id: `${Date.now()}-fallback`,
        role: 'ora',
        content: "I couldn't reach my deeper systems just now, but I'm still here. Try again in a moment.",
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handlePointerDown = (event: React.PointerEvent) => {
    const startY = event.clientY;
    const onPointerUp = (upEvent: PointerEvent) => {
      if (upEvent.clientY - startY > 90) onClose();
      window.removeEventListener('pointerup', onPointerUp);
    };
    window.addEventListener('pointerup', onPointerUp);
  };

  if (!open) return null;

  return (
    <div className="ora-overlay" role="dialog" aria-modal="true" aria-label="Ora OS overlay">
      <div className="ora-overlay__scrim" onClick={onClose} />
      <div className="ora-overlay__panel" ref={panelRef} onPointerDown={handlePointerDown}>
        <header className="ora-overlay__header">
          <div className="ora-overlay__handle" />
          <div className="ora-overlay__identity">
            <span className="ora-orb ora-orb--large" />
            <div>
              <div className="ora-overlay__eyebrow">OS-level intelligence</div>
              <h2>Ora</h2>
            </div>
          </div>
          <button className="ora-overlay__close" type="button" onClick={onClose} aria-label="Close Ora">×</button>
        </header>

        <div className="ora-overlay__messages">
          {messages.map((message) => (
            <div key={message.id} className={`ora-overlay__message ora-overlay__message--${message.role}`}>
              {message.role === 'ora' && <span className="ora-orb ora-orb--small" />}
              <div>{message.content}</div>
            </div>
          ))}
          {loading && (
            <div className="ora-overlay__message ora-overlay__message--ora">
              <span className="ora-orb ora-orb--small" />
              <div className="ora-overlay__typing"><span /><span /><span /></div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div className="ora-overlay__quick-actions">
          {quickActions.map((action) => (
            <button key={action} type="button" onClick={() => sendMessage(action)}>{action}</button>
          ))}
        </div>

        <form className="ora-overlay__composer" onSubmit={(event) => { event.preventDefault(); sendMessage(); }}>
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask Ora to navigate, reflect, plan, or decide…"
            autoFocus
          />
          <button type="submit" disabled={!input.trim() || loading}>Send</button>
        </form>
      </div>
    </div>
  );
}
