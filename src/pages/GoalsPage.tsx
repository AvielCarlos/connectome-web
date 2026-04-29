import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { OraClient, Goal } from '../lib/OraClient';
import { useToast } from '../components/Toast';
import { useExperiment } from '../lib/useExperiment';
import GoalClarifyModal from '../components/GoalClarifyModal';

const DOMAIN_CONFIG: Record<string, { emoji: string; color: string }> = {
  iVive:  { emoji: '🌱', color: '#10b981' },
  Eviva:  { emoji: '🌊', color: '#6366f1' },
  Aventi: { emoji: '🚀', color: '#f59e0b' },
};

const GOAL_STARTERS = [
  { title: 'Get fit', domain: 'iVive', emoji: '🌱' },
  { title: 'Feel calmer', domain: 'Eviva', emoji: '🌊' },
  { title: 'Build a new habit', domain: 'iVive', emoji: '◎' },
  { title: 'Explore more of life', domain: 'Aventi', emoji: '✨' },
];

function DomainBadge({ domain }: { domain?: string }) {
  if (!domain) return null;
  const cfg = DOMAIN_CONFIG[domain] || { emoji: '◈', color: '#00d4aa' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: cfg.color + '18', border: `1px solid ${cfg.color}44`,
      color: cfg.color, fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
      padding: '2px 8px', borderRadius: 20,
    }}>
      {cfg.emoji} {domain}
    </span>
  );
}

// Skeleton
function GoalSkeleton() {
  return (
    <div style={{ background: '#12121a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, marginBottom: 12, overflow: 'hidden' }}>
      <div style={{ padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ height: 18, width: '70%', borderRadius: 6, marginBottom: 10 }} className="skeleton" />
            <div style={{ height: 12, width: '30%', borderRadius: 6 }} className="skeleton" />
          </div>
          <div style={{ width: 40, height: 40, borderRadius: 20 }} className="skeleton" />
        </div>
        <div style={{ height: 6, borderRadius: 4, marginTop: 14 }} className="skeleton" />
      </div>
    </div>
  );
}

function AskOraStep({ goalId, stepIndex, stepText, onOraReply }: {
  goalId: string; stepIndex: number; stepText: string; onOraReply: (reply: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [asked, setAsked] = useState(false);

  const ask = async () => {
    if (loading || asked) return;
    setLoading(true);
    try {
      // Use chat API to ask about the step
      const res = await OraClient.chat(
        `Help me with this step from my goal: "${stepText}". Give me specific, actionable advice in 2-3 sentences.`,
        []
      );
      onOraReply(res.reply);
      setAsked(true);
    } catch {
      onOraReply("I couldn't connect right now. Try again in a moment.");
      setAsked(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={ask}
      disabled={loading}
      title="Ask Ora for help with this step"
      style={{
        background: loading ? 'rgba(0,212,170,0.05)' : 'rgba(0,212,170,0.08)',
        border: '1px solid rgba(0,212,170,0.2)',
        color: '#00d4aa',
        padding: '3px 8px',
        borderRadius: 6,
        fontSize: 10,
        fontWeight: 700,
        flexShrink: 0,
        marginTop: 2,
        letterSpacing: 0.3,
        whiteSpace: 'nowrap',
      }}
    >
      {loading ? '◈…' : '◈ Ask Ora'}
    </button>
  );
}

function GoalCard({
  goal,
  onUpdate,
  onDelete,
}: {
  goal: Goal;
  onUpdate: (g: Goal) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [breaking, setBreaking] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [oraReplies, setOraReplies] = useState<Record<number, string>>({});
  const { show } = useToast();

  const completedSteps = goal.steps?.filter((s) => s.completed).length || 0;
  const totalSteps = goal.steps?.length || 0;
  const progress = totalSteps > 0 ? completedSteps / totalSteps : goal.progress || 0;
  const progressDeg = Math.round(progress * 360);

  const handleBreakdown = async () => {
    setBreaking(true);
    try {
      const updated = await OraClient.breakdownGoal(goal.id);
      onUpdate(updated);
      setExpanded(true);
      show('✦ Ora mapped your path!', 'success');
    } catch (e) {
      console.error('Breakdown failed:', e);
    } finally {
      setBreaking(false);
    }
  };

  const handleComplete = async () => {
    setCompleting(true);
    try {
      await OraClient.completeGoal(goal.id);
      onDelete(goal.id);
      show('🎉 Done!', 'success');
    } catch (e) {
      console.error('Complete goal failed:', e);
    } finally {
      setCompleting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Remove this?')) return;
    try {
      await OraClient.deleteGoal(goal.id);
      onDelete(goal.id);
    } catch (e) {
      console.error('Delete failed:', e);
    }
  };

  const handleToggleStep = async (stepIndex: number) => {
    const updatedSteps = goal.steps.map((s, si) =>
      si === stepIndex ? { ...s, completed: !s.completed } : s
    );
    try {
      const updated = await OraClient.updateGoal(goal.id, { steps: updatedSteps });
      onUpdate(updated);
    } catch {
      // silent fail, optimistic update already done above locally
    }
  };

  return (
    <div
      className="fade-in"
      style={{
        background: '#12121a',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16,
        marginBottom: 12,
        overflow: 'hidden',
        transition: 'all 0.2s',
      }}
    >
      {/* Header */}
      <div
        style={{ padding: 20, cursor: 'pointer' }}
        onClick={() => setExpanded(!expanded)}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 16, lineHeight: 1.4, marginBottom: 6 }}>
              {goal.title}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' as const }}>
              <DomainBadge domain={goal.domain} />
              {totalSteps > 0 && (
                <span style={{ fontSize: 11, color: 'rgba(248,248,252,0.4)' }}>
                  {completedSteps}/{totalSteps} steps
                </span>
              )}
            </div>
          </div>

          {/* Progress ring */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 22,
              background: `conic-gradient(#00d4aa ${progressDeg}deg, rgba(255,255,255,0.07) 0deg)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative',
            }}>
              <div style={{
                position: 'absolute',
                width: 32, height: 32, borderRadius: 16,
                background: '#12121a',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 800, color: '#00d4aa',
              }}>
                {Math.round(progress * 100)}%
              </div>
            </div>
            <span style={{
              fontSize: 12, color: 'rgba(248,248,252,0.3)',
              transform: expanded ? 'rotate(90deg)' : 'none',
              transition: 'transform 0.2s',
              display: 'inline-block',
            }}>
              ▶
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progress * 100}%` }} />
        </div>
      </div>

      {/* Steps (expanded) */}
      {expanded && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '4px 20px 16px' }} className="fade-in">
          {goal.description && (
            <p style={{ fontSize: 13, color: 'rgba(248,248,252,0.55)', lineHeight: 1.6, margin: '12px 0' }}>
              {goal.description}
            </p>
          )}

          {goal.steps?.length > 0 ? (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 11, color: 'rgba(248,248,252,0.35)', fontWeight: 700, letterSpacing: 1, marginBottom: 10 }}>
                STEPS
              </div>
              {goal.steps.map((step, i) => (
                <div key={step.id || i} style={{ marginBottom: 12 }}>
                  <div style={{
                    display: 'flex',
                    gap: 12,
                    padding: '10px 0',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    alignItems: 'flex-start',
                  }}>
                    {/* Checkbox */}
                    <div
                      style={{
                        width: 20, height: 20, borderRadius: 4,
                        border: step.completed ? 'none' : '1.5px solid rgba(255,255,255,0.25)',
                        background: step.completed ? '#00d4aa' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, cursor: 'pointer', marginTop: 2,
                        transition: 'all 0.15s',
                      }}
                      onClick={() => handleToggleStep(i)}
                    >
                      {step.completed && <span style={{ fontSize: 12, color: '#0a0a0f', fontWeight: 900 }}>✓</span>}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 14, fontWeight: 500,
                        color: step.completed ? 'rgba(248,248,252,0.35)' : '#f8f8fc',
                        textDecoration: step.completed ? 'line-through' : 'none',
                        lineHeight: 1.5,
                        marginBottom: 2,
                      }}>
                        {step.text}
                      </div>
                      {step.ora_note && (
                        <div style={{ fontSize: 12, color: '#00d4aa', fontStyle: 'italic', marginTop: 4, lineHeight: 1.5 }}>
                          ✦ {step.ora_note}
                        </div>
                      )}
                      {step.detail && (
                        <div style={{ fontSize: 12, color: 'rgba(248,248,252,0.45)', marginTop: 4, lineHeight: 1.5 }}>
                          {step.detail}
                        </div>
                      )}
                      {step.resources?.map((r, ri) => (
                        <a key={ri} href={r.url} target="_blank" rel="noopener noreferrer" style={{
                          display: 'inline-block', fontSize: 11, color: '#00d4aa',
                          textDecoration: 'none', marginTop: 4,
                        }}>
                          🔗 {r.label}
                        </a>
                      ))}
                      {/* Ora reply for this step */}
                      {oraReplies[i] && (
                        <div style={{
                          marginTop: 8,
                          background: 'rgba(0,212,170,0.07)',
                          border: '1px solid rgba(0,212,170,0.2)',
                          borderRadius: 8,
                          padding: '8px 12px',
                          fontSize: 12,
                          color: 'rgba(248,248,252,0.75)',
                          lineHeight: 1.55,
                          fontStyle: 'italic',
                        }}>
                          <span style={{ color: '#00d4aa', fontStyle: 'normal', fontWeight: 700 }}>◈ </span>
                          {oraReplies[i]}
                        </div>
                      )}
                    </div>

                    {/* Ask Ora button */}
                    {!step.completed && (
                      <AskOraStep
                        goalId={goal.id}
                        stepIndex={i}
                        stepText={step.text}
                        onOraReply={(reply) => setOraReplies((prev) => ({ ...prev, [i]: reply }))}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ marginTop: 12 }}>
              <button
                onClick={handleBreakdown}
                disabled={breaking}
                style={{
                  background: breaking ? 'rgba(0,212,170,0.05)' : 'rgba(0,212,170,0.1)',
                  border: '1px solid rgba(0,212,170,0.3)',
                  color: '#00d4aa',
                  padding: '12px 16px',
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 600,
                  width: '100%',
                  transition: 'all 0.2s',
                }}
              >
                {breaking
                  ? <span>◈ <span style={{ animation: 'pulse 1s ease-in-out infinite', display: 'inline-block' }}>Ora is breaking this down…</span></span>
                  : '✦ Ask Ora to break this down'}
              </button>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            {progress >= 1 && (
              <button
                onClick={handleComplete}
                disabled={completing}
                style={{
                  flex: 1,
                  background: '#10b981', color: '#fff',
                  padding: '11px', borderRadius: 10, fontSize: 13, fontWeight: 700,
                }}
              >
                {completing ? '…' : '🎉 Mark Complete'}
              </button>
            )}
            <button
              onClick={handleDelete}
              style={{
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.2)',
                color: '#ef4444',
                padding: '11px 16px', borderRadius: 10, fontSize: 13,
              }}
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Quick inline goal creation bar
function QuickAddGoal({ onClarify }: { onClarify: (title: string) => void }) {
  const [focused, setFocused] = useState(false);
  const [title, setTitle] = useState('');
  const [domain, setDomain] = useState('');
  const [creating, setCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { show } = useToast();
  const [searchParams] = useSearchParams();

  // A/B: goals_input_placeholder
  const { variant: placeholderVariant, trackEvent: trackGoalEvent } = useExperiment('goals_input_placeholder');
  const GOAL_PLACEHOLDERS: Record<string, string> = {
    A: 'I want to…',
    B: 'What do you want?',
    C: 'My goal is to…',
    D: 'Tell Ora what you want',
  };
  const goalPlaceholder = GOAL_PLACEHOLDERS[placeholderVariant] || GOAL_PLACEHOLDERS['A'];

  // Auto-focus when navigated here from HomePage with ?focus=true
  useEffect(() => {
    if (searchParams.get('focus') === 'true') {
      setTimeout(() => {
        inputRef.current?.focus();
        setFocused(true);
      }, 150);
    }
  }, [searchParams]);

  const handleSubmit = async () => {
    if (!title.trim() || creating) return;
    setCreating(true);
    try {
      trackGoalEvent('goal_clarification_started', 1);
      onClarify(title.trim());
      setTitle('');
      setDomain('');
      setFocused(false);
    } catch (e) {
      console.error('Start clarification failed:', e);
      show('Could not start Ora right now.', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
    if (e.key === 'Escape') { setFocused(false); setTitle(''); setDomain(''); }
  };

  return (
    <div style={{
      background: focused ? '#12121a' : 'rgba(255,255,255,0.03)',
      border: `1px solid ${focused ? 'rgba(0,212,170,0.35)' : 'rgba(255,255,255,0.08)'}`,
      borderRadius: 14,
      marginBottom: 20,
      overflow: 'hidden',
      transition: 'all 0.2s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}>
        <span style={{ fontSize: 18, color: '#00d4aa', flexShrink: 0 }}>+</span>
        <input
          ref={inputRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onFocus={() => setFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder={goalPlaceholder}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            color: '#f8f8fc',
            fontSize: 15,
            fontWeight: 500,
            padding: 0,
            outline: 'none',
            width: '100%',
          }}
        />
        {title.trim() && (
          <button
            onClick={handleSubmit}
            disabled={creating}
            style={{
              background: '#00d4aa', color: '#0a0a0f',
              padding: '6px 14px', borderRadius: 8,
              fontSize: 13, fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {creating ? '…' : '→'}
          </button>
        )}
      </div>

      {/* Domain selector — shows when focused */}
      {focused && (
        <div style={{
          display: 'flex', gap: 8, padding: '0 16px 14px',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          paddingTop: 12,
        }} className="fade-in">
          <span style={{ fontSize: 11, color: 'rgba(248,248,252,0.35)', fontWeight: 600, letterSpacing: 0.5, alignSelf: 'center' }}>DOMAIN</span>
          {Object.entries(DOMAIN_CONFIG).map(([d, cfg]) => (
            <button
              key={d}
              type="button"
              onClick={() => setDomain(domain === d ? '' : d)}
              style={{
                padding: '5px 10px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                background: domain === d ? cfg.color + '22' : 'rgba(255,255,255,0.05)',
                border: domain === d ? `1px solid ${cfg.color}55` : '1px solid rgba(255,255,255,0.08)',
                color: domain === d ? cfg.color : 'rgba(248,248,252,0.4)',
              }}
            >
              {cfg.emoji} {d}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [clarifyingGoal, setClarifyingGoal] = useState<string | null>(null);
  const { show } = useToast();

  useEffect(() => {
    OraClient.listGoals().then(setGoals).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleUpdate = (updated: Goal) => {
    setGoals((prev) => prev.map((g) => g.id === updated.id ? updated : g));
  };

  const handleDelete = (id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
  };

  const handleClarifiedGoal = async (structuredGoal: any, iooPath: any[]) => {
    const title = structuredGoal?.title || clarifyingGoal || 'New goal';
    const descriptionParts = [
      structuredGoal?.why ? `Why: ${structuredGoal.why}` : null,
      structuredGoal?.specifics ? `Specifics: ${structuredGoal.specifics}` : null,
      structuredGoal?.timeline ? `Timeline: ${structuredGoal.timeline}` : null,
      structuredGoal?.constraints ? `Constraints: ${structuredGoal.constraints}` : null,
    ].filter(Boolean);

    const steps = iooPath.slice(0, 5).map((node, i) => ({
      id: node.id || `${Date.now()}-${i}`,
      text: node.title || `Step ${i + 1}`,
      detail: node.description,
      resources: [],
      completed: false,
      order: i,
      ora_note: node.domain ? `IOO path • ${node.domain}` : undefined,
    }));

    const goal = await OraClient.createGoal(
      title,
      descriptionParts.join('\n') || undefined,
      undefined,
      steps.length ? steps : undefined,
    );
    setGoals((prev) => [goal, ...prev]);
    setClarifyingGoal(null);
    show('✦ Goal created!', 'success');
  };

  return (
    <div className="page-content" style={{ maxWidth: 640, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingTop: 8 }}>
        <div>
          <h1 style={{ fontWeight: 800, fontSize: 24, letterSpacing: -0.5 }}>◎ What do you want?</h1>
          <p style={{ fontSize: 13, color: 'rgba(248,248,252,0.4)', marginTop: 4 }}>
            {goals.length} active goal{goals.length !== 1 ? 's' : ''}
          </p>
        </div>
        {/* Domain legend compact */}
        <div style={{ display: 'flex', gap: 6 }}>
          {Object.entries(DOMAIN_CONFIG).map(([name, cfg]) => (
            <span key={name} style={{ fontSize: 16 }} title={name}>{cfg.emoji}</span>
          ))}
        </div>
      </div>

      {/* Quick add */}
      <QuickAddGoal onClarify={setClarifyingGoal} />

      {/* Goal starter cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10, marginBottom: 20 }}>
        {GOAL_STARTERS.map((starter) => (
          <button
            key={starter.title}
            onClick={() => setClarifyingGoal(starter.title)}
            style={{
              textAlign: 'left', padding: 14, borderRadius: 14,
              background: 'rgba(255,255,255,0.035)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#f8f8fc',
            }}
          >
            <div style={{ fontSize: 20, marginBottom: 8 }}>{starter.emoji}</div>
            <div style={{ fontSize: 13, fontWeight: 750 }}>{starter.title}</div>
            <div style={{ fontSize: 11, color: DOMAIN_CONFIG[starter.domain].color, marginTop: 4 }}>{starter.domain}</div>
          </button>
        ))}
      </div>

      {/* Goals list */}
      {loading ? (
        <>
          <GoalSkeleton />
          <GoalSkeleton />
          <GoalSkeleton />
        </>
      ) : goals.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <div style={{ fontSize: 56, marginBottom: 16, display: 'inline-block' }} className="brain-float">◎</div>
          <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 18 }}>No goals yet</div>
          <div style={{ color: 'rgba(248,248,252,0.4)', maxWidth: 260, margin: '0 auto', lineHeight: 1.6 }}>
            Tap a starter or type your own goal. Ora will clarify it before building your path.
          </div>
        </div>
      ) : (
        <div>
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} onUpdate={handleUpdate} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {clarifyingGoal && (
        <GoalClarifyModal
          goalTitle={clarifyingGoal}
          onClose={() => setClarifyingGoal(null)}
          onComplete={handleClarifiedGoal}
        />
      )}
    </div>
  );
}
