import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AppLauncher from './AppLauncher';
import OraOverlay from './OraOverlay';

interface ConnectomeShellProps {
  children: React.ReactNode;
  activeApp?: 'home' | 'ido' | 'goals' | 'dao' | 'contribute' | 'journal' | 'profile' | 'services' | 'ioo';
}

const appLabels: Record<string, string> = {
  ido: 'iDo',
  goals: 'Goals',
  dao: 'DAO',
  contribute: 'Contribute',
  journal: 'Journal',
  profile: 'Profile',
  services: 'Services',
  ioo: 'IOO Map',
};

const dockItems = [
  { id: 'ora', label: 'Ora', icon: '◈' },
  { id: 'ido', label: 'iDo', icon: '🚀', path: '/app/ido' },
  { id: 'dao', label: 'DAO', icon: '🏛️', path: '/app/dao' },
  { id: 'profile', label: 'Profile', icon: '👤', path: '/app/profile' },
  { id: 'apps', label: 'Apps', icon: '+' },
];

function initials(profile: any) {
  return String(profile?.display_name || profile?.email || 'U')[0].toUpperCase();
}

function xpLevel(profile: any) {
  const xp = Number(profile?.xp ?? profile?.profile?.xp ?? 420);
  return Math.max(1, Math.floor(xp / 250) + 1);
}

export default function ConnectomeShell({ children, activeApp = 'home' }: ConnectomeShellProps) {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [oraOpen, setOraOpen] = useState(false);
  const [launcherOpen, setLauncherOpen] = useState(false);

  const openApps = () => setLauncherOpen(true);
  const closeApps = () => setLauncherOpen(false);

  const handleDock = (item: typeof dockItems[number]) => {
    if (item.id === 'ora') {
      setOraOpen(true);
      return;
    }
    if (item.id === 'apps') {
      openApps();
      return;
    }
    if (item.path) navigate(item.path);
  };

  return (
    <div className="connectome-shell">
      <div className="connectome-stars" aria-hidden="true" />
      <header className="connectome-topbar">
        <button className="connectome-brand" type="button" onClick={() => navigate('/')} aria-label="Connectome home">
          <span className="connectome-brand__glyph">◌</span>
          <span>
            <strong>Connectome</strong>
            <small>AI OS</small>
          </span>
        </button>

        <button className="connectome-ora-indicator" type="button" onClick={() => setOraOpen(true)}>
          <span className="ora-orb" />
          <span>Ora ambient</span>
        </button>

        <div className="connectome-status">
          <span className="connectome-xp">LVL {xpLevel(profile)}</span>
          <button type="button" className="connectome-bell" aria-label="Notifications">🔔</button>
          <button type="button" className="connectome-avatar" onClick={() => navigate('/app/profile')} title="Profile">
            {initials(profile)}
          </button>
        </div>
      </header>

      <main className={`connectome-main connectome-main--${activeApp}`}>
        {activeApp !== 'home' && appLabels[activeApp] && (
          <div className="connectome-app-titlebar">
            <span>{appLabels[activeApp]}</span>
            <small>{activeApp === 'ido' ? 'Adventure & discovery inside Connectome' : 'Running inside Connectome'}</small>
          </div>
        )}
        {children}
      </main>

      <nav className="connectome-dock" aria-label="Connectome dock">
        {dockItems.map((item) => {
          const active = item.id === activeApp || (item.path && location.pathname === item.path);
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
          <div className="connectome-launcher-sheet__panel" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="connectome-launcher-sheet__close" onClick={closeApps}>×</button>
            <AppLauncher onLaunch={closeApps} />
          </div>
        </div>
      )}

      <button className="connectome-signout" type="button" onClick={() => { logout(); navigate('/'); }}>Sign out</button>
      <OraOverlay open={oraOpen} onClose={() => setOraOpen(false)} />
    </div>
  );
}
