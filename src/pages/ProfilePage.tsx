import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuraClient } from '../lib/AuraClient';
import { useAuth } from '../context/AuthContext';
import { useExperiment } from '../lib/useExperiment';
import { StreakBadge } from '../components/StreakBadge';
import { billingCancelUrl, billingSuccessUrl } from '../lib/checkoutUrls';
import { UpgradePanel } from '../components/UpgradePanel';

const EXPERIMENT_ID = 'primary_landing_v1';
const VARIANTS = ['A', 'B', 'C', 'D'] as const;
const VARIANT_LABELS: Record<string, string> = {
  A: 'A — TikTok Feed',
  B: 'B — Morning Brief',
  C: 'C — Goal Pulse',
  D: 'D — Discovery Grid',
};

const LIVE_LOCATION_SYNC_KEY = `connectome_live_location_${new Date().toISOString().slice(0, 10)}`;
const TOP_LEVEL_VALUES = [
  'enlightenment', 'peace', 'pleasure', 'love', 'vitality',
  'freedom', 'mastery', 'contribution', 'abundance', 'adventure',
] as const;
const DEFAULT_VALUE_SCORES: Record<(typeof TOP_LEVEL_VALUES)[number], number> = {
  enlightenment: 7,
  peace: 7,
  pleasure: 6,
  love: 8,
  vitality: 7,
  freedom: 8,
  mastery: 6,
  contribution: 7,
  abundance: 6,
  adventure: 7,
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const { logout, refreshProfile } = useAuth();
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
  const [contributionStats, setContributionStats] = useState<any>(null);
  const [locationSharingStatus, setLocationSharingStatus] = useState<'unknown' | 'synced' | 'syncing' | 'denied' | 'error'>(() => (
    localStorage.getItem(LIVE_LOCATION_SYNC_KEY) ? 'synced' : 'unknown'
  ));
  const [locationCity, setLocationCity] = useState<string>(() => localStorage.getItem(`${LIVE_LOCATION_SYNC_KEY}_city`) || '');
  const [valueScores, setValueScores] = useState<Record<string, number>>(DEFAULT_VALUE_SCORES);
  const [savingValues, setSavingValues] = useState(false);
  const [valueSaveStatus, setValueSaveStatus] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [showUpgradePanel, setShowUpgradePanel] = useState(false);
  const [travelModeEnabled, setTravelModeEnabled] = useState(false);
  const [savingTravelMode, setSavingTravelMode] = useState(false);
  const [travelModeStatus, setTravelModeStatus] = useState<string | null>(null);

  // ── A/B hooks must be BEFORE any conditional returns (Rules of Hooks) ──
  const { variant: upgradeHeadlineVariant, trackEvent: trackUpgradeHeadline } = useExperiment('upgrade_headline');
  const { variant: priceDisplayVariant } = useExperiment('upgrade_price_display');
  const { variant: ctaButtonVariant, trackEvent: trackUpgradeCTA } = useExperiment('upgrade_cta_button');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = await AuraClient.getProfile();
      setProfile(p);
      AuraClient.getContributionStats().then(setContributionStats).catch(() => {});
      const adminFlag = p?.profile?.is_admin || localStorage.getItem('ab_admin') === 'true';
      setIsAdmin(adminFlag);
      if (adminFlag) localStorage.setItem('ab_admin', 'true');
      const savedValues = p?.profile?.value_weights || p?.profile?.valueWeights;
      if (savedValues && typeof savedValues === 'object') {
        setValueScores({ ...DEFAULT_VALUE_SCORES, ...savedValues });
      }
      setTravelModeEnabled(Boolean(p?.profile?.travel_mode_enabled));

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
        AuraClient['client'].get('/api/executive/brief', { headers }),
        AuraClient['client'].get('/api/executive/agents', { headers }),
        AuraClient['client'].get('/api/executive/metrics', { headers }),
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
      await AuraClient['client'].post(`/api/executive/run/${agentName}`, {}, {
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
      const res = await AuraClient['client'].get(`/api/ab/results/${EXPERIMENT_ID}`);
      setAbResults(res.data);
      const winnerRes = await AuraClient['client'].get(`/api/ab/winner/${EXPERIMENT_ID}`).catch(() => ({ data: { winner: null } }));
      setAbWinner(winnerRes.data.winner);
    } catch {}
  };

  const loadAllExperiments = async () => {
    setAllExperimentsLoading(true);
    try {
      const res = await AuraClient['client'].get('/api/ab/results');
      setAllExperiments(res.data);
    } catch {}
    setAllExperimentsLoading(false);
  };

  const applyExperimentWinner = async (experiment: string, winner: string) => {
    setApplyingWinner(experiment);
    try {
      await AuraClient['client'].post('/api/ab/winner', { experiment, winner });
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
    navigate('/app/ido');
  };

  const loadSurfaces = async () => {
    setSurfacesLoading(true);
    try {
      const res = await AuraClient['client'].get('/api/surfaces/my');
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
      const res = await AuraClient['client'].post('/api/surfaces/spawn', { request: spawnRequest });
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

  const saveValueCompass = async () => {
    setSavingValues(true);
    setValueSaveStatus(null);
    try {
      const cleaned = Object.fromEntries(
        Object.entries(valueScores).map(([key, value]) => [key, Math.max(1, Math.min(10, Number(value) || 5))])
      );
      const updated = await AuraClient.updateProfile({ value_weights: cleaned });
      setProfile(updated);
      setValueSaveStatus('Saved — Aura will use this compass and keep learning from your choices.');
    } catch {
      setValueSaveStatus('Could not save values. Try again.');
    }
    setSavingValues(false);
  };

  const saveTravelMode = async (enabled: boolean) => {
    setSavingTravelMode(true);
    setTravelModeStatus(null);
    try {
      const updated = await AuraClient.updateProfile({ travel_mode_enabled: enabled });
      setProfile(updated);
      setTravelModeEnabled(Boolean(updated?.profile?.travel_mode_enabled));
      setTravelModeStatus(enabled
        ? 'Travel mode on — Aura may include worthwhile non-local opportunities.'
        : 'Travel mode off — local feed cards will stay pinned to your current city.');
    } catch (e: any) {
      setTravelModeStatus(e?.response?.status === 402
        ? 'Travel mode is for Explorer and Sovereign members.'
        : 'Could not save travel mode. Try again.');
    }
    setSavingTravelMode(false);
  };

  const handleRetireSurface = async (id: string) => {
    if (!window.confirm('Remove this surface? This cannot be undone.')) return;
    try {
      await AuraClient['client'].delete(`/api/surfaces/${id}`);
      setSurfaces((prev) => prev.filter((s) => s.id !== id));
    } catch {}
  };

  const loadProposals = async () => {
    setProposalsLoading(true);
    try {
      const res = await AuraClient['client'].get('/api/ora/autonomy/proposals');
      setProposals(res.data?.proposals || []);
    } catch {}
    setProposalsLoading(false);
  };

  const loadAgentPopulation = async () => {
    setAgentPopulationLoading(true);
    try {
      const res = await AuraClient['client'].get('/api/ora/autonomy/evolution/population');
      setAgentPopulation(res.data?.population || []);
    } catch {}
    setAgentPopulationLoading(false);
  };

  const loadEvolutionProposals = async () => {
    setEvolutionProposalsLoading(true);
    try {
      const res = await AuraClient['client'].get('/api/ora/autonomy/evolution/proposals');
      setEvolutionProposals(res.data?.proposals || []);
    } catch {}
    setEvolutionProposalsLoading(false);
  };

  const handleEvolutionProposal = async (id: string, action: 'approve' | 'reject') => {
    try {
      await AuraClient['client'].post(`/api/ora/autonomy/evolution/proposals/${id}/${action}`);
      await loadEvolutionProposals();
    } catch (e: any) {
      alert(`Failed to ${action}: ${e?.response?.data?.detail || 'Unknown error'}`);
    }
  };

  const handleProposal = async (id: string, action: 'approve' | 'reject') => {
    try {
      await AuraClient['client'].post(`/api/ora/autonomy/proposals/${id}/${action}`);
      await loadProposals();
    } catch (e: any) {
      alert(`Failed to ${action}: ${e?.response?.data?.detail || 'Unknown error'}`);
    }
  };

  const runAutonomy = async () => {
    setRunningAutonomy(true);
    try {
      const res = await AuraClient['client'].post('/api/ora/autonomy/run');
      setAutonomyStatus(res.data);
    } catch (e: any) {
      setAutonomyStatus({ error: e?.response?.data?.detail || 'Failed' });
    }
    setRunningAutonomy(false);
  };

  const connectGoogle = async () => {
    try {
      const res = await AuraClient.connectGoogleDrive();
      if (res.already_connected) {
        alert('Google Drive is already connected.');
        return;
      }
      if (res.auth_url) window.location.href = res.auth_url;
      else alert('Google Drive connection did not return a sign-in URL.');
    } catch (e: any) {
      const detail = e?.response?.data?.detail || 'Could not start Google Drive connection.';
      alert(detail);
    }
  };

  const enableLocationSharing = async () => {
    if (!('geolocation' in navigator)) {
      setLocationSharingStatus('error');
      alert('Location sharing is not available in this browser.');
      return;
    }
    setLocationSharingStatus('syncing');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await AuraClient.syncLiveLocation({
            location_lat: pos.coords.latitude,
            location_lng: pos.coords.longitude,
            accuracy_m: pos.coords.accuracy,
            event_preferences: ['wellness', 'music', 'arts', 'community', 'sports', 'tech'],
          });
          localStorage.setItem(LIVE_LOCATION_SYNC_KEY, new Date().toISOString());
          localStorage.setItem(`${LIVE_LOCATION_SYNC_KEY}_city`, res.city || 'near you');
          setLocationCity(res.city || 'near you');
          setLocationSharingStatus('synced');
          alert(`Location sharing enabled for ${res.city || 'near you'}.`);
        } catch (e: any) {
          setLocationSharingStatus('error');
          alert(e?.response?.data?.detail || 'Could not sync location with Connectome.');
        }
      },
      () => {
        setLocationSharingStatus('denied');
        alert('Location permission was not granted. You can enable it in your browser/site settings, then try again here.');
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 10 * 60 * 1000 },
    );
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleProfileUpgrade = async () => {
    setCheckoutLoading(true);
    setCheckoutError(null);
    try {
      trackUpgradeCTA('click');
      const session = await AuraClient.createCheckout(
        'explorer',
        'monthly',
        billingSuccessUrl('explorer'),
        billingCancelUrl(),
      );
      window.location.href = session.checkout_url;
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Could not start checkout. Please try again.';
      setCheckoutError(typeof msg === 'string' ? msg : JSON.stringify(msg));
      setCheckoutLoading(false);
      await refreshProfile().catch(() => {});
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div style={{ fontSize: 32, color: '#00d4aa', animation: 'brainFloat 3s ease-in-out infinite' }}>◈</div>
      </div>
    );
  }

  const tier = profile?.subscription_tier || 'free';
  const isPaidTier = ['explorer', 'sovereign', 'premium'].includes(tier);
  const tierColor = tier === 'sovereign' ? '#a855f7' : tier === 'explorer' || tier === 'premium' ? '#3b82f6' : '#6b7280';

  const UPGRADE_HEADLINES: Record<string, string> = {
    A: 'Unlock the full Aura',
    B: 'Go deeper with Explorer',
    C: "You're using Connectome like a power user",
    D: 'Explorer — built for people serious about their goals',
  };
  const UPGRADE_PRICES: Record<string, string> = {
    A: '$9/month',
    B: '$0.30/day',
    C: 'Less than a coffee/month',
  };
  const UPGRADE_CTAS: Record<string, string> = {
    A: 'Upgrade to Explorer',
    B: 'Unlock Explorer — $9/mo',
    C: 'Try Explorer Free for 7 Days',
    D: 'Get Explorer',
  };
  const upgradeHeadlineText = UPGRADE_HEADLINES[upgradeHeadlineVariant] || UPGRADE_HEADLINES['A'];
  const upgradePriceText = UPGRADE_PRICES[priceDisplayVariant] || UPGRADE_PRICES['A'];
  const upgradeCTAText = UPGRADE_CTAS[ctaButtonVariant] || UPGRADE_CTAS['A'];

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '16px 16px', paddingBottom: 'calc(var(--bottom-nav-height, 80px) + env(safe-area-inset-bottom, 0px) + 16px)', overflowY: 'auto' }}>

      {showUpgradePanel && (
        <UpgradePanel currentTier={tier} onClose={() => setShowUpgradePanel(false)} />
      )}

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
          <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: tierColor, background: tierColor + '15', border: `1px solid ${tierColor}33`, padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>
              {tier.toUpperCase()}
            </span>
            <button
              onClick={() => setShowUpgradePanel(true)}
              style={{
                fontSize: 11, fontWeight: 900, letterSpacing: 0.5,
                background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                color: '#fff', border: 'none',
                padding: '3px 10px', borderRadius: 10,
                cursor: 'pointer',
                boxShadow: '0 2px 10px rgba(139,92,246,0.3)',
              }}
            >
              UPGRADE
            </button>
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
          {/* ── Streak + Milestones + Badges ── */}
          <StreakBadge />

          <Card title="Value compass">
            <div style={{ fontSize: 13, color: 'rgba(248,248,252,0.62)', lineHeight: 1.6, marginBottom: 12 }}>
              Tell Aura what matters most right now. These 1–10 weights are editable anytime, and Aura will gently learn from what you swipe, save, choose, and achieve.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '10px 14px' }}>
              {TOP_LEVEL_VALUES.map(valueName => (
                <label key={valueName} style={{ display: 'grid', gridTemplateColumns: '96px 1fr 42px', alignItems: 'center', gap: 8, fontSize: 12 }}>
                  <span style={{ fontWeight: 850, textTransform: 'capitalize', color: 'rgba(248,248,252,0.82)' }}>{valueName}</span>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={valueScores[valueName] ?? 5}
                    onChange={(e) => setValueScores(prev => ({ ...prev, [valueName]: Number(e.target.value) }))}
                  />
                  <span style={{ color: '#f4c26b', fontWeight: 950 }}>{valueScores[valueName] ?? 5}/10</span>
                </label>
              ))}
            </div>
            <button onClick={saveValueCompass} disabled={savingValues} style={{ marginTop: 14, background: '#f4c26b', color: '#0a0a0f', border: 'none', borderRadius: 10, padding: '9px 12px', fontWeight: 900 }}>
              {savingValues ? 'Saving…' : 'Save value compass'}
            </button>
            {valueSaveStatus && <div style={{ marginTop: 10, fontSize: 12, color: valueSaveStatus.startsWith('Saved') ? '#34d399' : '#ef4444' }}>{valueSaveStatus}</div>}
          </Card>

          <Card title="Contributions">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 12 }}>
              <StatBox label="Total CP" value={(contributionStats?.total_cp || profile?.profile?.total_dao_cp || 0).toLocaleString()} color="#f4c26b" />
              <StatBox label="Approved" value={contributionStats?.contributions_approved || 0} color="#34d399" />
              <StatBox label="Rank" value={contributionStats?.weekly_xp_rank ? `#${contributionStats.weekly_xp_rank}` : '—'} color="#00d4aa" />
            </div>
            <Row label="Contributor tier" value={contributionStats?.tier || 'observer'} valueColor="#00d4aa" />
            <Row
              label="GitHub"
              value={contributionStats?.github_connected ? `✓ @${contributionStats.github_username}` : 'Not connected'}
              valueColor={contributionStats?.github_connected ? '#34d399' : 'rgba(248,248,252,0.45)'}
            />
            {contributionStats?.recent_contributions?.length > 0 && (
              <div style={{ marginTop: 12, borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 10 }}>
                {contributionStats.recent_contributions.slice(0, 3).map((c: any) => (
                  <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 12, marginBottom: 8 }}>
                    <span style={{ color: 'rgba(248,248,252,0.72)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</span>
                    <span style={{ color: c.status === 'approved' || c.status === 'accepted' ? '#34d399' : '#f4c26b', fontWeight: 700 }}>{c.status}</span>
                  </div>
                ))}
              </div>
            )}
            {!contributionStats?.github_connected && (
              <button onClick={() => { window.location.href = AuraClient.getGitHubLoginUrl(); }} style={{ marginTop: 12, background: '#00d4aa', color: '#07110f', border: 'none', borderRadius: 10, padding: '9px 12px', fontWeight: 800 }}>Connect GitHub</button>
            )}
          </Card>

          {/* ── Upgrade nudge for free users ── */}
          {tier === 'free' && (
            <div
              onClick={() => setShowUpgradePanel(true)}
              style={{
                background: 'linear-gradient(135deg, rgba(99,102,241,0.09), rgba(139,92,246,0.06))',
                border: '1px solid rgba(99,102,241,0.25)',
                borderRadius: 16, padding: '16px 18px',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
              }}
            >
              <div>
                <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 3 }}>Unlock the full Aura</div>
                <div style={{ fontSize: 12, color: 'rgba(248,248,252,0.45)' }}>More paths · unlimited cards · Drive · from $9/mo</div>
              </div>
              <div style={{
                background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                color: '#fff', fontWeight: 900, fontSize: 12,
                padding: '7px 14px', borderRadius: 10, flexShrink: 0,
                boxShadow: '0 2px 12px rgba(139,92,246,0.3)',
              }}>UPGRADE ✦</div>
            </div>
          )}

          <Card title="City unlock · Victoria + Vancouver beta">
            <div style={{ fontSize: 13, color: 'rgba(248,248,252,0.62)', lineHeight: 1.65, marginBottom: 12 }}>
              Aura is expanding the local graph into a BC corridor: Victoria + Vancouver events, classes, products, services, bookings, volunteering, developer channels, and user-created nodes — capped around <strong style={{ color: '#f8f8fc' }}>$1,000/month</strong> instead of crawling the whole web.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
              <StatBox label="Corridor cost" value="$1k" color="#00d4aa" />
              <StatBox label="100 locals" value="~$11.50" color="#f4c26b" />
              <StatBox label="250 locals" value="~$4.60" color="#34d399" />
            </div>
            <div style={{ fontSize: 12, color: 'rgba(248,248,252,0.48)', lineHeight: 1.55, marginBottom: 12 }}>
              Budget split: ~$600 local opportunity intelligence, ~$250 Victoria/Vancouver developer-programmer outreach, ~$100 community experiments, ~$50 buffer. The shared price can go down as more locals join.
            </div>
            <button onClick={() => navigate('/app/ido')} style={{ background: 'rgba(0,212,170,0.16)', color: '#00d4aa', border: '1px solid rgba(0,212,170,0.36)', borderRadius: 10, padding: '9px 12px', fontWeight: 850 }}>
              Add or explore BC corridor opportunities →
            </button>
          </Card>

          <Card title="Travel mode">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14 }}>
              <div>
                <div style={{ fontSize: 13, color: 'rgba(248,248,252,0.66)', lineHeight: 1.6 }}>
                  Keep your normal feed strictly local, or let Aura include worthwhile opportunities in nearby and destination cities when you are exploring.
                </div>
                <div style={{ fontSize: 12, color: isPaidTier ? '#34d399' : '#f4c26b', marginTop: 8, fontWeight: 700 }}>
                  {isPaidTier ? 'Included with your subscription.' : 'Explorer or Sovereign required.'}
                </div>
              </div>
              <button
                disabled={!isPaidTier || savingTravelMode}
                onClick={() => saveTravelMode(!travelModeEnabled)}
                style={{
                  minWidth: 76,
                  border: '1px solid ' + (travelModeEnabled ? 'rgba(0,212,170,0.55)' : 'rgba(255,255,255,0.14)'),
                  background: travelModeEnabled ? 'rgba(0,212,170,0.18)' : 'rgba(255,255,255,0.06)',
                  color: travelModeEnabled ? '#00d4aa' : 'rgba(248,248,252,0.64)',
                  opacity: !isPaidTier ? 0.55 : 1,
                  borderRadius: 999,
                  padding: '8px 12px',
                  fontSize: 12,
                  fontWeight: 900,
                  cursor: !isPaidTier || savingTravelMode ? 'not-allowed' : 'pointer',
                }}
              >
                {savingTravelMode ? 'Saving…' : travelModeEnabled ? 'ON' : 'OFF'}
              </button>
            </div>
            {travelModeStatus && <div style={{ marginTop: 10, fontSize: 12, color: travelModeStatus.startsWith('Could') || travelModeStatus.includes('for Explorer') ? '#ef4444' : '#34d399' }}>{travelModeStatus}</div>}
            {!isPaidTier && (
              <button onClick={() => setShowUpgradePanel(true)} style={{ marginTop: 12, background: '#6366f1', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 12px', fontWeight: 800, cursor: 'pointer' }}>
                Upgrade to unlock travel mode
              </button>
            )}
          </Card>

          {/* ── Secondary Navigation — iOS Settings style ── */}
          <div style={{ background: '#12121e', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: 'rgba(248,248,252,0.3)', textTransform: 'uppercase', padding: '14px 18px 6px' }}>Community</div>
            <MenuRow icon="🏛" label="DAO & Contributions" sublabel="Earn CP, vote on proposals" onClick={() => navigate('/app/dao')} />
            <MenuRow icon="✍" label="Journal" sublabel="Your personal log" onClick={() => navigate('/app/ido')} />
          </div>

          <div style={{ background: '#12121e', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: 'rgba(248,248,252,0.3)', textTransform: 'uppercase', padding: '14px 18px 6px' }}>My Account</div>
            <MenuRow icon="🌐" label="My Surfaces" sublabel="Personalized pages Aura built" onClick={() => { setSection('surfaces'); loadSurfaces(); }} />
            <MenuRow
              icon="📍"
              label={locationSharingStatus === 'syncing' ? 'Enabling location…' : 'Enable location sharing'}
              sublabel={locationSharingStatus === 'synced' ? `On${locationCity ? ` · ${locationCity}` : ''}` : 'Use nearby events, places, classes, and local path recommendations'}
              onClick={enableLocationSharing}
            />
            <MenuRow icon="🔗" label="Google Account" sublabel="Drive sync & calendar" onClick={() => setSection('google')} />
            <MenuRow icon="📱" label="Get the App" sublabel="Add Connectome to your home screen" onClick={() => {}} last />
          </div>

          {/* ── Admin shortcut ── */}
          {isAdmin && (
            <div style={{ background: '#12121e', border: '1px solid rgba(0,212,170,0.15)', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: '#00d4aa', textTransform: 'uppercase', padding: '14px 18px 6px', opacity: 0.7 }}>Admin</div>
              <MenuRow icon="📊" label="Dashboard" sublabel="User & revenue metrics" onClick={() => {
                setSection('dashboard');
                setDashboardLoading(true);
                AuraClient['client'].get('/api/admin/dashboard', { headers: { 'X-Admin-Token': localStorage.getItem('admin_token') || 'connectome-admin-secret' } })
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
                  What should Aura build for you?
                </div>
                <p style={{ fontSize: 13, color: 'rgba(248,248,252,0.45)', marginBottom: 16 }}>
                  Describe your goal or need in plain language. Aura will design the perfect page for you — no templates.
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
                    {spawning ? 'Aura is designing…' : 'Build my surface'}
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
                Personalized pages Aura built for you
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
              ✨ WebSpawn is an Explorer & Sovereign feature. Aura builds personalized pages for any goal — a dashboard, a plan, a tracker, whatever fits. <button type="button" onClick={() => setShowUpgradePanel(true)} style={{ color: '#8b5cf6', fontWeight: 700, background: 'transparent', border: 0, padding: 0, cursor: 'pointer' }}>Upgrade to unlock it.</button>
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
                Tell Aura what you want to track, build, or plan.<br />
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
              Connect your Google Drive to enable personalized context — Aura can read approved documents and surface them as coaching cards.
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
              Connect Google Drive
            </button>
            {isAdmin && (
              <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(0,212,170,0.06)', border: '1px solid rgba(0,212,170,0.15)', borderRadius: 10 }}>
                <div style={{ fontSize: 12, color: '#00d4aa', fontWeight: 600 }}>⚡ Admin: Your Google account grants full modulation privileges</div>
              </div>
            )}
          </Card>

          <Card title="Drive Sync">
            <div style={{ fontSize: 13, color: 'rgba(248,248,252,0.5)', marginBottom: 12 }}>
              Once connected, Aura indexes your Drive documents as personalized coaching content.
            </div>
            <button
              onClick={async () => {
                try {
                  await AuraClient.setDrivePrivacy('full');
                  await AuraClient.syncGoogleDrive();
                  alert('Drive sync started — Aura is indexing your approved docs');
                } catch (e: any) {
                  alert(e?.response?.data?.detail || 'Connect Google Drive first');
                }
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
          <Card title="Aura Autonomy Engine">
            <div style={{ fontSize: 13, color: 'rgba(248,248,252,0.55)', lineHeight: 1.6, marginBottom: 14 }}>
              Triggers Aura's full self-improvement cycle: A/B analysis, feed weight optimization, bug detection, and daily report.
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
                const res = await AuraClient['client'].get('/api/ora/health/dashboard').catch(() => ({ data: null }));
                alert(JSON.stringify(res.data, null, 2));
              }}
              style={{ width: '100%', padding: '10px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(248,248,252,0.7)', fontWeight: 600, fontSize: 13 }}
            >
              View Health Dashboard
            </button>
          </Card>

          <Card title="Aura's Self-Improvement Proposals">
            <div style={{ fontSize: 13, color: 'rgba(248,248,252,0.5)', marginBottom: 12 }}>
              High-risk improvements Aura wants to make — review and approve or reject.
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
              Aura's living agent roster — builtin, spawned, partitioned, and merged agents.
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
              Risky evolutions Aura wants to run — review and approve or reject.
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
                    await AuraClient['client'].delete(`/api/ab/winner/${EXPERIMENT_ID}`).catch(() => {});
                    alert('Winner cleared — back to random assignment');
                  } else {
                    await AuraClient['client'].post(`/api/ab/set-winner/${EXPERIMENT_ID}`, { winner: v }).catch(() => {});
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
function StatBox({ label, value, color }: { label: string; value: React.ReactNode; color: string }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 10 }}>
      <div style={{ color, fontWeight: 900, fontSize: 18 }}>{value}</div>
      <div style={{ color: 'rgba(248,248,252,0.42)', fontSize: 10, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.6 }}>{label}</div>
    </div>
  );
}

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
