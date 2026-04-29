import React, { useState, useEffect } from 'react';
import { OraClient } from '../lib/OraClient';
import { authStorage } from '../lib/OraClient';
import { useExperiment } from '../lib/useExperiment';

const TIER_CONFIG: Record<string, { color: string; label: string }> = {
  observer:    { color: '#6b7280', label: 'Observer' },
  contributor: { color: '#3b82f6', label: 'Contributor' },
  builder:     { color: '#8b5cf6', label: 'Builder' },
  steward:     { color: '#f4c26b', label: 'Steward' },
};

function TierBadge({ tier, isFoundingSteward }: { tier: string; isFoundingSteward?: boolean }) {
  if (isFoundingSteward) {
    return (
      <span style={{
        border: '1px solid #fbbf24',
        background: 'rgba(251,191,36,0.1)',
        color: '#fbbf24',
        fontSize: 10, fontWeight: 700, letterSpacing: 0.3,
        padding: '2px 7px', borderRadius: 5,
      }}>⚡ Founding Steward</span>
    );
  }
  const cfg = TIER_CONFIG[tier] || TIER_CONFIG.observer;
  return (
    <span style={{
      border: `1px solid ${cfg.color}`,
      color: cfg.color,
      fontSize: 10, fontWeight: 600,
      padding: '2px 7px', borderRadius: 5,
    }}>
      {cfg.label}
    </span>
  );
}

function ContributorRow({ item, rank }: { item: any; rank: number }) {
  const medals: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };
  const medal = medals[rank] || `#${rank}`;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      background: item.is_founding_steward ? 'rgba(251,191,36,0.04)' : '#12121a',
      border: `1px solid ${item.is_founding_steward ? 'rgba(251,191,36,0.3)' : 'rgba(255,255,255,0.07)'}`,
      borderRadius: 12, padding: 12, marginBottom: 8,
    }}>
      <div style={{ width: 28, textAlign: 'center' as const, fontSize: 18, flexShrink: 0 }}>{medal}</div>
      {item.github_avatar_url ? (
        <img src={item.github_avatar_url} alt="" style={{ width: 40, height: 40, borderRadius: 20, background: '#1a1a2e', flexShrink: 0 }} />
      ) : (
        <div style={{ width: 40, height: 40, borderRadius: 20, background: '#1a1a2e', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>👤</div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' as const, marginBottom: 3 }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>{item.display_name || item.github_username}</span>
          {item.is_founding_steward && <span style={{ color: '#fbbf24', fontSize: 14 }}>⚡</span>}
          <TierBadge tier={item.tier} isFoundingSteward={item.is_founding_steward} />
        </div>
        {item.recent_contribution_title && (
          <div style={{ fontSize: 12, color: 'rgba(248,248,252,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
            {item.recent_contribution_title}
          </div>
        )}
        {item.cp_this_month > 0 && (
          <div style={{ fontSize: 11, color: '#34d399', marginTop: 2, fontWeight: 500 }}>+{item.cp_this_month} CP this month</div>
        )}
      </div>
      <div style={{ textAlign: 'right' as const, flexShrink: 0 }}>
        <div style={{ color: '#f4c26b', fontWeight: 700, fontSize: 16 }}>{(item.total_cp || 0).toLocaleString()}</div>
        <div style={{ fontSize: 10, color: 'rgba(248,248,252,0.35)', letterSpacing: 0.5 }}>CP total</div>
      </div>
    </div>
  );
}

function FoundingStewardCard({ item, number }: { item: any; number: number }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.2)',
      borderRadius: 12, padding: 12, marginBottom: 8,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 16,
        background: 'rgba(251,191,36,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fbbf24', fontSize: 13, fontWeight: 800, flexShrink: 0,
      }}>#{number}</div>
      {item.github_avatar_url && (
        <img src={item.github_avatar_url} alt="" style={{ width: 38, height: 38, borderRadius: 19, flexShrink: 0 }} />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14 }}>
          {item.display_name || item.github_username} <span style={{ color: '#fbbf24' }}>⚡</span>
        </div>
        <div style={{ fontSize: 11, color: 'rgba(248,248,252,0.4)' }}>
          @{item.github_username} · {(item.total_cp || 0).toLocaleString()} CP
        </div>
      </div>
    </div>
  );
}

// ─── Difficulty badge ──────────────────────────────────────────────────────
function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const cfg: Record<string, { color: string; bg: string }> = {
    easy:   { color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
    medium: { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
    hard:   { color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
  };
  const c = cfg[difficulty] || cfg.medium;
  return (
    <span style={{ background: c.bg, color: c.color, fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 5 }}>
      {difficulty}
    </span>
  );
}

// ─── Task Card ─────────────────────────────────────────────────────────────
function TaskCard({ task, onClaim }: { task: any; onClaim: (task: any) => void }) {
  return (
    <div style={{
      background: '#12121a',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 14,
      padding: 16,
      display: 'flex',
      flexDirection: 'column' as const,
      gap: 10,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.4, flex: 1 }}>{task.title}</div>
        <div style={{
          background: 'rgba(139,92,246,0.15)',
          border: '1px solid rgba(139,92,246,0.4)',
          color: '#a78bfa',
          fontSize: 12, fontWeight: 800,
          padding: '4px 10px', borderRadius: 8, flexShrink: 0,
          whiteSpace: 'nowrap' as const,
        }}>+{task.cp_reward} CP</div>
      </div>
      <div style={{ fontSize: 12, color: 'rgba(248,248,252,0.45)', lineHeight: 1.5 }}>{task.description}</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const, alignItems: 'center' }}>
        <DifficultyBadge difficulty={task.difficulty} />
        {(task.skills || []).map((s: string) => (
          <span key={s} style={{
            background: 'rgba(99,102,241,0.1)', color: '#818cf8',
            fontSize: 10, padding: '2px 6px', borderRadius: 4, fontWeight: 600,
          }}>{s}</span>
        ))}
        {task.source === 'github' && (
          <span style={{ fontSize: 10, color: 'rgba(248,248,252,0.3)', marginLeft: 'auto' }}>GitHub Issue</span>
        )}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
        <button
          onClick={() => onClaim(task)}
          style={{
            flex: 1,
            background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
            color: '#fff',
            fontSize: 13, fontWeight: 700,
            padding: '10px 16px', borderRadius: 10, border: 'none',
            cursor: 'pointer',
          }}
        >
          Claim Task
        </button>
        {task.github_url && (
          <a
            href={task.github_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '10px 14px', borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(248,248,252,0.5)', fontSize: 13,
              textDecoration: 'none', display: 'flex', alignItems: 'center',
            }}
          >↗</a>
        )}
      </div>
    </div>
  );
}

// ─── Claim / Submit Modal ──────────────────────────────────────────────────
function ClaimModal({
  task,
  onClose,
  onSubmit,
}: {
  task: any;
  onClose: () => void;
  onSubmit: (taskId: string, prUrl: string, notes: string) => void;
}) {
  const [step, setStep] = useState<'claimed' | 'submit'>('claimed');
  const [prUrl, setPrUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!prUrl.trim()) return;
    setSubmitting(true);
    await onSubmit(task.id, prUrl, notes);
    setSubmitting(false);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }} onClick={onClose}>
      <div
        style={{
          background: '#13131e', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '20px 20px 0 0', padding: 24, width: '100%', maxWidth: 540,
          maxHeight: '90vh', overflowY: 'auto' as const,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {step === 'claimed' ? (
          <>
            <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 6 }}>✅ Task Claimed!</div>
            <div style={{ fontSize: 14, color: 'rgba(248,248,252,0.55)', marginBottom: 16, lineHeight: 1.6 }}>
              You have <strong>48 hours</strong> to complete <strong>{task.title}</strong> and submit a PR.
            </div>
            <div style={{
              background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)',
              borderRadius: 10, padding: 12, marginBottom: 20, fontSize: 13, color: 'rgba(248,248,252,0.6)',
            }}>
              💡 Fork the repo, make your changes, and open a pull request. Then come back here to submit.
            </div>
            <button
              onClick={() => setStep('submit')}
              style={{
                width: '100%', background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                color: '#fff', fontSize: 15, fontWeight: 700,
                padding: '14px 0', borderRadius: 12, border: 'none', cursor: 'pointer',
              }}
            >Submit via PR →</button>
          </>
        ) : (
          <>
            <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 6 }}>📬 Submit Your PR</div>
            <div style={{ fontSize: 13, color: 'rgba(248,248,252,0.45)', marginBottom: 16 }}>
              Paste your pull request URL and we'll award 50 CP immediately, with more on merge.
            </div>
            <label style={{ fontSize: 12, color: 'rgba(248,248,252,0.5)', fontWeight: 600, display: 'block', marginBottom: 6 }}>
              PR URL *
            </label>
            <input
              type="url"
              value={prUrl}
              onChange={(e) => setPrUrl(e.target.value)}
              placeholder="https://github.com/AvielCarlos/connectome-backend/pull/42"
              style={{
                width: '100%', background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10, padding: '12px 14px', color: '#f8f8fc', fontSize: 14,
                marginBottom: 14, boxSizing: 'border-box' as const,
              }}
            />
            <label style={{ fontSize: 12, color: 'rgba(248,248,252,0.5)', fontWeight: 600, display: 'block', marginBottom: 6 }}>
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What did you build? Any context for reviewers..."
              rows={3}
              style={{
                width: '100%', background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10, padding: '12px 14px', color: '#f8f8fc', fontSize: 14,
                marginBottom: 20, resize: 'vertical' as const, boxSizing: 'border-box' as const,
              }}
            />
            <button
              onClick={handleSubmit}
              disabled={!prUrl.trim() || submitting}
              style={{
                width: '100%',
                background: prUrl.trim() ? 'linear-gradient(135deg, #00d4aa, #6366f1)' : 'rgba(255,255,255,0.1)',
                color: prUrl.trim() ? '#0a0a0f' : 'rgba(248,248,252,0.3)',
                fontSize: 15, fontWeight: 700,
                padding: '14px 0', borderRadius: 12, border: 'none',
                cursor: prUrl.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              {submitting ? 'Submitting...' : '🚀 Submit & Earn 50 CP'}
            </button>
          </>
        )}
        <button
          onClick={onClose}
          style={{ marginTop: 12, width: '100%', background: 'transparent', color: 'rgba(248,248,252,0.35)', fontSize: 14, padding: '10px 0', border: 'none', cursor: 'pointer' }}
        >Cancel</button>
      </div>
    </div>
  );
}

// ─── Main DAO Page ─────────────────────────────────────────────────────────
export default function DAOPage() {
  // ─── A/B experiments ────────────────────────────────────────────────────
  const { variant: taskDisplayVariant } = useExperiment('dao_task_display');
  const { variant: firstCTAVariant, trackEvent: trackDAOEvent } = useExperiment('dao_first_cta');

  const DAO_FIRST_CTA: Record<string, string> = {
    A: 'Claim a Task →',
    B: 'Earn your first CP →',
    C: 'Start Contributing →',
  };

  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [daoStats, setDaoStats] = useState<any>(null);
  const [foundingStewards, setFoundingStewards] = useState<any>(null);
  const [contributions, setContributions] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'tasks' | 'leaderboard' | 'contributions'>('tasks');
  const [claimedTask, setClaimedTask] = useState<any>(null);
  const [toast, setToast] = useState('');
  const isLoggedIn = authStorage.isAuthenticated();
  const profile = (authStorage as any).getProfile?.() || null;

  const cpBalance = profile?.total_dao_cp ?? profile?.contributor?.cp_balance ?? null;

  useEffect(() => {
    Promise.all([
      OraClient.getDAOLeaderboard(20).catch(() => null),
      OraClient.getFoundingStewards().catch(() => null),
      OraClient.getDAOContributions(15).catch(() => null),
      OraClient.getDAOTasks().catch(() => null),
    ]).then(([lb, fs, contribs, t]) => {
      if (lb) {
        setLeaderboard(lb.leaderboard || []);
        setDaoStats({ total_contributors: lb.total_contributors, total_cp_awarded: lb.total_cp_awarded });
      }
      if (fs) setFoundingStewards(fs);
      if (contribs) setContributions(contribs.contributions || []);
      if (t) setTasks(t.tasks || []);
    }).finally(() => setLoading(false));
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  const handleClaim = async (task: any) => {
    if (!isLoggedIn) { showToast('Sign in to claim tasks'); return; }
    try {
      await OraClient.claimDAOTask(task.id);
      setClaimedTask(task);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Could not claim task';
      showToast(msg);
    }
  };

  const handleSubmit = async (taskId: string, prUrl: string, notes: string) => {
    try {
      const res = await OraClient.submitDAOTask(taskId, prUrl, notes);
      showToast(res.message || `Submitted! ${res.cp_awarded || 50} CP awarded 🎉`);
    } catch (err: any) {
      showToast('Submission failed. Please try again.');
    }
  };

  return (
    <div className="page-content" style={{ maxWidth: 640, margin: '0 auto' }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
          background: '#1a1a2e', border: '1px solid rgba(0,212,170,0.3)',
          color: '#f8f8fc', padding: '12px 20px', borderRadius: 12,
          fontSize: 14, fontWeight: 600, zIndex: 2000, maxWidth: 340,
          boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
        }}>{toast}</div>
      )}

      {/* Claim Modal */}
      {claimedTask && (
        <ClaimModal
          task={claimedTask}
          onClose={() => setClaimedTask(null)}
          onSubmit={handleSubmit}
        />
      )}

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontWeight: 800, fontSize: 24, letterSpacing: -0.5 }}>◈ Ascension DAO</h1>
        {daoStats && (
          <p style={{ fontSize: 13, color: 'rgba(248,248,252,0.4)', marginTop: 4 }}>
            {daoStats.total_contributors} contributors · {(daoStats.total_cp_awarded || 0).toLocaleString()} CP awarded
          </p>
        )}
      </div>

      {/* CP Balance (if logged in) */}
      {isLoggedIn && cpBalance != null && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(99,102,241,0.1))',
          border: '1px solid rgba(139,92,246,0.3)',
          borderRadius: 14, padding: '14px 18px', marginBottom: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 12, color: 'rgba(248,248,252,0.45)', fontWeight: 600, letterSpacing: 0.5, marginBottom: 4 }}>YOUR CP BALANCE</div>
            <div style={{ fontWeight: 800, fontSize: 28, color: '#a78bfa', letterSpacing: -1 }}>
              {cpBalance.toLocaleString()} CP
            </div>
          </div>
          <div style={{ textAlign: 'right' as const }}>
            <div style={{ fontSize: 11, color: 'rgba(248,248,252,0.35)' }}>
              {cpBalance >= 3000 ? '⚡ Steward' : cpBalance >= 500 ? '⬡ Builder' : cpBalance >= 100 ? '◆ Contributor' : '○ Observer'}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(248,248,252,0.25)', marginTop: 2 }}>
              {cpBalance < 3000 ? `${(3000 - cpBalance).toLocaleString()} CP to Founding Steward` : 'Founding Steward eligible!'}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {([
          { id: 'tasks', label: '⚡ Open Tasks' },
          { id: 'leaderboard', label: '🏆 Leaderboard' },
          { id: 'contributions', label: '📌 Feed' },
        ] as const).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '8px 14px', borderRadius: 10,
              fontSize: 12, fontWeight: 600,
              background: tab === t.id ? '#00d4aa' : 'rgba(255,255,255,0.07)',
              color: tab === t.id ? '#0a0a0f' : 'rgba(248,248,252,0.6)',
              border: 'none', cursor: 'pointer',
            }}
          >{t.label}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: 'rgba(248,248,252,0.3)' }}>Loading...</div>
      ) : (
        <>
          {/* ── TASKS TAB ── */}
          {tab === 'tasks' && (
            <div>
              {/* How to Earn CP */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(0,212,170,0.06), rgba(99,102,241,0.06))',
                border: '1px solid rgba(0,212,170,0.15)',
                borderRadius: 14, padding: 16, marginBottom: 20,
              }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>💡 How to Earn CP</div>
                {[
                  { icon: '1️⃣', text: DAO_FIRST_CTA[firstCTAVariant] || 'Claim a task below' },
                  { icon: '2️⃣', text: 'Complete it → open a PR' },
                  { icon: '3️⃣', text: 'Submit your PR here → earn 50 CP instantly' },
                  { icon: '4️⃣', text: 'Full CP awarded on merge. LTV model: keep earning monthly.' },
                ].map((step) => (
                  <div key={step.icon} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 6, fontSize: 13, color: 'rgba(248,248,252,0.7)' }}>
                    <span>{step.icon}</span>
                    <span>{step.text}</span>
                  </div>
                ))}
                <div style={{ marginTop: 12, padding: '10px 12px', background: 'rgba(251,191,36,0.08)', borderRadius: 10, border: '1px solid rgba(251,191,36,0.2)' }}>
                  <div style={{ fontSize: 12, color: '#fbbf24', fontWeight: 700 }}>⚡ Founding Steward Status</div>
                  <div style={{ fontSize: 12, color: 'rgba(248,248,252,0.55)', marginTop: 4 }}>
                    First 10 contributors to reach <strong>3,000 CP</strong> become Founding Stewards — getting equity-equivalent governance tokens.
                  </div>
                </div>
              </div>

              {/* Task grid — layout driven by dao_task_display A/B variant */}
              {tasks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'rgba(248,248,252,0.35)' }}>No open tasks right now.</div>
              ) : (
                <div style={{
                  display: taskDisplayVariant === 'A' ? 'grid' : 'flex',
                  flexDirection: taskDisplayVariant === 'B' ? 'column' : undefined,
                  flexWrap: taskDisplayVariant === 'C' ? 'wrap' : undefined,
                  gridTemplateColumns: taskDisplayVariant === 'A' ? 'repeat(auto-fill, minmax(280px, 1fr))' : undefined,
                  gap: 12,
                }}>
                  {tasks.map((task: any) => (
                    <TaskCard key={task.id} task={task} onClaim={(t) => { trackDAOEvent('task_claim', 1); handleClaim(t); }} />
                  ))}
                </div>
              )}

              {/* Quick-contribute panel */}
              <div style={{
                marginTop: 28,
                background: '#12121a',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 14, padding: 16,
              }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Don't code? You can still earn CP:</div>
                <div style={{ fontSize: 12, color: 'rgba(248,248,252,0.4)', marginBottom: 14 }}>
                  Every action helps grow Connectome. Every action earns CP.
                </div>
                {[
                  {
                    icon: '⭐',
                    label: 'Write a review',
                    sub: 'App Store or Google Play',
                    href: 'https://apps.apple.com/search?term=connectome',
                  },
                  {
                    icon: '🐦',
                    label: 'Share on Twitter',
                    sub: 'Spread the word',
                    href: `https://twitter.com/intent/tweet?text=${encodeURIComponent('Just discovered Connectome by @OraAI — an AI OS for personal growth. Check it out! https://avielcarlos.github.io/connectome-web/')}`,
                  },
                  {
                    icon: '🔗',
                    label: 'Invite a friend',
                    sub: 'Referral link',
                    href: 'https://avielcarlos.github.io/connectome-web/',
                  },
                  {
                    icon: '🐛',
                    label: 'Report a bug',
                    sub: 'GitHub Issues',
                    href: 'https://github.com/AvielCarlos/connectome-web/issues/new?labels=bug&template=bug_report.md',
                  },
                ].map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)',
                      textDecoration: 'none',
                    }}
                  >
                    <span style={{ fontSize: 20, width: 28, textAlign: 'center' as const }}>{item.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#f8f8fc' }}>{item.label}</div>
                      <div style={{ fontSize: 11, color: 'rgba(248,248,252,0.35)' }}>{item.sub}</div>
                    </div>
                    <span style={{ color: 'rgba(248,248,252,0.3)', fontSize: 16 }}>→</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* ── LEADERBOARD TAB ── */}
          {tab === 'leaderboard' && (
            <div>
              <div style={{
                background: '#12121a', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 12, padding: '12px 16px', marginBottom: 20,
              }}>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' as const }}>
                  {Object.entries(TIER_CONFIG).map(([key, cfg]) => (
                    <span key={key} style={{ fontSize: 11, color: cfg.color }}>{cfg.label}</span>
                  ))}
                  <span style={{ fontSize: 11, color: '#fbbf24' }}>⚡ Founding Steward</span>
                </div>
              </div>
              <div style={{ fontSize: 12, color: 'rgba(248,248,252,0.3)', fontWeight: 700, letterSpacing: 1, marginBottom: 12 }}>TOP CONTRIBUTORS</div>
              {leaderboard.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'rgba(248,248,252,0.35)' }}>No contributors yet. Be the first!</div>
              ) : (
                leaderboard.map((item, i) => (
                  <ContributorRow key={item.id || i} item={item} rank={i + 1} />
                ))
              )}
              {foundingStewards?.founding_stewards?.length > 0 && (
                <div style={{ marginTop: 28 }}>
                  <div style={{ fontSize: 17, fontWeight: 700, color: '#fbbf24', marginBottom: 8 }}>⚡ Founding Stewards</div>
                  <p style={{ fontSize: 13, color: 'rgba(248,248,252,0.45)', lineHeight: 1.6, marginBottom: 14 }}>
                    The first 10 people to reach Steward tier are permanently recognized as Founding Stewards.
                    {foundingStewards.slots_remaining > 0
                      ? ` ${foundingStewards.slots_remaining} slots remaining.`
                      : ' All 10 seats filled.'}
                  </p>
                  {foundingStewards.founding_stewards.map((item: any) => (
                    <FoundingStewardCard key={item.id} item={item} number={item.founding_steward_number} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── CONTRIBUTIONS TAB ── */}
          {tab === 'contributions' && (
            <div>
              <div style={{ fontSize: 12, color: 'rgba(248,248,252,0.3)', fontWeight: 700, letterSpacing: 1, marginBottom: 12 }}>RECENT CONTRIBUTIONS</div>
              {contributions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'rgba(248,248,252,0.35)' }}>No contributions yet.</div>
              ) : (
                contributions.map((item: any) => {
                  const typeEmoji: Record<string, string> = {
                    code: '💻', agent: '🧠', design: '🎨', doc: '📝', research: '🔬', feedback: '💬', community: '🌐',
                  };
                  return (
                    <div key={item.id} style={{
                      background: '#12121a', border: '1px solid rgba(255,255,255,0.07)',
                      borderRadius: 12, padding: 14, marginBottom: 8,
                    }}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <span style={{ fontSize: 20, flexShrink: 0 }}>{typeEmoji[item.contribution_type] || '📌'}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.4 }}>{item.title}</div>
                          <div style={{ fontSize: 12, color: 'rgba(248,248,252,0.4)', marginTop: 2 }}>
                            @{item.github_username}
                            {item.tier ? ` · ${TIER_CONFIG[item.tier]?.label || item.tier}` : ''}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' as const, flexShrink: 0 }}>
                          <div style={{ color: '#f4c26b', fontWeight: 700 }}>{item.final_cp}</div>
                          <div style={{ fontSize: 10, color: 'rgba(248,248,252,0.35)' }}>CP</div>
                        </div>
                      </div>
                      {item.ora_evaluation && (
                        <div style={{
                          marginTop: 10, background: 'rgba(99,102,241,0.08)',
                          borderLeft: '2px solid #6366f1', borderRadius: '0 8px 8px 0',
                          padding: '8px 12px',
                        }}>
                          <div style={{ fontSize: 9, color: '#6366f1', fontWeight: 700, letterSpacing: 0.5, marginBottom: 3 }}>ORA'S TAKE</div>
                          <div style={{ fontSize: 12, color: 'rgba(248,248,252,0.55)', fontStyle: 'italic', lineHeight: 1.5 }}>
                            {item.ora_evaluation}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
              {/* CP guide */}
              <div style={{ marginTop: 20, background: '#12121a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>CP Guide</div>
                {[
                  { type: 'Code / Feature', range: '100–500 CP' },
                  { type: 'Agent Improvement', range: '200–800 CP' },
                  { type: 'Design', range: '50–300 CP' },
                  { type: 'Documentation', range: '25–150 CP' },
                  { type: 'Community', range: '50–200 CP' },
                ].map((row) => (
                  <div key={row.type} style={{
                    display: 'flex', justifyContent: 'space-between',
                    padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 13,
                  }}>
                    <span>{row.type}</span>
                    <span style={{ color: '#f4c26b', fontWeight: 600 }}>{row.range}</span>
                  </div>
                ))}
                <p style={{ fontSize: 11, color: 'rgba(248,248,252,0.35)', marginTop: 10, lineHeight: 1.6 }}>
                  Contributions that keep generating value keep earning CP monthly via LTV scoring.
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
