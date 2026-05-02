import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AppLauncher from './AppLauncher';
import AuraOverlay from './AuraOverlay';
import GlobalFeedbackButton from '../components/GlobalFeedbackButton';
import { appById, type AppId } from '../runtime/ontology';
import { AuraClient } from '../lib/AuraClient';

type ShellApp = Exclude<AppId, 'aventi' | 'ivive' | 'eviva'>;

interface ConnectomeShellProps {
  children: React.ReactNode;
  activeApp?: ShellApp;
}

function appLabel(appId: ShellApp) {
  if (appId === 'home') return 'Aura';
  if (appId === 'ido') return 'Now Feed';
  return appById(appId)?.name || 'Aura';
}

const PATH_DOMAIN_TABS = [
  { id: '', label: 'All', emoji: '◈', color: '#00d4aa' },
  { id: 'iVive', label: 'iVive', emoji: '🌱', color: '#10b981' },
  { id: 'Aventi', label: 'Aventi', emoji: '🚀', color: '#f59e0b' },
  { id: 'Eviva', label: 'Eviva', emoji: '🌊', color: '#3b82f6' },
] as const;

type DockItem = {
  id: string;
  label: string;
  icon: string;
  path?: string;
  action?: 'aura' | 'launcher';
};

const CORE_DOCK: DockItem[] = [
  { id: 'now', label: 'Now', icon: '⚡', path: '/app/ido' },
  { id: 'future', label: 'Future', icon: '🔭', path: '/app/future' },
  { id: 'ora', label: 'Aura', icon: '◈', action: 'aura' },
  { id: 'goals', label: 'Goals', icon: '🎯', path: '/app/goals' },
  { id: 'profile', label: 'Profile', icon: '👤', path: '/app/profile' },
];

const dockMenus: Partial<Record<ShellApp, DockItem[]>> = {
  home: CORE_DOCK,
  ido: CORE_DOCK,
  goals: CORE_DOCK,
  routines: CORE_DOCK,
  dao: CORE_DOCK,
  contribute: CORE_DOCK,
  services: CORE_DOCK,
  ioo: CORE_DOCK,
  profile: CORE_DOCK,
};

function initials(profile: any) {
  const raw = profile?.display_name || profile?.name || profile?.email || 'Avi';
  return String(raw).trim().slice(0, 1).toUpperCase();
}

const LIVE_LOCATION_SYNC_KEY = `connectome_live_location_${new Date().toISOString().slice(0, 10)}`;
const LIVE_LOCATION_DISMISSED_KEY = 'connectome_live_location_dismissed_session';

function LocationEntryPrompt({ onAllow, onSkip, syncing }: { onAllow: () => void; onSkip: () => void; syncing: boolean }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 80, display: 'grid', placeItems: 'center', padding: 22, background: 'rgba(0,0,0,0.58)', backdropFilter: 'blur(18px)' }}>
      <div style={{ width: 'min(420px, 100%)', border: '1px solid rgba(0,212,170,0.26)', background: 'linear-gradient(180deg, rgba(18,24,30,0.98), rgba(8,10,15,0.98))', borderRadius: 28, padding: 24, boxShadow: '0 24px 80px rgba(0,0,0,0.45)' }}>
        <div style={{ width: 48, height: 48, borderRadius: 18, display: 'grid', placeItems: 'center', background: 'rgba(0,212,170,0.13)', color: '#00d4aa', fontSize: 24, marginBottom: 14 }}>📍</div>
        <h2 style={{ color: '#f8f8fc', margin: '0 0 8px', fontSize: 24, letterSpacing: -0.6 }}>Activate local intelligence?</h2>
        <p style={{ color: 'rgba(248,248,252,0.62)', margin: '0 0 18px', fontSize: 14, lineHeight: 1.65 }}>
          Connectome can use your location to tune the IOO graph toward nearby events, classes, places, adventures, and realistic next steps. You can skip this anytime.
        </p>
        <div style={{ display: 'grid', gap: 10 }}>
          <button type="button" disabled={syncing} onClick={onAllow} style={{ border: 0, borderRadius: 16, padding: '14px 16px', background: '#00d4aa', color: '#06110f', fontWeight: 900, fontSize: 15 }}>
            {syncing ? 'Activating…' : 'Share location'}
          </button>
          <button type="button" onClick={onSkip} style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: '12px 16px', background: 'rgba(255,255,255,0.04)', color: 'rgba(248,248,252,0.68)', fontWeight: 800 }}>
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ConnectomeShell({ children, activeApp = 'home' }: ConnectomeShellProps) {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [auraOpen, setAuraOpen] = useState(false);
  const [launcherOpen, setLauncherOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [locationPromptOpen, setLocationPromptOpen] = useState(false);
  const [locationSyncing, setLocationSyncing] = useState(false);

  const closeApps = () => setLauncherOpen(false);
  const toggleApps = () => setLauncherOpen((open) => !open);

  useEffect(() => {
    const openAura = () => setAuraOpen(true);
    window.addEventListener('connectome:open-aura', openAura);
    return () => window.removeEventListener('connectome:open-aura', openAura);
  }, []);

  const syncLiveLocation = async () => {
    if (!('geolocation' in navigator)) {
      setLocationPromptOpen(false);
      return;
    }
    setLocationSyncing(true);
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
          setLocationPromptOpen(false);
        } catch {
          setLocationPromptOpen(false);
        } finally {
          setLocationSyncing(false);
        }
      },
      () => {
        setLocationPromptOpen(false);
        setLocationSyncing(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 10 * 60 * 1000 },
    );
  };

  useEffect(() => {
    if (!profile) return;
    if (localStorage.getItem(LIVE_LOCATION_SYNC_KEY)) return;
    if (sessionStorage.getItem(LIVE_LOCATION_DISMISSED_KEY)) return;
    if (!('geolocation' in navigator)) return;

    const permissions = (navigator as any).permissions;
    if (!permissions?.query) {
      setLocationPromptOpen(true);
      return;
    }

    permissions.query({ name: 'geolocation' as PermissionName })
      .then((status: PermissionStatus) => {
        if (status.state === 'granted') syncLiveLocation();
        else if (status.state === 'prompt') setLocationPromptOpen(true);
      })
      .catch(() => setLocationPromptOpen(true));
  }, [profile]);

  const dockItems = dockMenus[activeApp] || dockMenus.home || [];
  const feedParams = new URLSearchParams(location.search);
  const activeDomain = feedParams.get('domain') || '';

  const setFeedDomain = (domain: string) => {
    const next = new URLSearchParams(location.search);
    if (domain) next.set('domain', domain);
    else next.delete('domain');
    next.delete('mode');
    const query = next.toString();
    navigate(query ? `/app/ido?${query}` : '/app/ido', { replace: true });
  };

  const handleDock = (item: DockItem) => {
    if (item.action === 'aura') {
      setAuraOpen(true);
      return;
    }
    if (item.action === 'launcher') {
      setLauncherOpen(true);
      return;
    }
    if (item.path) navigate(item.path);
  };

  return (
    <div className="connectome-shell">
      <div className="connectome-stars" aria-hidden="true" />
      <header className={`connectome-ambient-chrome ${launcherOpen ? 'connectome-topbar--launcher-open' : ''}`}>
        <button
          className={`connectome-launcher-toggle ${launcherOpen ? 'connectome-launcher-toggle--open' : ''}`}
          type="button"
          onClick={toggleApps}
          aria-label={launcherOpen ? 'Close app launcher' : 'Open app launcher'}
          aria-expanded={launcherOpen}
          aria-controls="connectome-app-launcher"
        >
          <span className="connectome-launcher-toggle__line" />
          <span className="connectome-launcher-toggle__line" />
          <span className="connectome-launcher-toggle__line" />
        </button>

        {activeApp === 'ido' ? (
          <div className="connectome-domain-switch" aria-label="Path domain filter">
            {PATH_DOMAIN_TABS.map((tab) => {
              const active = activeDomain === tab.id;
              return (
                <button
                  key={tab.id || 'all'}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setFeedDomain(tab.id)}
                  style={active ? ({ '--domain-color': tab.color } as React.CSSProperties) : undefined}
                  className={`connectome-domain-switch__item ${active ? 'connectome-domain-switch__item--active' : ''}`}
                >
                  <span aria-hidden="true">{tab.emoji}</span>{tab.label}
                </button>
              );
            })}
          </div>
        ) : (
          <span className="connectome-context-label connectome-context-label--ambient" aria-live="polite">{appLabel(activeApp)}</span>
        )}

        <div className="connectome-status">
          <button
            type="button"
            className="connectome-feedback-btn"
            data-feedback-widget="true"
            aria-label="Send feedback"
            onClick={() => setFeedbackOpen(true)}
          >
            !
          </button>
        </div>
      </header>

      <main className={`connectome-main connectome-main--${activeApp}`}>
        {children}
      </main>

      <nav className={`connectome-dock connectome-dock--${dockItems.length}`} aria-label={`${appLabel(activeApp)} navigation`}>
        {dockItems.map((item) => {
          const currentRoute = `${location.pathname}${location.search}`;
          const active = item.id === activeApp || (item.path && (currentRoute === item.path || location.pathname === item.path)) || (activeApp === 'ido' && item.id === 'now' && location.pathname === '/app/ido') || (activeApp === 'ido' && item.id === 'future' && location.pathname === '/app/future');
          return (
            <button
              key={item.id}
              type="button"
              className={`connectome-dock__item ${active ? 'connectome-dock__item--active' : ''} ${item.id === 'ora' ? 'connectome-dock__item--ora' : ''}`}
              onClick={() => handleDock(item)}
              aria-label={item.label}
            >
              <span>{item.icon}</span>
              <small>{item.label}</small>
            </button>
          );
        })}
      </nav>

      {launcherOpen && (
        <div className="connectome-launcher-sheet" onClick={closeApps}>
          <div
            id="connectome-app-launcher"
            className="connectome-launcher-sheet__panel"
            onClick={(event) => event.stopPropagation()}
          >
            <AppLauncher onLaunch={closeApps} />
          </div>
        </div>
      )}

      <button className="connectome-signout" type="button" onClick={() => { logout(); navigate('/'); }}>Sign out</button>
      <GlobalFeedbackButton inlineMode inlineTrigger={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
      <AuraOverlay open={auraOpen} onClose={() => setAuraOpen(false)} />
      {locationPromptOpen && (
        <LocationEntryPrompt
          syncing={locationSyncing}
          onAllow={syncLiveLocation}
          onSkip={() => {
            sessionStorage.setItem(LIVE_LOCATION_DISMISSED_KEY, '1');
            setLocationPromptOpen(false);
          }}
        />
      )}
    </div>
  );
}
