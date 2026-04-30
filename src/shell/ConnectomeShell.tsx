import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AppLauncher from './AppLauncher';
import OraOverlay from './OraOverlay';
import GlobalFeedbackButton from '../components/GlobalFeedbackButton';
import { appById, type AppId } from '../runtime/ontology';

type ShellApp = Exclude<AppId, 'aventi' | 'ivive' | 'eviva'>;

interface ConnectomeShellProps {
  children: React.ReactNode;
  activeApp?: ShellApp;
}

function appLabel(appId: ShellApp) {
  if (appId === 'home') return 'Ora';
  return appById(appId)?.name || 'Ora';
}

type DockItem = {
  id: string;
  label: string;
  icon: string;
  path?: string;
  action?: 'ora' | 'launcher';
};

const dockMenus: Partial<Record<ShellApp, DockItem[]>> = {
  home: [
    { id: 'ido', label: 'iDo', icon: '🚀', path: '/app/ido' },
    { id: 'ioo', label: 'Graph', icon: '🧬', path: '/app/ioo' },
    { id: 'ora', label: 'Ora', icon: '◈', action: 'ora' },
    { id: 'goals', label: 'Goals', icon: '🎯', path: '/app/goals' },
    { id: 'dao', label: 'DAO', icon: '🏛️', path: '/app/dao' },
  ],
  ido: [
    { id: 'feed', label: 'Feed', icon: '✦', path: '/app/ido' },
    { id: 'delegate', label: 'Delegate', icon: '🤝', action: 'ora' },
    { id: 'plan', label: 'Plan', icon: '🎯', path: '/app/goals' },
    { id: 'ora', label: 'Ora', icon: '◈', action: 'ora' },
    { id: 'ditch', label: 'Ditch', icon: '🗑️', path: '/app/routines' },
  ],
  goals: [
    { id: 'ido', label: 'iDo', icon: '🚀', path: '/app/ido' },
    { id: 'delegate', label: 'Delegate', icon: '🤝', action: 'ora' },
    { id: 'ora', label: 'Ora', icon: '◈', action: 'ora' },
    { id: 'routines', label: 'Routines', icon: '⚙️', path: '/app/routines' },
    { id: 'services', label: 'Tools', icon: '🛠️', path: '/app/services' },
  ],
  routines: [
    { id: 'routines', label: 'Routines', icon: '⚙️', path: '/app/routines' },
    { id: 'delegate', label: 'Delegate', icon: '🤝', action: 'ora' },
    { id: 'plan', label: 'Plan', icon: '🎯', path: '/app/goals' },
    { id: 'ora', label: 'Ora', icon: '◈', action: 'ora' },
    { id: 'feed', label: 'Feed', icon: '✦', path: '/app/ido' },
  ],
  dao: [
    { id: 'dao', label: 'DAO', icon: '🏛️', path: '/app/dao' },
    { id: 'contribute', label: 'Build', icon: '🤝', path: '/app/contribute' },
    { id: 'ora', label: 'Ora', icon: '◈', action: 'ora' },
    { id: 'ioo', label: 'Map', icon: '🧬', path: '/app/ioo' },
    { id: 'apps', label: 'Apps', icon: '▦', action: 'launcher' },
  ],
  contribute: [
    { id: 'dao', label: 'DAO', icon: '🏛️', path: '/app/dao' },
    { id: 'contribute', label: 'Build', icon: '🤝', path: '/app/contribute' },
    { id: 'ora', label: 'Ora', icon: '◈', action: 'ora' },
    { id: 'services', label: 'Tools', icon: '🛠️', path: '/app/services' },
    { id: 'ioo', label: 'Graph', icon: '🧬', path: '/app/ioo' },
  ],
  services: [
    { id: 'ido', label: 'iDo', icon: '🚀', path: '/app/ido' },
    { id: 'services', label: 'Tools', icon: '🛠️', path: '/app/services' },
    { id: 'ora', label: 'Ora', icon: '◈', action: 'ora' },
    { id: 'goals', label: 'Goals', icon: '🎯', path: '/app/goals' },
    { id: 'dao', label: 'DAO', icon: '🏛️', path: '/app/dao' },
  ],
  ioo: [
    { id: 'ido', label: 'iDo', icon: '🚀', path: '/app/ido' },
    { id: 'goals', label: 'Goals', icon: '🎯', path: '/app/goals' },
    { id: 'ora', label: 'Ora', icon: '◈', action: 'ora' },
    { id: 'ioo', label: 'Map', icon: '🧬', path: '/app/ioo' },
    { id: 'apps', label: 'Apps', icon: '▦', action: 'launcher' },
  ],
  profile: [
    { id: 'ido', label: 'iDo', icon: '🚀', path: '/app/ido' },
    { id: 'goals', label: 'Goals', icon: '🎯', path: '/app/goals' },
    { id: 'ora', label: 'Ora', icon: '◈', action: 'ora' },
    { id: 'routines', label: 'Routines', icon: '⚙️', path: '/app/routines' },
    { id: 'apps', label: 'Apps', icon: '▦', action: 'launcher' },
  ],
};

function initials(profile: any) {
  const raw = profile?.display_name || profile?.name || profile?.email || 'Avi';
  return String(raw).trim().slice(0, 1).toUpperCase();
}

export default function ConnectomeShell({ children, activeApp = 'home' }: ConnectomeShellProps) {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [oraOpen, setOraOpen] = useState(false);
  const [launcherOpen, setLauncherOpen] = useState(false);

  const closeApps = () => setLauncherOpen(false);
  const toggleApps = () => setLauncherOpen((open) => !open);

  useEffect(() => {
    const openOra = () => setOraOpen(true);
    window.addEventListener('connectome:open-ora', openOra);
    return () => window.removeEventListener('connectome:open-ora', openOra);
  }, []);

  const dockItems = dockMenus[activeApp] || dockMenus.home || [];

  const handleDock = (item: DockItem) => {
    if (item.action === 'ora') {
      setOraOpen(true);
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
          <button type="button" className="connectome-bell" aria-label="Notifications">🔔</button>
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
              className={`connectome-dock__item ${active ? 'connectome-dock__item--active' : ''} ${item.action === 'ora' ? 'connectome-dock__item--ora' : ''}`}
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
      <OraOverlay open={oraOpen} onClose={() => setOraOpen(false)} />
    </div>
  );
}
