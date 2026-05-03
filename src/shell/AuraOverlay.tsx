import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AuraClient, type AuraChatAction } from '../lib/AuraClient';

type Message = { id: string; role: 'user' | 'ora'; content: string; actions?: AuraChatAction[] };
type QuickAction = { label: string; prompt: string; context: string };

interface AuraOverlayProps {
  open: boolean;
  onClose: () => void;
}

const genericQuickActions: QuickAction[] = [
  { label: 'Navigate my path', prompt: 'Help me choose the most aligned next step on my path.', context: 'Aura overlay' },
  { label: "What's my IOO next step?", prompt: 'Use my IOO graph context to identify the next useful node or action.', context: 'Aura overlay' },
  { label: 'Show my life map', prompt: 'Orient me through my current life map and the routes available from here.', context: 'Aura overlay' },
];

const pageQuickActions: { pathPrefix: string; label: string; actions: QuickAction[] }[] = [
  {
    pathPrefix: '/app/goals',
    label: 'Goals page',
    actions: [
      { label: 'Clarify this goal', prompt: 'Use the current Goals page context to clarify the goal into outcome, constraints, and next action.', context: 'Goals page' },
      { label: 'Find the blocker', prompt: 'Look at my current goals and identify the most likely blocker or missing support.', context: 'Goals page' },
      { label: 'Make a 7-day path', prompt: 'Turn the most relevant goal here into a practical 7-day path with one small action per day.', context: 'Goals page' },
    ],
  },
  {
    pathPrefix: '/app/ido',
    label: 'Path Feed page',
    actions: [
      { label: 'Why this card?', prompt: 'Explain why the current Path Feed card may be appearing and what signal it is testing.', context: 'Path Feed page' },
      { label: 'Choose or skip?', prompt: 'Help me decide whether to act on, save, or skip the current feed card.', context: 'Path Feed page' },
      { label: 'Tune my feed', prompt: 'Ask me one useful question that would make this feed more aligned.', context: 'Path Feed page' },
    ],
  },
  {
    pathPrefix: '/app/ioo',
    label: 'Path Map page',
    actions: [
      { label: 'Explain this route', prompt: 'Explain the Path Map route I am viewing in plain language and identify the next node.', context: 'Path Map page' },
      { label: 'Find bridge nodes', prompt: 'Suggest bridge nodes that could connect my current state to the outcome I want.', context: 'Path Map page' },
      { label: 'Show prerequisites', prompt: 'Identify likely hidden prerequisites before I can progress on this path.', context: 'Path Map page' },
    ],
  },
  {
    pathPrefix: '/app/dao',
    label: 'DAO page',
    actions: [
      { label: 'Explain CP', prompt: 'Explain how CP, governance, and contribution reputation apply to what I am viewing.', context: 'DAO page' },
      { label: 'Find a contribution', prompt: 'Suggest one concrete contribution I could make from this DAO context.', context: 'DAO page' },
      { label: 'Assess proposal fit', prompt: 'Help me assess whether this proposal fits the ecosystem mission and current priorities.', context: 'DAO page' },
    ],
  },
  {
    pathPrefix: '/app/contribute',
    label: 'Contribute page',
    actions: [
      { label: 'Shape submission', prompt: 'Help me turn this contribution idea into a clear, reviewable submission.', context: 'Contribute page' },
      { label: 'Estimate CP signals', prompt: 'Estimate the CP-relevant value signals for this contribution and what evidence to include.', context: 'Contribute page' },
      { label: 'Find useful work', prompt: 'Suggest the most useful small contribution I could make from here.', context: 'Contribute page' },
    ],
  },
];

function quickActionConfig(pathname: string) {
  const pageConfig = pageQuickActions.find((entry) => pathname.startsWith(entry.pathPrefix));
  return pageConfig ?? { label: 'Aura overlay', actions: genericQuickActions };
}

export default function AuraOverlay({ open, onClose }: AuraOverlayProps) {
  const location = useLocation();
  const quickActions = useMemo(() => quickActionConfig(location.pathname), [location.pathname]);
  const quickActionContext = quickActions.label;
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'opening',
      role: 'ora',
      content: "I'm Aura — your AI OS for human flourishing. Ask me anything, or choose a signal below and I'll orient the day around it.",
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
      const res = await AuraClient.chat(text, history, {
        route: `${location.pathname}${location.search}${location.hash}`,
        app_context: { app: quickActionContext, page: location.pathname },
      });
      setMessages((prev) => [...prev, { id: `${Date.now()}-ora`, role: 'ora', content: res.reply, actions: res.suggested_actions || [] }]);
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

  const handleChatAction = async (action: AuraChatAction) => {
    if (loading) return;
    if (action.action === 'create_goal' && action.payload?.title) {
      setLoading(true);
      try {
        const goal = await AuraClient.createGoal(
          String(action.payload.title),
          action.payload.description ? String(action.payload.description) : undefined,
          action.payload.domain ? String(action.payload.domain) : undefined,
        );
        setMessages((prev) => [...prev, {
          id: `${Date.now()}-goal-created`,
          role: 'ora',
          content: `Done — I created the goal “${goal.title}”. I can break it down into a path next.`,
          actions: [{ label: 'Break it into steps', action: 'chat_prompt', prompt: `Break my new goal “${goal.title}” into a practical path with the smallest next action first.` }],
        }]);
      } catch {
        setMessages((prev) => [...prev, { id: `${Date.now()}-goal-error`, role: 'ora', content: 'I could not create that goal just now. Try again, or ask me to revise it first.' }]);
      } finally {
        setLoading(false);
      }
      return;
    }
    if (action.action === 'sync_drive') {
      setLoading(true);
      try {
        await AuraClient.syncGoogleDrive();
        setMessages((prev) => [...prev, { id: `${Date.now()}-drive-sync`, role: 'ora', content: 'Drive sync started. Ask me again in a moment and I’ll use the refreshed context.' }]);
      } catch {
        setMessages((prev) => [...prev, { id: `${Date.now()}-drive-sync-error`, role: 'ora', content: 'I could not sync Drive from here. Check Profile → Google Drive permissions/privacy, then try again.' }]);
      } finally {
        setLoading(false);
      }
      return;
    }
    if (action.prompt) sendMessage(action.prompt);
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
    <div className="ora-overlay" role="dialog" aria-modal="true" aria-label="Aura OS overlay">
      <div className="ora-overlay__scrim" onClick={onClose} />
      <div className="ora-overlay__panel" ref={panelRef} onPointerDown={handlePointerDown}>
        <header className="ora-overlay__header">
          <div className="ora-overlay__handle" />
          <div className="ora-overlay__identity">
            <span className="ora-orb ora-orb--large" />
            <div>
              <div className="ora-overlay__eyebrow">Aura · AIOS</div>
              <h2>Aura — your guide</h2>
            </div>
          </div>
          <button className="ora-overlay__close" type="button" onClick={onClose} aria-label="Close Aura">×</button>
        </header>

        <div className="ora-overlay__messages">
          {messages.map((message) => (
            <div key={message.id} className={`ora-overlay__message ora-overlay__message--${message.role}`}>
              {message.role === 'ora' && <span className="ora-orb ora-orb--small" />}
              <div>
                <div>{message.content}</div>
                {message.role === 'ora' && Boolean(message.actions?.length) && (
                  <div className="ora-overlay__message-actions" aria-label="Aura suggested actions">
                    {message.actions!.map((action, index) => (
                      <button
                        key={`${message.id}:${index}:${action.label}`}
                        type="button"
                        onClick={() => handleChatAction(action)}
                        disabled={loading}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
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

        <div className="ora-overlay__quick-actions" aria-label={`${quickActionContext} quick actions`}>
          <span className="ora-overlay__quick-context">{quickActionContext}</span>
          {quickActions.actions.map((action) => (
            <button
              key={`${action.context}:${action.label}`}
              type="button"
              title={action.context}
              onClick={() => sendMessage(`[${action.context}] ${action.prompt}`)}
            >
              {action.label}
            </button>
          ))}
        </div>

        <form className="ora-overlay__composer" onSubmit={(event) => { event.preventDefault(); sendMessage(); }}>
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask Aura to navigate, reflect, plan, or decide…"
            autoFocus
          />
          <button type="submit" disabled={!input.trim() || loading}>Send</button>
        </form>
      </div>
    </div>
  );
}
