import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { OraClient } from '../lib/OraClient';
import { useAuth } from '../context/AuthContext';
import { useExperiment } from '../lib/useExperiment';
import { StreakBadge } from '../components/StreakBadge';

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
  const [section, setSection] = useState<'profile' | 'ab' | 'experiments' | 'system' | 'google' | 'surfaces' | 'council' | 'dashboard'>('profile');
  const [dashboard, setDashboard] = useState<any>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [allExperiments, setAllExperiments] = useState<any>(null);
  const [allExperimentsLoading, setAllExperimentsLoading] = useState(false);
  const [applyingWinner, setApplyingWinner] = useState<string | null>(null);
  const [councilBrief, setCouncilBrief] = useState<any>(null);
  const [councilAgents, setCouncilAgents] = useState<any[]>([]);
  const [councilMetrics, setCouncilMetrics] = useState<any>(null);
  const [councilLoading, setCouncilLoading] = useState(false);
  const [runningAgent, setRunningAgent] = useState<string | null>(null);
  const [surfaces, setSurfaces] = useState<any[]>([]);
  const [surfacesLoading, setSurfacesLoading] = useState(false);
  const [spawnRequest, setSpawnRequest] = useState('');
  const [spawning, setSpawning] = useState(false);
  const [spawnResult, setSpawnResult] = useState<any>(null);
  const [spawnError, setSpawnError] = useState<string | null>(null);
  const [showSpawnModal, setShowSpawnModal] = useState(false);
  const [agentPopulation, setAgentPopulation] = useState<any[]>([]);
  const [agentPopulationLoading, setAgentPopulationLoading] = useState(false);
  const [evolutionProposals, setEvolutionProposals] = useState<any[]>([]);
  const [evolutionProposalsLoading, setEvolutionProposalsLoading] = useState(false);

  // ── A/B hooks must be BEFORE any conditional returns (Rules of Hooks) ──
  const { variant: upgradeHeadlineVariant, trackEvent: trackUpgradeHeadline } = useExperiment('upgrade_headline');
  const { variant: priceDisplayVariant } = useExperiment('upgrade_price_display');
  const { variant: ctaButtonVariant, trackEvent: trackUpgradeCTA } = useExperiment('upgrade_cta_button');

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

  const loadCouncilData = async () => {
    if (!isAdmin) return;
    setCouncilLoading(true);
    try {
      const adminToken = localStorage.getItem('admin_token') || 'connectome-admin-secret';
      const headers = { 'X-Admin-Token': adminToken };
      const [briefRes, agentsRes, metricsRes] = await Promise.allSettled([
        OraClient['client'].get('/api/executive/brief', { headers }),
        OraClient['client'].get('/api/executive/agents', { headers }),
        OraClient['client'].get('/api/executive/metrics', { headers }),
      ]);
      if (briefRes.status === 'fulfilled') setCouncilBrief(briefRes.value.data);
      if (agentsRes.status === 'fulfilled') setCouncilAgents(agentsRes.value.data?.agents || []);
      if (metricsRes.status === 'fulfilled') setCouncilMetrics(metricsRes.value.data);
    } catch {}
    setCouncilLoading(false);
  };

  const runAgent = async (agentName: string) => {
    if (!isAdmin) return;
    setRunningAgent(agentName);
    try {
      const adminToken = localStorage.getItem('admin_token') || 'connectome-admin-secret';
      await OraClient['client'].post(`/api/executive/run/${agentName}`, {}, {
        headers: { 'X-Admin-Token': adminToken },
      });
      // Refresh after a short delay
      setTimeout(() => {
        loadCouncilData();
        setRunningAgent(null);
      }, 3000);
    } catch {
      setRunningAgent(null);
    }
  };

  const loadAbResults = async () => {
    try {
      const res = await OraClient['client'].get(`/api/ab/results/${EXPERIMENT_ID}`);
      setAbResults(res.data);
      const winnerRes = await OraClient['client'].get(`/api/ab/winner/${EXPERIMENT_ID}`).catch(() => ({ data: { winner: null } }));
      setAbWinner(winnerRes.data.winner);
    } catch {}
  };

  const loadAllExperiments = async () => {
    setAllExperimentsLoading(true);
    try {
      const res = await OraClient['client'].get('/api/ab/results');
      setAllExperiments(res.data);
    } catch {}
    setAllExperimentsLoading(false);
  };

  const applyExperimentWinner = async (experiment: string, winner: string) => {
    setApplyingWinner(experiment);
    try {
      await OraClient['client'].post('/api/ab/winner', { experiment, winner });
      await loadAllExperiments();
    } catch (e: any) {
      alert(`Failed to apply winner: ${e?.response?.data?.detail || 'Unknown error'}`);
    }
    setApplyingWinner(null);
  };

  const setVariant = (v: string) => {
    localStorage.setItem(`ab_variant_${EXPERIMENT_ID}`, v);
    localStorage.setItem(`ab_variant_ts_${EXPERIMENT_ID}`, Date.now().toString());
    setCurrentVariant(v);
    navigate('/feed');
  };

  const loadSurfaces = async () => {
    setSurfacesLoading(true);
    try {
      const res = await OraClient['client'].get('/api/surfaces/my');
      setSurfaces(res.data?.surfaces || []);
    } catch {}
    setSurfacesLoading(false);
  };

  const handleSpawn = async () => {
    if (!spawnRequest.trim()) return;
    setSpawning(true);
    setSpawnResult(null);
    setSpawnError(null);
    try {
      const res = await OraClient['client'].post('/api/surfaces/spawn', { request: spawnRequest });
      setSpawnResult(res.data);
      setSpawnRequest('');
      await loadSurfaces();
    } catch (e: any) {
      const detail = e?.response?.data?.detail;
      if (typeof detail === 'object' && detail?.message) {
        setSpawnError(detail.message);
      } else {
        setSpawnError(typeof detail === 'string' ? detail : 'Something went wrong. Try again.');
      }
    }
    setSpawning(false);
  };

  const handleRetireSurface = async (id: string) => {
    if (!window.confirm('Remove this surface? This cannot be undone.')) return;
    try {
      await OraClient['client'].delete(`/api/surfaces/${id}`);
      setSurfaces((prev) => prev.filter((s) => s.id !== id));
    } catch {}
  };

  const loadProposals = async () => {
    setProposalsLoading(true);
    try {
      const res = await OraClient['client'].get('/api/ora/autonomy/proposals');
      setProposals(res.data?.proposals || []);
    } catch {}
    setProposalsLoading(false);
  };

  const loadAgentPopulation = async () => {
    setAgentPopulationLoading(true);
    try {
      const res = await OraClient['client'].get('/api/ora/autonomy/evolution/population');
      setAgentPopulation(res.data?.population || []);
    } catch {}
    setAgentPopulationLoading(false);
  };

  const loadEvolutionProposals = async () => {
    setEvolutionProposalsLoading(true);
    try {
      const res = await OraClient['client'].get('/api/ora/autonomy/evolution/proposals');
      setEvolutionProposals(res.data?.proposals || []);
    } catch {}
    setEvolutionProposalsLoading(false);
  };

  const handleEvolutionProposal = async (id: string, action: 'approve' | 'reject') => {
    try {
      await OraClient['client'].post(`/api/ora/autonomy/evolution/proposals/${id}/${action}`);
      await loadEvolutionProposals();
    } catch (e: any) {
      alert(`Failed to ${action}: ${e?.response?.data?.detail || 'Unknown error'}`);
    }
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

  const UPGRADE_HEADLINES: Record<string, string> = {
    A: 'Unlock the full Ora',
    B: 'Go deeper with Explorer',
    C: "You're using iDo like a power user",
    D: 'Explorer — built for people serious about their goals',
  };
  const UPGRADE_PRICES: Record<string, string> = {
    A: '$12.99/month',
    B: '$0.43/day',
    C: 'Less than a coffee/month',
  };
  const UPGRADE_CTAS: Record<string, string> = {
    A: 'Upgrade to Explorer',
    B: 'Unlock Explorer — $12.99/mo',
    C: 'Try Explorer Free for 7 Days',
    D: 'Get Explorer',
  };
  const upgradeHeadlineText = UPGRADE_HEADLINES[upgradeHeadlineVariant] || UPGRADE_HEADLINES['A'];
  const upgradePriceText = UPGRADE_PRICES[priceDisplayVariant] || UPGRADE_PRICES['A'];
  const upgradeCTAText = UPGRADE_CTAS[ctaButtonVariant] || UPGRADE_CTAS['A'];

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

      {/* Sub-section back navigation — only shown when NOT on main profile view */}
      {section !== 'profile' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <button
            onClick={() => setSection('profile')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: '#00d4aa', fontSize: 14, fontWeight: 600, padding: '6px 0',
            }}
          >
            ‹ Back
          </button>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#f8f8fc' }}>
            {section === 'google' ? 'Google Account'
              : section === 'surfaces' ? 'My Surfaces'
              : section === 'ab' ? 'A/B Tests'
              : section === 'experiments' ? 'Experiments'
              : section === 'system' ? 'System'
              : section === 'council' ? 'Executive Council'
              : section === 'dashboard' ? 'Dashboard'
              : section}
          </span>
        </div>
      )}

      {/* ── Profile section ── */}
      {section === 'profile' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* ── Streak + XP + Badges ── */}
          <StreakBadge />

          {/* ── Account Info ── */}
          <Card title="Account">
            <Row label="Email" value={profile?.email} />
            <Row label="Member since" value={profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '\u2014'} />
            <Row label="Fulfilment score" value={`${((profile?.fulfilment_score || 0) * 100).toFixed(0)}%`} />
            <Row label="Tier" value={tier} valueColor={tierColor} />
          </Card>

          {/* ── Upgrade prompt for free users ── */}
          {tier === 'free' && (
            <div style={{
              background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: 14, padding: '16px 18px',
            }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>{upgradeHeadlineText}</div>
              <div style={{ fontSize: 13, color: 'rgba(248,248,252,0.5)', marginBottom: 4 }}>Unlimited cards, Drive sync, local events</div>
              <div style={{ fontSize: 13, color: 'rgba(99,102,241,0.8)', fontWeight: 600, marginBottom: 12 }}>{upgradePriceText}</div>
              <button onClick={() => { trackUpgradeCTA('click'); navigate('/dao'); }} style={{
                background: '#6366f1', color: '#fff', padding: '9px 20px', borderRadius: 10, fontWeight: 700, fontSize: 13,
              }}>{upgradeCTAText}</button>
            </div>
          )}

          {/* ── Secondary Navigation — iOS Settings style ── */}
          <div style={{ background: '#12121e', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: 'rgba(248,248,252,0.3)', textTransform: 'uppercase', padding: '14px 18px 6px' }}>Community</div>
            <MenuRow icon="🏛" label="DAO & Contributions" sublabel="Earn CP, vote on proposals" onClick={() => navigate('/dao')} />
            <MenuRow icon="✍" label="Journal" sublabel="Your personal log" onClick={() => navigate('/journal')} />
            <MenuRow icon="⚡" label="Services" sublabel="Ora-powered tools" onClick={() => navigate('/services')} last />
          </div>

          <div style={{ background: '#12121e', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: 'rgba(248,248,252,0.3)', textTransform: 'uppercase', padding: '14px 18px 6px' }}>My Account</div>
            <MenuRow icon="🌐" label="My Surfaces" sublabel="Personalized pages Ora built" onClick={() => { setSection('surfaces'); loadSurfaces(); }} />
            <MenuRow icon="🔗" label="Google Account" sublabel="Drive sync & calendar" onClick={() => setSection('google')} />
            <MenuRow icon="📱" label="Get the App" sublabel="Add iDo to your home screen" onClick={() => {}} last />
          </div>

          {/* ── Admin shortcut ── */}
          {isAdmin && (
            <div style={{ background: '#12121e', border: '1px solid rgba(0,212,170,0.15)', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: '#00d4aa', textTransform: 'uppercase', padding: '14px 18px 6px', opacity: 0.7 }}>Admin</div>
              <MenuRow icon="📊" label="Dashboard" sublabel="User & revenue metrics" onClick={() => {
                setSection('dashboard');
                setDashboardLoading(true);
                OraClient['client'].get('/api/admin/dashboard', { headers: { 'X-Admin-Token': localStorage.getItem('admin_token') || 'connectome-admin-secret' } })
                  .then(r => setDashboard(r.data)).catch(() => {}).finally(() => setDashboardLoading(false));
              }} />
              <MenuRow icon="🧪" label="A/B Tests" sublabel="Experiment results" onClick={() => { setSection('ab'); loadAbResults(); }} />
              <MenuRow icon="⚗️" label="Experiments" sublabel="All active experiments" onClick={() => { setSection('experiments'); loadAllExperiments(); }} />
              <MenuRow icon="⚡" label="System" sublabel="Autonomy engine & agents" onClick={() => { setSection('system'); loadAgentPopulation(); loadEvolutionProposals(); }} />
              <MenuRow icon="◈" label="Council" sublabel="Executive agent council" onClick={() => { setSection('council'); loadCouncilData(); }} last />
            </div>
          )}

          {/* ── Current A/B Variant (admin debug) ── */}
          {isAdmin && (
            <Card title="Current A/B Variant">
              <Row label="Landing variant" value={VARIANT_LABELS[currentVariant] || currentVariant} />
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
            </Card>
          )}

          {/* ── Sign Out ── */}
          <button onClick={handleLogout} style={{
            width: '100%', padding: '13px', borderRadius: 12,
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
            color: '#ef4444', fontWeight: 700, fontSize: 14, marginTop: 4,
          }}>
            Sign out
          </button>
        </div>
      )}

      {/* ── Surfaces section ── */}
      {section === 'surfaces' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Spawn modal */}
          {showSpawnModal && (
            <div style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
              display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
              zIndex: 1000, padding: '0 0 32px',
            }}>
              <div style={{
                background: '#13131a',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 20,
                padding: 24,
                width: '100%',
                maxWidth: 440,
              }}>
                <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 6, color: '#f8f8fc' }}>
                  What should Ora build for you?
                </div>
                <p style={{ fontSize: 13, color: 'rgba(248,248,252,0.45)', marginBottom: 16 }}>
                  Describe your goal or need in plain language. Ora will design the perfect page for you — no templates.
                </p>
                <textarea
                  rows={4}
                  placeholder='e.g. &quot;I want to quit smoking&quot;, &quot;Prep me for my YC interview&quot;, &quot;Help me learn Mandarin in 3 months&quot;…'
                  value={spawnRequest}
                  onChange={(e) => setSpawnRequest(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: '1px solid rgba(255,255,255,0.12)',
                    background: 'rgba(255,255,255,0.06)',
                    color: '#f8f8fc',
                    fontSize: 13,
                    resize: 'none',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                {spawnError && (
                  <div style={{ fontSize: 12, color: '#ef4444', marginTop: 8 }}>{spawnError}</div>
                )}
                {spawnResult && (
                  <div style={{
                    marginTop: 12,
                    padding: '12px 14px',
                    background: 'rgba(0,212,170,0.08)',
                    border: '1px solid rgba(0,212,170,0.25)',
                    borderRadius: 10,
                  }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#00d4aa', marginBottom: 4 }}>
                      ✨ {spawnResult.title}
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(248,248,252,0.5)', marginBottom: 8 }}>
                      {spawnResult.description}
                    </div>
                    <a
                      href={spawnResult.url.replace('https://avielcarlos.github.io/connectome-web', '/connectome-web')}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: 12, color: '#8b5cf6', fontWeight: 700,
                        textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4,
                      }}
                    >
                      Open surface →
                    </a>
                    <div style={{ fontSize: 11, color: 'rgba(248,248,252,0.3)', marginTop: 6 }}>
                      Backend deploys in ~{spawnResult.estimated_ready_in}
                    </div>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                  <button
                    onClick={() => { setShowSpawnModal(false); setSpawnResult(null); setSpawnError(null); }}
                    style={{
                      flex: 1, padding: '10px 0', borderRadius: 10, fontSize: 13, fontWeight: 700,
                      background: 'rgba(255,255,255,0.07)', color: 'rgba(248,248,252,0.6)',
                      border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer',
                    }}
                  >
                    Close
                  </button>
                  <button
                    onClick={handleSpawn}
                    disabled={spawning || !spawnRequest.trim()}
                    style={{
                      flex: 2, padding: '10px 0', borderRadius: 10, fontSize: 13, fontWeight: 700,
                      background: spawning ? 'rgba(139,92,246,0.4)' : '#8b5cf6',
                      color: '#fff', border: 'none', cursor: spawning ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {spawning ? 'Ora is designing…' : 'Build my surface'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 17, color: '#f8f8fc' }}>🌐 My Surfaces</div>
              <div style={{ fontSize: 12, color: 'rgba(248,248,252,0.4)', marginTop: 2 }}>
                Personalized pages Ora built for you
              </div>
            </div>
            <button
              onClick={() => { setShowSpawnModal(true); setSpawnResult(null); setSpawnError(null); }}
              style={{
                padding: '8px 16px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                color: '#fff', border: 'none', cursor: 'pointer',
              }}
            >
              + Create New
            </button>
          </div>

          {/* Tier note for free users */}
          {tier === 'free' && (
            <div style={{
              padding: '14px 16px',
              background: 'rgba(139,92,246,0.08)',
              border: '1px solid rgba(139,92,246,0.2)',
              borderRadius: 12,
              fontSize: 13,
              color: 'rgba(248,248,252,0.7)',
            }}>
              ✨ WebSpawn is an Explorer &amp; Sovereign feature. Ora builds personalized pages for any goal — a dashboard, a plan, a tracker, whatever fits. <a href="/connectome-web/#upgrade" style={{ color: '#8b5cf6', fontWeight: 700 }}>Upgrade to unlock it.</a>
            </div>
          )}

          {/* Surface list */}
          {surfacesLoading ? (
            <div style={{ textAlign: 'center', padding: 32, color: 'rgba(248,248,252,0.3)' }}>Loading…</div>
          ) : surfaces.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '32px 20px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 14,
            }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>✦</div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#f8f8fc', marginBottom: 6 }}>
                No surfaces yet
              </div>
              <div style={{ fontSize: 13, color: 'rgba(248,248,252,0.4)', lineHeight: 1.5 }}>
                Tell Ora what you want to track, build, or plan.<br />
                She’ll design a page just for you.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {surfaces.map((s) => (
                <div key={s.id} style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 14,
                  padding: '14px 16px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#f8f8fc', marginBottom: 2 }}>
                        {s.title}
                      </div>
                      {s.description && (
                        <div style={{ fontSize: 12, color: 'rgba(248,248,252,0.45)', marginBottom: 8, lineHeight: 1.4 }}>
                          {s.description}
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const, alignItems: 'center' }}>
                        <span style={{
                          fontSize: 10, color: 'rgba(248,248,252,0.35)',
                          background: 'rgba(139,92,246,0.12)',
                          border: '1px solid rgba(139,92,246,0.2)',
                          padding: '2px 7px', borderRadius: 6,
                        }}>
                          {s.inferred_type?.replace(/_/g, ' ')}
                        </span>
                        <span style={{ fontSize: 10, color: 'rgba(248,248,252,0.3)' }}>
                          {s.view_count} view{s.view_count !== 1 ? 's' : ''}
                        </span>
                        <span style={{ fontSize: 10, color: 'rgba(248,248,252,0.3)' }}>
                          {new Date(s.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRetireSurface(s.id)}
                      title="Retire surface"
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'rgba(248,248,252,0.25)', fontSize: 16, padding: '0 0 0 10px',
                        flexShrink: 0,
                      }}
                    >
                      ×
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <a
                      href={s.url.replace('https://avielcarlos.github.io/connectome-web', '/connectome-web')}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        flex: 1, display: 'block', textAlign: 'center',
                        padding: '8px 0', borderRadius: 8, fontSize: 12, fontWeight: 700,
                        background: 'rgba(139,92,246,0.15)',
                        border: '1px solid rgba(139,92,246,0.3)',
                        color: '#8b5cf6', textDecoration: 'none',
                      }}
                    >
                      Open →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
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

      {/* ── ⚗️ Experiments section (admin only) ── */}
      {section === 'experiments' && isAdmin && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: 'rgba(248,248,252,0.3)', textTransform: 'uppercase', marginBottom: 4 }}>
            ⚗️ All A/B Experiments
          </div>
          {allExperimentsLoading ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'rgba(248,248,252,0.3)' }}>Loading…</div>
          ) : allExperiments?.results ? (
            allExperiments.results.map((exp: any) => {
              const hasWinner = exp.declared_winner || exp.auto_winner;
              const statusColor = exp.best_confidence >= 0.95 ? '#10b981'
                : exp.best_confidence >= 0.7 ? '#f59e0b'
                : 'rgba(248,248,252,0.2)';
              return (
                <div key={exp.experiment} style={{
                  background: '#12121a',
                  border: `1px solid ${statusColor}44`,
                  borderRadius: 14, padding: '14px 16px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{exp.experiment}</div>
                      <div style={{ fontSize: 11, color: 'rgba(248,248,252,0.35)', marginTop: 2 }}>{exp.page} — metric: {exp.metric}</div>
                    </div>
                    {hasWinner && (
                      <span style={{ fontSize: 10, background: '#10b981' + '22', color: '#10b981', border: '1px solid #10b98144', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>
                        🏆 {exp.declared_winner || exp.auto_winner}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: statusColor, marginBottom: 10 }}>{exp.recommendation}</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                    {Object.entries(exp.variants || {}).map(([vKey, vStats]: [string, any]) => (
                      <div key={vKey} style={{
                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 8, padding: '6px 10px', fontSize: 11,
                      }}>
                        <div style={{ fontWeight: 700, color: '#f8f8fc' }}>{vKey}</div>
                        <div style={{ color: 'rgba(248,248,252,0.4)' }}>{vStats.exposures ?? 0} views</div>
                        <div style={{ color: 'rgba(248,248,252,0.4)' }}>{((vStats.conversion_rate ?? 0) * 100).toFixed(1)}% conv</div>
                        {vStats.confidence_vs_control != null && (
                          <div style={{ color: statusColor }}>{(vStats.confidence_vs_control * 100).toFixed(0)}% conf</div>
                        )}
                      </div>
                    ))}
                  </div>
                  {exp.auto_winner && !exp.declared_winner && (
                    <button
                      onClick={() => applyExperimentWinner(exp.experiment, exp.auto_winner)}
                      disabled={applyingWinner === exp.experiment}
                      style={{
                        background: '#10b981', color: '#0a0a0f',
                        padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                        border: 'none', cursor: 'pointer', opacity: applyingWinner === exp.experiment ? 0.6 : 1,
                      }}
                    >
                      {applyingWinner === exp.experiment ? 'Applying…' : `✓ Apply Winner: ${exp.auto_winner}`}
                    </button>
                  )}
                </div>
              );
            })
          ) : (
            <div style={{ textAlign: 'center', color: 'rgba(248,248,252,0.3)', fontSize: 13, padding: 20 }}>
              No data yet. Run the app to collect experiment data.
            </div>
          )}
        </div>
      )}

      {/* ── Executive Council section (admin only) ── */}
      {section === 'council' && isAdmin && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {councilLoading ? (
            <div style={{ textAlign: 'center', color: 'rgba(248,248,252,0.3)', padding: 40 }}>Loading council data…</div>
          ) : (
            <>
              {/* Financial Snapshot */}
              {councilMetrics && (
                <Card title="💰 Financial Snapshot">
                  <Row label="MRR" value={`$${(councilMetrics.financial?.mrr_usd || 0).toFixed(2)}`} valueColor="#00d4aa" />
                  <Row label="ARR" value={`$${(councilMetrics.financial?.arr_usd || 0).toFixed(2)}`} />
                  <Row label="Active Subscriptions" value={String(councilMetrics.financial?.active_subscriptions || 0)} />
                  <Row label="Revenue (30d)" value={`$${(councilMetrics.financial?.revenue_last_30d_usd || 0).toFixed(2)}`} />
                  <Row label="Churn" value={`${councilMetrics.financial?.churn_rate_pct || 0}%`} valueColor={councilMetrics.financial?.churn_rate_pct > 20 ? '#ff6060' : undefined} />
                  <Row label="Gross Margin" value={`${councilMetrics.financial?.gross_margin_pct || 0}%`} />
                  {/* Growth */}
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <Row label="Total Users" value={String(councilMetrics.growth?.total_users || 0)} />
                    <Row label="New Users (7d)" value={`+${councilMetrics.growth?.new_users_7d || 0}`} valueColor="#00d4aa" />
                    <Row label="Weekly Growth" value={`${councilMetrics.growth?.weekly_growth_rate_pct || 0}%`} />
                    <Row label="Growth Trend" value={councilMetrics.growth?.growth_trend || '—'} />
                  </div>
                  {/* Infrastructure */}
                  {councilMetrics.infrastructure && (
                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <Row
                        label="API Health"
                        value={councilMetrics.infrastructure.api_healthy ? '✅ Healthy' : '❌ Down'}
                        valueColor={councilMetrics.infrastructure.api_healthy ? '#00d4aa' : '#ff6060'}
                      />
                      <Row label="API Response" value={`${councilMetrics.infrastructure.api_response_time_s || '?'}s`} />
                      <Row label="Health Score" value={`${councilMetrics.infrastructure.health_score || 0}/100`} />
                      <Row label="CI Status" value={councilMetrics.infrastructure.ci_status || '—'} />
                    </div>
                  )}
                </Card>
              )}

              {/* Agent Status Grid */}
              {councilAgents.length > 0 && (
                <Card title="🤖 Executive Agent Status">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {councilAgents.map((agent: any) => (
                      <div key={agent.name} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '8px 10px', borderRadius: 8,
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{
                            width: 8, height: 8, borderRadius: '50%',
                            background: agent.health === 'green' ? '#00d4aa' : agent.health === 'yellow' ? '#ffd700' : '#ff6060',
                          }} />
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(248,248,252,0.8)' }}>
                            {agent.name}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 11, color: 'rgba(248,248,252,0.35)' }}>
                            {agent.age_hours != null ? `${agent.age_hours}h ago` : 'never run'}
                          </span>
                          <button
                            onClick={() => runAgent(agent.name)}
                            disabled={runningAgent === agent.name}
                            style={{
                              padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                              background: runningAgent === agent.name ? 'rgba(255,255,255,0.05)' : 'rgba(0,212,170,0.1)',
                              border: '1px solid rgba(0,212,170,0.2)', color: '#00d4aa',
                            }}
                          >
                            {runningAgent === agent.name ? '…' : '▶ Run'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Latest Council Brief */}
              {councilBrief && councilBrief.brief && (
                <Card title="🏛️ Latest Executive Brief">
                  <div style={{ fontSize: 12, color: 'rgba(248,248,252,0.4)', marginBottom: 10 }}>
                    Convened: {councilBrief.brief.convened_at?.slice(0, 10) || '—'} |
                    {` ${councilBrief.brief.agents_reporting || 0}/${7} agents reporting`}
                  </div>
                  {councilBrief.brief.top_priorities?.length > 0 && (
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 11, color: 'rgba(248,248,252,0.3)', fontWeight: 700, marginBottom: 6 }}>🎯 PRIORITIES</div>
                      {councilBrief.brief.top_priorities.map((p: string, i: number) => (
                        <div key={i} style={{ fontSize: 12, color: 'rgba(248,248,252,0.65)', padding: '3px 0' }}>{p}</div>
                      ))}
                    </div>
                  )}
                  {councilBrief.brief.key_opportunities?.length > 0 && (
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 11, color: 'rgba(248,248,252,0.3)', fontWeight: 700, marginBottom: 6 }}>✨ OPPORTUNITIES</div>
                      {councilBrief.brief.key_opportunities.map((o: string, i: number) => (
                        <div key={i} style={{ fontSize: 12, color: 'rgba(248,248,252,0.65)', padding: '3px 0' }}>{o}</div>
                      ))}
                    </div>
                  )}
                  {councilBrief.brief.key_risks?.length > 0 && (
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 11, color: 'rgba(248,248,252,0.3)', fontWeight: 700, marginBottom: 6 }}>⚠️ RISKS</div>
                      {councilBrief.brief.key_risks.map((r: string, i: number) => (
                        <div key={i} style={{ fontSize: 12, color: '#ffd700', padding: '3px 0' }}>{r}</div>
                      ))}
                    </div>
                  )}
                  {councilBrief.brief.recommended_actions?.length > 0 && (
                    <div>
                      <div style={{ fontSize: 11, color: 'rgba(248,248,252,0.3)', fontWeight: 700, marginBottom: 6 }}>→ ACTIONS</div>
                      {councilBrief.brief.recommended_actions.map((a: string, i: number) => (
                        <div key={i} style={{ fontSize: 12, color: '#00d4aa', padding: '3px 0' }}>{a}</div>
                      ))}
                    </div>
                  )}
                </Card>
              )}

              {/* Quick Actions */}
              <Card title="⚡ Quick Actions">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button
                    onClick={() => runAgent('executive_council')}
                    disabled={runningAgent === 'executive_council'}
                    style={{
                      padding: '10px', borderRadius: 10,
                      background: 'rgba(0,212,170,0.1)',
                      border: '1px solid rgba(0,212,170,0.3)',
                      color: '#00d4aa', fontWeight: 700, fontSize: 13,
                    }}
                  >
                    {runningAgent === 'executive_council' ? '⟳ Convening…' : '🏛️ Convene Council Now'}
                  </button>
                  <button
                    onClick={() => runAgent('cto')}
                    disabled={runningAgent === 'cto'}
                    style={{
                      padding: '10px', borderRadius: 10,
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: 'rgba(248,248,252,0.7)', fontWeight: 600, fontSize: 13,
                    }}
                  >
                    {runningAgent === 'cto' ? '⟳ Checking…' : '⚙️ Check System Health'}
                  </button>
                  <button
                    onClick={() => runAgent('cfo')}
                    disabled={runningAgent === 'cfo'}
                    style={{
                      padding: '10px', borderRadius: 10,
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: 'rgba(248,248,252,0.7)', fontWeight: 600, fontSize: 13,
                    }}
                  >
                    {runningAgent === 'cfo' ? '⟳ Analyzing…' : '💰 Run CFO Analysis'}
                  </button>
                </div>
              </Card>

              {/* Refresh button */}
              <button
                onClick={loadCouncilData}
                style={{
                  padding: '10px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(248,248,252,0.4)', fontSize: 12,
                }}
              >↺ Refresh Council Data</button>
            </>
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

          <Card title="Agent Population">
            <div style={{ fontSize: 13, color: 'rgba(248,248,252,0.55)', lineHeight: 1.6, marginBottom: 12 }}>
              Ora's living agent roster — builtin, spawned, partitioned, and merged agents.
            </div>
            <button
              onClick={loadAgentPopulation}
              disabled={agentPopulationLoading}
              style={{ padding: '8px 16px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(248,248,252,0.6)', fontWeight: 600, fontSize: 12, marginBottom: 12 }}
            >
              {agentPopulationLoading ? '⟳ Loading…' : '↺ Refresh Population'}
            </button>
            {agentPopulation.length === 0 && !agentPopulationLoading && (
              <div style={{ fontSize: 12, color: 'rgba(248,248,252,0.3)', textAlign: 'center', padding: '12px 0' }}>No agents loaded</div>
            )}
            {agentPopulation.map((agent: any) => {
              const fs = agent.fitness?.fitness_score;
              const health = agent.health || 'unknown';
              const healthColor = health === 'thriving' ? '#00d482' : health === 'struggling' ? '#ff6060' : health === 'average' ? '#ffc850' : '#888';
              const healthEmoji = health === 'thriving' ? '🟢' : health === 'struggling' ? '🔴' : health === 'average' ? '🟡' : '⚪';
              const statusColor = agent.status === 'active' ? '#00d4aa' : agent.status === 'retired' ? '#888' : '#a855f7';
              const typeBadge = agent.type === 'builtin' ? null : agent.type === 'spawned' ? '✨ spawned' : agent.type === 'partitioned' ? `✂️ from ${(agent.lineage||[]).join(',')}` : agent.type === 'merged' ? `🔀 from ${(agent.lineage||[]).join('+')}` : agent.type;
              return (
                <div key={agent.name} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '10px 12px', marginBottom: 8, border: `1px solid ${agent.status === 'active' ? 'rgba(0,212,170,0.12)' : 'rgba(255,255,255,0.06)'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: agent.status === 'active' ? 'rgba(248,248,252,0.9)' : 'rgba(248,248,252,0.4)' }}>{healthEmoji} {agent.name}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                      {typeBadge && (
                        <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 5, background: 'rgba(168,85,247,0.15)', color: '#a855f7', fontWeight: 700, whiteSpace: 'nowrap' }}>{typeBadge}</span>
                      )}
                      <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 5, background: statusColor + '15', color: statusColor, fontWeight: 700, textTransform: 'uppercase' }}>{agent.status}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, color: 'rgba(248,248,252,0.35)' }}>gen {agent.generation ?? 0}</span>
                    <span style={{ fontSize: 11, color: 'rgba(248,248,252,0.35)' }}>w={((agent.weight || 0) * 100).toFixed(1)}%</span>
                    {fs != null && <span style={{ fontSize: 11, color: healthColor, fontWeight: 700 }}>fitness {fs.toFixed(2)}</span>}
                    {agent.fitness?.avg_rating && <span style={{ fontSize: 11, color: 'rgba(248,248,252,0.35)' }}>★{agent.fitness.avg_rating.toFixed(1)}</span>}
                    {agent.fitness?.interaction_count && <span style={{ fontSize: 11, color: 'rgba(248,248,252,0.35)' }}>{agent.fitness.interaction_count}x</span>}
                  </div>
                  {agent.retire_reason && (
                    <div style={{ fontSize: 11, color: 'rgba(248,248,252,0.25)', marginTop: 4 }}>{agent.retire_reason}</div>
                  )}
                </div>
              );
            })}
          </Card>

          <Card title="Evolution Proposals">
            <div style={{ fontSize: 13, color: 'rgba(248,248,252,0.5)', marginBottom: 12 }}>
              Risky evolutions Ora wants to run — review and approve or reject.
            </div>
            <button
              onClick={loadEvolutionProposals}
              disabled={evolutionProposalsLoading}
              style={{ padding: '8px 16px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(248,248,252,0.6)', fontWeight: 600, fontSize: 12, marginBottom: 12 }}
            >
              {evolutionProposalsLoading ? '⟳ Loading…' : '↺ Refresh Proposals'}
            </button>
            {evolutionProposals.length === 0 && !evolutionProposalsLoading && (
              <div style={{ fontSize: 12, color: 'rgba(248,248,252,0.3)', textAlign: 'center', padding: '12px 0' }}>No pending evolution proposals</div>
            )}
            {evolutionProposals.map((p: any) => (
              <div key={p.id} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '12px', marginBottom: 8, border: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(248,248,252,0.85)', flex: 1 }}>{p.title}</div>
                  <div style={{ fontSize: 10, padding: '2px 7px', borderRadius: 6, background: 'rgba(168,85,247,0.15)', color: '#a855f7', fontWeight: 700, whiteSpace: 'nowrap' }}>{p.type}</div>
                </div>
                <div style={{ fontSize: 12, color: 'rgba(248,248,252,0.45)', marginBottom: 8 }}>{p.rationale}</div>
                {p.status === 'pending' && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => handleEvolutionProposal(p.id, 'approve')}
                      style={{ flex: 1, padding: '7px', borderRadius: 8, background: 'rgba(0,212,130,0.12)', border: '1px solid rgba(0,212,130,0.3)', color: '#00d482', fontWeight: 700, fontSize: 12 }}
                    >✓ Approve &amp; Execute</button>
                    <button
                      onClick={() => handleEvolutionProposal(p.id, 'reject')}
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

      {/* ── Admin Dashboard ── */}
      {section === 'dashboard' && isAdmin && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {dashboardLoading ? (
            <div style={{ textAlign: 'center', color: 'rgba(248,248,252,0.3)', padding: 40 }}>Loading…</div>
          ) : dashboard ? (
            <>
              <Card title="Users">
                <Row label="Total" value={String(dashboard.users?.total ?? 0)} />
                <Row label="New (24h)" value={String(dashboard.users?.new_24h ?? 0)} valueColor="#00d4aa" />
                <Row label="New (7d)" value={String(dashboard.users?.new_7d ?? 0)} />
                <Row label="Active (24h)" value={String(dashboard.users?.active_24h ?? 0)} valueColor="#00d4aa" />
                <Row label="Active (7d)" value={String(dashboard.users?.active_7d ?? 0)} />
                <Row label="Paying" value={String(dashboard.users?.paying ?? 0)} valueColor="#8b5cf6" />
              </Card>
              <Card title="Revenue & Costs">
                <Row label="MRR (est.)" value={`$${dashboard.revenue?.mrr_est_usd ?? 0}`} valueColor="#10b981" />
                <Row label="Monthly Burn" value={`$${dashboard.costs?.total_burn_30d_usd ?? 0}`} valueColor="#ef4444" />
                <Row label="API Cost (30d)" value={`$${dashboard.costs?.api_cost_30d_usd ?? 0}`} />
                <Row label="API Cost (24h)" value={`$${dashboard.costs?.api_cost_24h_usd ?? 0}`} />
                <Row label="Status" value={dashboard.sustainability?.status ?? '—'} valueColor={dashboard.sustainability?.status === 'profitable' ? '#10b981' : '#f59e0b'} />
              </Card>
              <Card title="Activity (24h)">
                <Row label="Screens served" value={String(dashboard.activity?.screens_today ?? 0)} />
                <Row label="Users active" value={String(dashboard.activity?.users_with_screens_today ?? 0)} />
                <Row label="Goals total" value={String(dashboard.activity?.goals_total ?? 0)} />
                <Row label="Goals completed" value={String(dashboard.activity?.goals_completed ?? 0)} valueColor="#00d4aa" />
              </Card>
              <Card title="Top Agents">
                {(dashboard.top_agents || []).map((a: any) => (
                  <Row key={a.name} label={a.name} value={`${a.screens} screens`} />
                ))}
              </Card>
            </>
          ) : (
            <div style={{ textAlign: 'center', color: 'rgba(248,248,252,0.3)', padding: 40 }}>No data</div>
          )}
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

// iOS Settings-style menu row
function MenuRow({
  icon, label, sublabel, onClick, last = false,
}: {
  icon: string;
  label: string;
  sublabel?: string;
  onClick: () => void;
  last?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 14,
        padding: '13px 18px',
        background: 'transparent', border: 'none', cursor: 'pointer',
        borderBottom: last ? 'none' : '1px solid rgba(255,255,255,0.05)',
        textAlign: 'left', minHeight: 56,
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      {/* Icon */}
      <div style={{
        width: 34, height: 34, borderRadius: 9, flexShrink: 0,
        background: 'rgba(255,255,255,0.07)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 16,
      }}>{icon}</div>
      {/* Labels */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#f8f8fc' }}>{label}</div>
        {sublabel && (
          <div style={{ fontSize: 12, color: 'rgba(248,248,252,0.35)', marginTop: 1 }}>{sublabel}</div>
        )}
      </div>
      {/* Chevron */}
      <span style={{ fontSize: 14, color: 'rgba(248,248,252,0.2)', flexShrink: 0 }}>›</span>
    </button>
  );
}
