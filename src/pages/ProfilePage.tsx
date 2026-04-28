import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { OraClient } from '../lib/OraClient';
import { useAuth } from '../context/AuthContext';

const EXPERIMENT_ID = 'primary_landing_v1';
const VARIANTS = ['A', 'B', 'C', 'D'] as const;
const VARIANT_LABELS: Record<string, string> = {
  A: 'A — TikTok Feed',
  B: 'B — Morning Brief',
  C: 'C — Goal Pulse',
  D: 'D — Discovery Grid',
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [abResults, setAbResults] = useState<any>(null);
  const [abWinner, setAbWinner] = useState<string | null>(null);
  const [currentVariant, setCurrentVariant] = useState<string>('A');
  const [autonomyStatus, setAutonomyStatus] = useState<any>(null);
  const [runningAutonomy, setRunningAutonomy] = useState(false);
  const [proposals, setProposals] = useState<any[]>([]);
  const [proposalsLoading, setProposalsLoading] = useState(false);
  const [section, setSection] = useState<'profile' | 'ab' | 'system' | 'google'>('profile');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = await OraClient.getProfile();
      setProfile(p);
      const adminFlag = p?.profile?.is_admin || localStorage.getItem('ab_admin') === 'true';
      setIsAdmin(adminFlag);
      if (adminFlag) localStorage.setItem('ab_admin', 'true');

      const cached = localStorage.getItem(`ab_variant_${EXPERIMENT_ID}`) || 'A';
      setCurrentVariant(cached);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const loadAbResults = async () => {
    try {
      const res = await OraClient['client'].get(`/api/ab/results/${EXPERIMENT_ID}`);
      setAbResults(res.data);
      const winnerRes = await OraClient['client'].get(`/api/ab/winner/${EXPERIMENT_ID}`).catch(() => ({ data: { winner: null } }));
      setAbWinner(winnerRes.data.winner);
    } catch {}
  };

  const setVariant = (v: string) => {
    localStorage.setItem(`ab_variant_${EXPERIMENT_ID}`, v);
    localStorage.setItem(`ab_variant_ts_${EXPERIMENT_ID}`, Date.now().toString());
    setCurrentVariant(v);
    navigate('/feed');
  };

  const loadProposals = async () => {
    setProposalsLoading(true);
    try {
      const res = await OraClient['client'].get('/api/ora/autonomy/proposals');
      setProposals(res.data?.proposals || []);
    } catch {}
    setProposalsLoading(false);
  };

  const handleProposal = async (id: string, action: 'approve' | 'reject') => {
    try {
      await OraClient['client'].post(`/api/ora/autonomy/proposals/${id}/${action}`);
      await loadProposals();
    } catch (e: any) {
      alert(`Failed to ${action}: ${e?.response?.data?.detail || 'Unknown error'}`);
    }
  };

  const runAutonomy = async () => {
    setRunningAutonomy(true);
    try {
      const res = await OraClient['client'].post('/api/ora/autonomy/run');
      setAutonomyStatus(res.data);
    } catch (e: any) {
      setAutonomyStatus({ error: e?.response?.data?.detail || 'Failed' });
    }
    setRunningAutonomy(false);
  };

  const connectGoogle = () => {
    window.location.href = 'https://connectome-api-production.up.railway.app/api/auth/google/login';
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div style={{ fontSize: 32, color: '#00d4aa', animation: 'brainFloat 3s ease-in-out infinite' }}>◈</div>
      </div>
    );
  }

  const tier = profile?.subscription_tier || 'free';
  const tierColor = tier === 'sovereign' ? '#a855f7' : tier === 'explorer' ? '#3b82f6' : '#6b7280';

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '16px 16px 100px', overflowY: 'auto', height: '100%' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24, paddingTop: 8 }}>
        <div style={{
          width: 56, height: 56, borderRadius: 28,
          background: 'linear-gradient(135deg, rgba(0,212,170,0.2), rgba(0,212,170,0.4))',
          border: '2px solid rgba(0,212,170,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24,
        }}>
          {isAdmin ? '⚡' : '◉'}
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 17 }}>
            {profile?.email?.split('@')[0] || 'You'}
            {isAdmin && <span style={{ marginLeft: 8, fontSize: 11, color: '#00d4aa', background: 'rgba(0,212,170,0.1)', border: '1px solid rgba(0,212,170,0.3)', padding: '2px 8px', borderRadius: 10 }}>ADMIN</span>}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(248,248,252,0.4)', marginTop: 2 }}>{profile?.email}</div>
          <div style={{ marginTop: 4 }}>
            <span style={{ fontSize: 11, color: tierColor, background: tierColor + '15', border: `1px solid ${tierColor}33`, padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>
              {tier.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
        {(['profile', 'google', ...(isAdmin ? ['ab', 'system'] : [])] as string[]).map((s) => (
          <button
            key={s}
            onClick={() => { setSection(s as any); if (s === 'ab') loadAbResults(); }}
            style={{
              padding: '7px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700,
              background: section === s ? '#00d4aa' : 'rgba(255,255,255,0.06)',
              color: section === s ? '#0a0a0f' : 'rgba(248,248,252,0.5)',
              border: `1px solid ${section === s ? '#00d4aa' : 'rgba(255,255,255,0.1)'}`,
              whiteSpace: 'nowrap',
            }}
          >
            {s === 'profile' ? '👤 Profile' : s === 'ab' ? '🧪 A/B Tests' : s === 'system' ? '⚡ System' : '🔗 Google'}
          </button>
        ))}
      </div>

      {/* ── Profile section ── */}
      {section === 'profile' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Card title="Account">
            <Row label="Email" value={profile?.email} />
            <Row label="Member since" value={profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '—'} />
            <Row label="Fulfilment score" value={`${((profile?.fulfilment_score || 0) * 100).toFixed(0)}%`} />
            <Row label="Tier" value={tier} valueColor={tierColor} />
          </Card>

          <Card title="Current A/B Variant">
            <Row label="Landing variant" value={VARIANT_LABELS[currentVariant] || currentVariant} />
            {isAdmin && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 11, color: 'rgba(248,248,252,0.4)', marginBottom: 8 }}>Switch variant:</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {VARIANTS.map((v) => (
                    <button key={v} onClick={() => setVariant(v)} style={{
                      padding: '6px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700,
                      background: currentVariant === v ? '#00d4aa' : 'rgba(255,255,255,0.07)',
                      color: currentVariant === v ? '#0a0a0f' : 'rgba(248,248,252,0.6)',
                      border: `1px solid ${currentVariant === v ? '#00d4aa' : 'rgba(255,255,255,0.12)'}`,
                    }}>{v}</button>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {tier === 'free' && (
            <div style={{
              background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: 14, padding: '16px 18px',
            }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Upgrade to Explorer</div>
              <div style={{ fontSize: 13, color: 'rgba(248,248,252,0.5)', marginBottom: 12 }}>Unlimited cards, Drive sync, local events</div>
              <button onClick={() => navigate('/dao')} style={{
                background: '#6366f1', color: '#fff', padding: '9px 20px', borderRadius: 10, fontWeight: 700, fontSize: 13,
              }}>View plans →</button>
            </div>
          )}

          <button onClick={handleLogout} style={{
            width: '100%', padding: '13px', borderRadius: 12,
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
            color: '#ef4444', fontWeight: 700, fontSize: 14, marginTop: 8,
          }}>
            Sign out
          </button>
        </div>
      )}

      {/* ── Google section ── */}
      {section === 'google' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Card title="Google Account">
            <div style={{ fontSize: 14, color: 'rgba(248,248,252,0.6)', lineHeight: 1.6, marginBottom: 16 }}>
              Connect your Google account to enable Drive sync — Ora reads your documents and surfaces them as coaching cards.
            </div>
            <button onClick={connectGoogle} style={{
              width: '100%', padding: '12px', borderRadius: 12,
              background: '#fff', color: '#1a1a1a',
              fontWeight: 700, fontSize: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
            {isAdmin && (
              <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(0,212,170,0.06)', border: '1px solid rgba(0,212,170,0.15)', borderRadius: 10 }}>
                <div style={{ fontSize: 12, color: '#00d4aa', fontWeight: 600 }}>⚡ Admin: Your Google account grants full modulation privileges</div>
              </div>
            )}
          </Card>

          <Card title="Drive Sync">
            <div style={{ fontSize: 13, color: 'rgba(248,248,252,0.5)', marginBottom: 12 }}>
              Once connected, Ora indexes your Drive documents as personalized coaching content.
            </div>
            <button
              onClick={async () => {
                try {
                  await OraClient['client'].post('/api/drive/sync?max_files=50');
                  alert('Drive sync started — Ora is indexing your docs');
                } catch { alert('Connect Google first'); }
              }}
              style={{ width: '100%', padding: '11px', borderRadius: 10, background: 'rgba(0,212,170,0.1)', border: '1px solid rgba(0,212,170,0.25)', color: '#00d4aa', fontWeight: 700, fontSize: 13 }}
            >
              Sync Drive Now
            </button>
          </Card>
        </div>
      )}

      {/* ── A/B Tests section (admin only) ── */}
      {section === 'ab' && isAdmin && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
            {VARIANTS.map((v) => (
              <button key={v} onClick={() => setVariant(v)} style={{
                flex: 1, padding: '10px 0', borderRadius: 10, fontSize: 13, fontWeight: 800,
                background: currentVariant === v ? '#00d4aa' : 'rgba(255,255,255,0.06)',
                color: currentVariant === v ? '#0a0a0f' : 'rgba(248,248,252,0.5)',
                border: `1px solid ${currentVariant === v ? '#00d4aa' : 'rgba(255,255,255,0.1)'}`,
              }}>{v}</button>
            ))}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(248,248,252,0.3)', textAlign: 'center', marginBottom: 8 }}>
            Tap a variant to switch and test it live
          </div>

          {abWinner && (
            <div style={{ background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.25)', borderRadius: 12, padding: '12px 16px' }}>
              <div style={{ fontSize: 12, color: '#00d4aa', fontWeight: 700 }}>🏆 Current winner: Variant {abWinner} — {VARIANT_LABELS[abWinner]}</div>
            </div>
          )}

          {abResults ? (
            Object.entries(abResults).map(([variant, data]: [string, any]) => (
              <Card key={variant} title={`Variant ${variant} — ${VARIANT_LABELS[variant] || variant}`}>
                {Object.entries(data).map(([event, count]: [string, any]) => (
                  <Row key={event} label={event.replace(/_/g, ' ')} value={String(count)} />
                ))}
              </Card>
            ))
          ) : (
            <div style={{ textAlign: 'center', color: 'rgba(248,248,252,0.3)', fontSize: 13, padding: 20 }}>Loading results…</div>
          )}
        </div>
      )}

      {/* ── System section (admin only) ── */}
      {section === 'system' && isAdmin && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Card title="Ora Autonomy Engine">
            <div style={{ fontSize: 13, color: 'rgba(248,248,252,0.55)', lineHeight: 1.6, marginBottom: 14 }}>
              Triggers Ora's full self-improvement cycle: A/B analysis, feed weight optimization, bug detection, and daily report.
            </div>
            <button
              onClick={runAutonomy}
              disabled={runningAutonomy}
              style={{
                width: '100%', padding: '12px', borderRadius: 10,
                background: runningAutonomy ? 'rgba(255,255,255,0.05)' : 'rgba(0,212,170,0.12)',
                border: `1px solid ${runningAutonomy ? 'rgba(255,255,255,0.1)' : 'rgba(0,212,170,0.3)'}`,
                color: runningAutonomy ? 'rgba(248,248,252,0.3)' : '#00d4aa',
                fontWeight: 700, fontSize: 14,
              }}
            >
              {runningAutonomy ? '⟳ Running…' : '⚡ Run Autonomy Cycle Now'}
            </button>
            {autonomyStatus && (
              <div style={{ marginTop: 12, padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, fontSize: 12, color: 'rgba(248,248,252,0.5)', wordBreak: 'break-word' }}>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                  {JSON.stringify(autonomyStatus, null, 2)}
                </pre>
              </div>
            )}
          </Card>

          <Card title="Health Dashboard">
            <button
              onClick={async () => {
                const res = await OraClient['client'].get('/api/ora/health/dashboard').catch(() => ({ data: null }));
                alert(JSON.stringify(res.data, null, 2));
              }}
              style={{ width: '100%', padding: '10px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(248,248,252,0.7)', fontWeight: 600, fontSize: 13 }}
            >
              View Health Dashboard
            </button>
          </Card>

          <Card title="Ora's Self-Improvement Proposals">
            <div style={{ fontSize: 13, color: 'rgba(248,248,252,0.5)', marginBottom: 12 }}>
              High-risk improvements Ora wants to make — review and approve or reject.
            </div>
            <button
              onClick={loadProposals}
              disabled={proposalsLoading}
              style={{ padding: '8px 16px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(248,248,252,0.6)', fontWeight: 600, fontSize: 12, marginBottom: 12 }}
            >
              {proposalsLoading ? '⟳ Loading…' : '↺ Refresh Proposals'}
            </button>
            {proposals.length === 0 && !proposalsLoading && (
              <div style={{ fontSize: 12, color: 'rgba(248,248,252,0.3)', textAlign: 'center', padding: '12px 0' }}>
                No pending proposals
              </div>
            )}
            {proposals.map((p: any) => (
              <div key={p.id} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '12px', marginBottom: 8, border: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(248,248,252,0.85)', flex: 1 }}>{p.title}</div>
                  <div style={{ fontSize: 10, padding: '2px 7px', borderRadius: 6, background:
                    p.status === 'applied' ? 'rgba(0,212,130,0.15)' :
                    p.status === 'rejected' ? 'rgba(255,80,80,0.15)' :
                    'rgba(255,200,80,0.15)',
                    color:
                    p.status === 'applied' ? '#00d482' :
                    p.status === 'rejected' ? '#ff5050' :
                    '#ffc850',
                    fontWeight: 700, textTransform: 'uppercase', whiteSpace: 'nowrap' }}
                  >{p.status || 'pending'}</div>
                </div>
                <div style={{ fontSize: 12, color: 'rgba(248,248,252,0.45)', marginBottom: 4 }}>{p.rationale}</div>
                {p.target_file && <div style={{ fontSize: 11, color: 'rgba(248,248,252,0.3)', marginBottom: 8, fontFamily: 'monospace' }}>📄 {p.target_file}</div>}
                <div style={{ fontSize: 11, color: 'rgba(248,248,252,0.25)', marginBottom: 8 }}>Risk: {p.risk} • Impact: {p.estimated_impact}</div>
                {p.status === 'pending' && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => handleProposal(p.id, 'approve')}
                      style={{ flex: 1, padding: '7px', borderRadius: 8, background: 'rgba(0,212,130,0.12)', border: '1px solid rgba(0,212,130,0.3)', color: '#00d482', fontWeight: 700, fontSize: 12 }}
                    >✓ Approve</button>
                    <button
                      onClick={() => handleProposal(p.id, 'reject')}
                      style={{ flex: 1, padding: '7px', borderRadius: 8, background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.2)', color: '#ff6060', fontWeight: 700, fontSize: 12 }}
                    >✕ Reject</button>
                  </div>
                )}
              </div>
            ))}
          </Card>

          <Card title="Variant Modulation">
            <div style={{ fontSize: 13, color: 'rgba(248,248,252,0.55)', marginBottom: 12 }}>Force a specific variant for all new users (overrides random assignment).</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[...VARIANTS, 'auto'].map((v) => (
                <button key={v} onClick={async () => {
                  if (v === 'auto') {
                    await OraClient['client'].delete(`/api/ab/winner/${EXPERIMENT_ID}`).catch(() => {});
                    alert('Winner cleared — back to random assignment');
                  } else {
                    await OraClient['client'].post(`/api/ab/set-winner/${EXPERIMENT_ID}`, { winner: v }).catch(() => {});
                    alert(`Variant ${v} set as winner for all new users`);
                  }
                }} style={{
                  padding: '7px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700,
                  background: 'rgba(255,255,255,0.06)', color: 'rgba(248,248,252,0.6)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}>{v === 'auto' ? '↺ Auto' : `Force ${v}`}</button>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#12121e', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '16px 18px' }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: 'rgba(248,248,252,0.3)', textTransform: 'uppercase', marginBottom: 12 }}>{title}</div>
      {children}
    </div>
  );
}

function Row({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <span style={{ fontSize: 13, color: 'rgba(248,248,252,0.45)' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: valueColor || 'rgba(248,248,252,0.8)' }}>{value}</span>
    </div>
  );
}
