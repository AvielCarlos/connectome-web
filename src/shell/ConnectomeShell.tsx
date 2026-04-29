import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AppLauncher from './AppLauncher';
import OraOverlay from './OraOverlay';

interface ConnectomeShellProps {
  children: React.ReactNode;
  activeApp?: 'home' | 'ido' | 'goals' | 'routines' | 'dao' | 'contribute' | 'journal' | 'profile' | 'services' | 'ioo' | 'ivive' | 'eviva';
}

const appLabels: Record<string, string> = {
  home: 'Ora',
  ido: 'iDo',
  goals: 'Goals',
  routines: 'Routines',
  dao: 'DAO',
  contribute: 'Contribute',
  journal: 'Journal',
  profile: 'Profile',
  services: 'Services',
  ioo: 'IOO Map',
  ivive: 'iVive',
  eviva: 'Eviva',
};

type DockItem = {
  id: string;
  label: string;
  icon: string;
  path?: string;
  action?: 'ora' | 'launcher';
};

const dockMenus: Record<string, DockItem[]> = {
  home: [
    { id: 'ido', label: 'iDo', icon: '🚀', path: '/app/ido' },
    { id: 'ivive', label: 'iVive', icon: '🌱', path: '/app/ivive' },
    { id: 'ora', label: 'Ora', icon: '◈', action: 'ora' },
    { id: 'eviva', label: 'Eviva', icon: '🌊', path: '/app/eviva' },
    { id: 'dao', label: 'DAO', icon: '🏛️', path: '/app/dao' },
  ],
  ido: [
    { id: 'feed', label: 'Feed', icon: '✦', path: '/app/ido' },
    { id: 'goals', label: 'Goals', icon: '🎯', path: '/app/goals' },
    { id: 'ora', label: 'Ora', icon: '◈', action: 'ora' },
    { id: 'journal', label: 'Journal', icon: '📓', path: '/app/journal' },
    { id: 'routines', label: 'Routines', icon: '⚙️', path: '/app/routines' },
  ],
  goals: [
    { id: 'ido', label: 'iDo', icon: '🚀', path: '/app/ido' },
    { id: 'routines', label: 'Routines', icon: '⚙️', path: '/app/routines' },
    { id: 'ora', label: 'Ora', icon: '◈', action: 'ora' },
    { id: 'journal', label: 'Journal', icon: '📓', path: '/app/journal' },
    { id: 'services', label: 'Tools', icon: '🛠️', path: '/app/services' },
  ],
  journal: [
    { id: 'ido', label: 'iDo', icon: '🚀', path: '/app/ido' },
    { id: 'goals', label: 'Goals', icon: '🎯', path: '/app/goals' },
    { id: 'ora', label: 'Ora', icon: '◈', action: 'ora' },
    { id: 'routines', label: 'Routines', icon: '⚙️', path: '/app/routines' },
    { id: 'apps', label: 'Apps', icon: '▦', action: 'launcher' },
  ],
  routines: [
    { id: 'routines', label: 'Routines', icon: '⚙️', path: '/app/routines' },
    { id: 'goals', label: 'Goals', icon: '🎯', path: '/app/goals' },
    { id: 'ora', label: 'Ora', icon: '◈', action: 'ora' },
    { id: 'journal', label: 'Journal', icon: '📓', path: '/app/journal' },
    { id: 'feed', label: 'Feed', icon: '✦', path: '/app/ido' },
  ],
  ivive: [
    { id: 'vitality', label: 'Vitality', icon: '🌱', path: '/app/ivive' },
    { id: 'goals', label: 'Goals', icon: '🎯', path: '/app/goals' },
    { id: 'ora', label: 'Ora', icon: '◈', action: 'ora' },
    { id: 'journal', label: 'Journal', icon: '📓', path: '/app/journal' },
    { id: 'services', label: 'Tools', icon: '🛠️', path: '/app/services' },
  ],
  eviva: [
    { id: 'missions', label: 'Missions', icon: '🌊', path: '/app/eviva' },
    { id: 'services', label: 'Services', icon: '🛠️', path: '/app/services' },
    { id: 'ora', label: 'Ora', icon: '◈', action: 'ora' },
    { id: 'contribute', label: 'Build', icon: '🤝', path: '/app/contribute' },
    { id: 'dao', label: 'DAO', icon: '🏛️', path: '/app/dao' },
  ],
  dao: [
    { id: 'dao', label: 'DAO', icon: '🏛️', path: '/app/dao' },
    { id: 'contribute', label: 'Build', icon: '🤝', path: '/app/contribute' },
    { id: 'ora', label: 'Ora', icon: '◈', action: 'ora' },
    { id: 'ioo', label: 'Map', icon: '🧬', path: '/app/ioo' },
    { id: 'journal', label: 'Journal', icon: '📓', path: '/app/journal' },
  ],
  contribute: [
    { id: 'dao', label: 'DAO', icon: '🏛️', path: '/app/dao' },
    { id: 'contribute', label: 'Build', icon: '🤝', path: '/app/contribute' },
    { id: 'ora', label: 'Ora', icon: '◈', action: 'ora' },
    { id: 'services', label: 'Tools', icon: '🛠️', path: '/app/services' },
    { id: 'eviva', label: 'Missions', icon: '🌊', path: '/app/eviva' },
  ],
  services: [
    { id: 'ido', label: 'iDo', icon: '🚀', path: '/app/ido' },
    { id: 'services', label: 'Tools', icon: '🛠️', path: '/app/services' },
    { id: 'ora', label: 'Ora', icon: '◈', action: 'ora' },
    { id: 'eviva', label: 'Eviva', icon: '🌊', path: '/app/eviva' },
    { id: 'dao', label: 'DAO', icon: '🏛️', path: '/app/dao' },
  ],
  ioo: [
    { id: 'ido', label: 'iDo', icon: '🚀', path: '/app/ido' },
    { id: 'goals', label: 'Goals', icon: '🎯', path: '/app/goals' },
    { id: 'ora', label: 'Ora', icon: '◈', action: 'ora' },
    { id: 'ioo', label: 'Map', icon: '🧬', path: '/app/ioo' },
    { id: 'journal', label: 'Journal', icon: '📓', path: '/app/journal' },
  ],
  profile: [
    { id: 'ido', label: 'iDo', icon: '🚀', path: '/app/ido' },
    { id: 'goals', label: 'Goals', icon: '🎯', path: '/app/goals' },
    { id: 'ora', label: 'Ora', icon: '◈', action: 'ora' },
    { id: 'routines', label: 'Routines', icon: '⚙️', path: '/app/routines' },
    { id: 'apps', label: 'Apps', icon: '▦', action: 'launcher' },
  ],
};

function xpLevel(profile: any) {
  const xp = Number(profile?.xp ?? profile?.profile?.xp ?? 420);
  return Math.max(1, Math.floor(xp / 250) + 1);
}

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

  const dockItems = dockMenus[activeApp] || dockMenus.home;

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

        <span className="connectome-context-label connectome-context-label--ambient" aria-live="polite">{appLabels[activeApp] || 'Ora'}</span>

        <div className="connectome-status">
          <span className="connectome-xp">LVL {xpLevel(profile)}</span>
          <button type="button" className="connectome-bell" aria-label="Notifications">🔔</button>
          <button type="button" className="connectome-avatar" onClick={() => navigate('/app/profile')} aria-label="Open profile">
            {initials(profile)}
          </button>
        </div>
      </header>

      <main className={`connectome-main connectome-main--${activeApp}`}>
        {children}
      </main>

      <nav className={`connectome-dock connectome-dock--${dockItems.length}`} aria-label={`${appLabels[activeApp] || 'Ora'} navigation`}>
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
      <OraOverlay open={oraOpen} onClose={() => setOraOpen(false)} />
    </div>
  );
}
