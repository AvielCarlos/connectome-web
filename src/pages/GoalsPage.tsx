import React, { useState, useEffect } from 'react';
import { OraClient, Goal } from '../lib/OraClient';

const DOMAIN_CONFIG: Record<string, { emoji: string; color: string }> = {
  iVive:  { emoji: '🌱', color: '#10b981' },
  Eviva:  { emoji: '🌊', color: '#6366f1' },
  Aventi: { emoji: '✨', color: '#f59e0b' },
};

function DomainBadge({ domain }: { domain?: string }) {
  if (!domain) return null;
  const cfg = DOMAIN_CONFIG[domain] || { emoji: '◈', color: '#00d4aa' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: cfg.color + '18',
      border: `1px solid ${cfg.color}44`,
      color: cfg.color,
      fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
      padding: '2px 8px', borderRadius: 20,
    }}>
      {cfg.emoji} {domain}
    </span>
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

  const completedSteps = goal.steps?.filter((s) => s.completed).length || 0;
  const totalSteps = goal.steps?.length || 0;
  const progress = totalSteps > 0 ? completedSteps / totalSteps : goal.progress || 0;

  const handleBreakdown = async () => {
    setBreaking(true);
    try {
      const updated = await OraClient.breakdownGoal(goal.id);
      onUpdate(updated);
      setExpanded(true);
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
    } catch (e) {
      console.error('Complete goal failed:', e);
    } finally {
      setCompleting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this goal?')) return;
    try {
      await OraClient.deleteGoal(goal.id);
      onDelete(goal.id);
    } catch (e) {
      console.error('Delete failed:', e);
    }
  };

  return (
    <div style={{
      background: '#12121a',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 16,
      marginBottom: 12,
      overflow: 'hidden',
      transition: 'all 0.2s',
    }}>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <div style={{
              width: 40, height: 40,
              borderRadius: 20,
              background: `conic-gradient(#00d4aa ${progress * 360}deg, rgba(255,255,255,0.08) 0deg)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative',
            }}>
              <div style={{
                position: 'absolute',
                width: 30, height: 30, borderRadius: 15,
                background: '#12121a',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 800, color: '#00d4aa',
              }}>
                {Math.round(progress * 100)}%
              </div>
            </div>
            <span style={{ fontSize: 12, color: 'rgba(248,248,252,0.3)', transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>
              ▶
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progress * 100}%` }} />
        </div>
      </div>

      {/* Steps */}
      {expanded && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '4px 20px 16px' }}>
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
                <div key={step.id || i} style={{
                  display: 'flex',
                  gap: 12,
                  padding: '10px 0',
                  borderBottom: i < goal.steps.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                  alignItems: 'flex-start',
                }}>
                  <div
                    style={{
                      width: 20, height: 20, borderRadius: 4,
                      border: step.completed ? 'none' : '1.5px solid rgba(255,255,255,0.25)',
                      background: step.completed ? '#00d4aa' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, cursor: 'pointer', marginTop: 2,
                      transition: 'all 0.15s',
                    }}
                    onClick={async () => {
                      const updatedSteps = goal.steps.map((s, si) =>
                        si === i ? { ...s, completed: !s.completed } : s
                      );
                      try {
                        const updated = await OraClient.updateGoal(goal.id, { steps: updatedSteps });
                        onUpdate(updated);
                      } catch { /* local optimistic */ }
                    }}
                  >
                    {step.completed && <span style={{ fontSize: 12, color: '#0a0a0f', fontWeight: 900 }}>✓</span>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 14, fontWeight: 500,
                      color: step.completed ? 'rgba(248,248,252,0.35)' : '#f8f8fc',
                      textDecoration: step.completed ? 'line-through' : 'none',
                      lineHeight: 1.5,
                    }}>
                      {step.text}
                    </div>
                    {step.ora_note && (
                      <div style={{
                        fontSize: 12, color: '#00d4aa', fontStyle: 'italic',
                        marginTop: 4, lineHeight: 1.5,
                      }}>
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
                  background: 'rgba(0,212,170,0.1)',
                  border: '1px solid rgba(0,212,170,0.3)',
                  color: '#00d4aa',
                  padding: '10px 16px',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  width: '100%',
                }}
              >
                {breaking ? '◈ Ora is breaking this down...' : '✦ Ask Ora to break this down'}
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
                  background: '#10b981',
                  color: '#fff',
                  padding: '10px',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                {completing ? '...' : '🎉 Mark Complete'}
              </button>
            )}
            <button
              onClick={handleDelete}
              style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.25)',
                color: '#ef4444',
                padding: '10px 16px',
                borderRadius: 10,
                fontSize: 13,
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

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDomain, setNewDomain] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    OraClient.listGoals().then(setGoals).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const goal = await OraClient.createGoal(newTitle.trim(), newDesc.trim() || undefined, newDomain || undefined);
      setGoals((prev) => [goal, ...prev]);
      setNewTitle('');
      setNewDesc('');
      setNewDomain('');
      setShowForm(false);
    } catch (e) {
      console.error('Create goal failed:', e);
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = (updated: Goal) => {
    setGoals((prev) => prev.map((g) => g.id === updated.id ? updated : g));
  };

  const handleDelete = (id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
  };

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px 80px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontWeight: 800, fontSize: 24, letterSpacing: -0.5 }}>◎ Goals</h1>
          <p style={{ fontSize: 13, color: 'rgba(248,248,252,0.4)', marginTop: 4 }}>
            {goals.length} active goals
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            background: showForm ? 'rgba(255,255,255,0.08)' : '#00d4aa',
            color: showForm ? '#f8f8fc' : '#0a0a0f',
            padding: '10px 18px',
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          {showForm ? '✕ Cancel' : '+ New Goal'}
        </button>
      </div>

      {/* New goal form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="fade-in"
          style={{
            background: '#12121a',
            border: '1px solid rgba(0,212,170,0.25)',
            borderRadius: 16,
            padding: 20,
            marginBottom: 20,
          }}
        >
          <div style={{ fontSize: 12, color: '#00d4aa', fontWeight: 700, letterSpacing: 0.5, marginBottom: 14 }}>
            ✦ NEW GOAL
          </div>
          <div style={{ marginBottom: 12 }}>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="What do you want to achieve?"
              required
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <textarea
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Why does this matter to you? (optional)"
              style={{ minHeight: 80 }}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              {['iVive', 'Eviva', 'Aventi'].map((d) => {
                const cfg = DOMAIN_CONFIG[d];
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setNewDomain(newDomain === d ? '' : d)}
                    style={{
                      flex: 1,
                      padding: '8px 0',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 600,
                      background: newDomain === d ? cfg.color + '22' : 'rgba(255,255,255,0.05)',
                      border: newDomain === d ? `1px solid ${cfg.color}55` : '1px solid rgba(255,255,255,0.08)',
                      color: newDomain === d ? cfg.color : 'rgba(248,248,252,0.5)',
                    }}
                  >
                    {cfg.emoji} {d}
                  </button>
                );
              })}
            </div>
          </div>
          <button
            type="submit"
            disabled={creating}
            style={{
              width: '100%',
              background: '#00d4aa',
              color: '#0a0a0f',
              padding: '13px',
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 15,
            }}
          >
            {creating ? 'Creating...' : 'Create Goal →'}
          </button>
        </form>
      )}

      {/* Domain legend */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' as const }}>
        {Object.entries(DOMAIN_CONFIG).map(([name, cfg]) => (
          <div key={name} style={{
            display: 'flex', alignItems: 'center', gap: 5,
            fontSize: 11, color: cfg.color,
            background: cfg.color + '12',
            border: `1px solid ${cfg.color}30`,
            padding: '3px 10px', borderRadius: 20,
          }}>
            {cfg.emoji} {name}
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'rgba(248,248,252,0.35)' }}>Loading goals...</div>
      ) : goals.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>◎</div>
          <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 18 }}>No goals yet</div>
          <div style={{ color: 'rgba(248,248,252,0.4)', maxWidth: 260, margin: '0 auto', lineHeight: 1.6 }}>
            Set your first goal and let Ora break it into actionable steps.
          </div>
        </div>
      ) : (
        <div>
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} onUpdate={handleUpdate} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
