import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AppLauncher from './AppLauncher';
import AuraOverlay from './AuraOverlay';
import GlobalFeedbackButton from '../components/GlobalFeedbackButton';
import { appById, type AppId } from '../runtime/ontology';
import { AuraClient } from '../lib/AuraClient';
import { ENABLE_NOTIFICATION_BELL } from '../lib/config';

type ShellApp = Exclude<AppId, 'aventi' | 'ivive' | 'eviva'>;

interface ConnectomeShellProps {
  children: React.ReactNode;
  activeApp?: ShellApp;
}

function appLabel(appId: ShellApp) {
  if (appId === 'home') return 'Aura';
  if (appId === 'ido') return 'Path Feed';
  return appById(appId)?.name || 'Aura';
}

type DockItem = {
  id: string;
  label: string;
  icon: string;
  path?: string;
  action?: 'aura' | 'launcher';
};

const dockMenus: Partial<Record<ShellApp, DockItem[]>> = {
  home: [
    { id: 'ido', label: 'Path', icon: '🚀', path: '/app/ido' },
    { id: 'ioo', label: 'Graph', icon: '🧬', path: '/app/ioo' },
    { id: 'aura', label: 'Aura', icon: '◈', action: 'aura' },
    { id: 'goals', label: 'Goals', icon: '🎯', path: '/app/goals' },
    { id: 'dao', label: 'DAO', icon: '🏛️', path: '/app/dao' },
  ],
  ido: [
    { id: 'feed', label: 'Feed', icon: '✦', path: '/app/ido' },
    { id: 'delegate', label: 'Delegate', icon: '🤝', action: 'aura' },
    { id: 'plan', label: 'Plan', icon: '🎯', path: '/app/goals' },
    { id: 'aura', label: 'Aura', icon: '◈', action: 'aura' },
    { id: 'ditch', label: 'Ditch', icon: '🗑️', path: '/app/routines' },
  ],
  goals: [
    { id: 'ido', label: 'Path', icon: '🚀', path: '/app/ido' },
    { id: 'delegate', label: 'Delegate', icon: '🤝', action: 'aura' },
    { id: 'aura', label: 'Aura', icon: '◈', action: 'aura' },
    { id: 'routines', label: 'Routines', icon: '⚙️', path: '/app/routines' },
    { id: 'services', label: 'Tools', icon: '🛠️', path: '/app/services' },
  ],
  routines: [
    { id: 'routines', label: 'Routines', icon: '⚙️', path: '/app/routines' },
    { id: 'delegate', label: 'Delegate', icon: '🤝', action: 'aura' },
    { id: 'plan', label: 'Plan', icon: '🎯', path: '/app/goals' },
    { id: 'aura', label: 'Aura', icon: '◈', action: 'aura' },
    { id: 'feed', label: 'Feed', icon: '✦', path: '/app/ido' },
  ],
  dao: [
    { id: 'dao', label: 'DAO', icon: '🏛️', path: '/app/dao' },
    { id: 'contribute', label: 'Build', icon: '🤝', path: '/app/contribute' },
    { id: 'aura', label: 'Aura', icon: '◈', action: 'aura' },
    { id: 'ioo', label: 'Map', icon: '🧬', path: '/app/ioo' },
    { id: 'apps', label: 'Apps', icon: '▦', action: 'launcher' },
  ],
  contribute: [
    { id: 'dao', label: 'DAO', icon: '🏛️', path: '/app/dao' },
    { id: 'contribute', label: 'Build', icon: '🤝', path: '/app/contribute' },
    { id: 'aura', label: 'Aura', icon: '◈', action: 'aura' },
    { id: 'services', label: 'Tools', icon: '🛠️', path: '/app/services' },
    { id: 'ioo', label: 'Graph', icon: '🧬', path: '/app/ioo' },
  ],
  services: [
    { id: 'ido', label: 'Path', icon: '🚀', path: '/app/ido' },
    { id: 'services', label: 'Tools', icon: '🛠️', path: '/app/services' },
    { id: 'aura', label: 'Aura', icon: '◈', action: 'aura' },
    { id: 'goals', label: 'Goals', icon: '🎯', path: '/app/goals' },
    { id: 'dao', label: 'DAO', icon: '🏛️', path: '/app/dao' },
  ],
  ioo: [
    { id: 'ido', label: 'Path', icon: '🚀', path: '/app/ido' },
    { id: 'goals', label: 'Goals', icon: '🎯', path: '/app/goals' },
    { id: 'aura', label: 'Aura', icon: '◈', action: 'aura' },
    { id: 'ioo', label: 'Map', icon: '🧬', path: '/app/ioo' },
    { id: 'apps', label: 'Apps', icon: '▦', action: 'launcher' },
  ],
  profile: [
    { id: 'ido', label: 'Path', icon: '🚀', path: '/app/ido' },
    { id: 'goals', label: 'Goals', icon: '🎯', path: '/app/goals' },
    { id: 'aura', label: 'Aura', icon: '◈', action: 'aura' },
    { id: 'routines', label: 'Routines', icon: '⚙️', path: '/app/routines' },
    { id: 'apps', label: 'Apps', icon: '▦', action: 'launcher' },
  ],
};

function initials(profile: any) {
  const raw = profile?.display_name || profile?.name || profile?.email || 'Avi';
  return String(raw).trim().slice(0, 1).toUpperCase();
}

const LIVE_LOCATION_SYNC_KEY = `connectome_live_location_${new Date().toISOString().slice(0, 10)}`;
const LIVE_LOCATION_DISMISSED_KEY = 'connectome_live_location_dismissed_session';

type NotificationItem = {
  id: string;
  message: string;
  scheduled_for?: string | null;
  created_at?: string | null;
  opened: boolean;
  unread: boolean;
  type?: string;
};

function NotificationDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError('');
    AuraClient.get<{ items: NotificationItem[] }>('/api/notifications')
      .then((data) => setItems(data.items || []))
      .catch(() => setError('Could not load notifications yet.'))
      .finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 78, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(12px)' }} onClick={onClose}>
      <aside
        onClick={(event) => event.stopPropagation()}
        style={{ position: 'absolute', top: 72, right: 14, width: 'min(380px, calc(100vw - 28px))', maxHeight: 'min(620px, calc(100vh - 96px))', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 24, background: 'linear-gradient(180deg, rgba(18,18,30,0.98), rgba(8,10,15,0.98))', boxShadow: '0 24px 70px rgba(0,0,0,0.42)', padding: 18 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
          <div>
            <div style={{ color: '#f8f8fc', fontSize: 18, fontWeight: 900 }}>Notifications</div>
            <div style={{ color: '#f59e0b', fontSize: 11, fontWeight: 800, marginTop: 2 }}>Experimental · on the chopping block</div>
          </div>
          <button type="button" onClick={onClose} style={{ border: 0, borderRadius: 12, background: 'rgba(255,255,255,0.06)', color: 'rgba(248,248,252,0.7)', width: 36, height: 36, fontSize: 18 }}>×</button>
        </div>
        <div style={{ color: 'rgba(248,248,252,0.5)', fontSize: 12, lineHeight: 1.55, marginBottom: 14 }}>
          This stays only if it creates real return visits/path completions without noisy model spend. Otherwise we cut it.
        </div>
        {loading && <div style={{ color: 'rgba(248,248,252,0.45)', padding: '18px 0' }}>Loading…</div>}
        {error && <div style={{ color: '#f87171', padding: '10px 0', fontSize: 13 }}>{error}</div>}
        {!loading && !error && items.length === 0 && (
          <div style={{ border: '1px dashed rgba(255,255,255,0.12)', borderRadius: 16, padding: 16, color: 'rgba(248,248,252,0.52)', fontSize: 13, lineHeight: 1.55 }}>
            No notifications yet. Best use: rare, high-value nudges — local opportunities, goal follow-through, DAO actions, and time-sensitive Aura updates.
          </div>
        )}
        <div style={{ display: 'grid', gap: 10 }}>
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                AuraClient.post(`/api/notifications/${item.id}/opened`).catch(() => {});
                setItems((prev) => prev.map((n) => n.id === item.id ? { ...n, opened: true, unread: false } : n));
              }}
              style={{ textAlign: 'left', border: `1px solid ${item.unread ? 'rgba(0,212,170,0.35)' : 'rgba(255,255,255,0.08)'}`, background: item.unread ? 'rgba(0,212,170,0.08)' : 'rgba(255,255,255,0.035)', color: '#f8f8fc', borderRadius: 16, padding: 13 }}
            >
              <div style={{ fontSize: 13, lineHeight: 1.45, fontWeight: item.unread ? 800 : 600 }}>{item.message}</div>
              <div style={{ fontSize: 10, color: 'rgba(248,248,252,0.35)', marginTop: 7 }}>
                {item.scheduled_for ? new Date(item.scheduled_for).toLocaleString() : 'Aura update'}
              </div>
            </button>
          ))}
        </div>
      </aside>
    </div>
  );
}

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
  const [notificationsOpen, setNotificationsOpen] = useState(false);
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

        <span className="connectome-context-label connectome-context-label--ambient" aria-live="polite">{appLabel(activeApp)}</span>

        <div className="connectome-status">
          {ENABLE_NOTIFICATION_BELL && (
            <button type="button" className="connectome-bell" aria-label="Notifications" onClick={() => setNotificationsOpen(true)}>🔔</button>
          )}
          <button type="button" className="connectome-avatar" onClick={() => navigate('/app/profile')} aria-label="Open profile">
            {initials(profile)}
          </button>
        </div>
      </header>

      <main className={`connectome-main connectome-main--${activeApp}`}>
        {children}
      </main>

      <nav className={`connectome-dock connectome-dock--${dockItems.length}`} aria-label={`${appLabel(activeApp)} navigation`}>
        {dockItems.map((item) => {
          const active = item.id === activeApp || (item.path && location.pathname === item.path) || (activeApp === 'ido' && item.id === 'feed');
          return (
            <button
              key={item.id}
              type="button"
              className={`connectome-dock__item ${active ? 'connectome-dock__item--active' : ''} ${item.action === 'aura' ? 'connectome-dock__item--aura' : ''}`}
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
      <GlobalFeedbackButton />
      <AuraOverlay open={auraOpen} onClose={() => setAuraOpen(false)} />
      <NotificationDrawer open={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
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
