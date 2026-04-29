import React from 'react';
import { useNavigate } from 'react-router-dom';

export const CONNECTOME_APPS = [
  { path: '/app/ido', icon: '🚀', name: 'iDo', description: 'Adventure, discovery, and what to do next.' },
  { path: '/app/goals', icon: '🎯', name: 'Goals', description: 'Your IOO path, broken into living quests.' },
  { path: '/app/dao', icon: '🏛️', name: 'DAO', description: 'Contribute, coordinate, and earn CP.' },
  { path: '/app/journal', icon: '📓', name: 'Journal', description: 'Reflection, memory, and pattern discovery.' },
  { path: '/app/profile', icon: '👤', name: 'Profile', description: 'Identity, stats, streaks, and sovereignty.' },
  { path: '/app/ivive', icon: '🌱', name: 'iVive', description: 'Biometrics and vitality signals. Coming soon.', soon: true },
];

interface AppLauncherProps {
  onLaunch?: () => void;
}

export default function AppLauncher({ onLaunch }: AppLauncherProps) {
  const navigate = useNavigate();

  const launch = (path: string, soon?: boolean) => {
    if (soon) return;
    navigate(path);
    onLaunch?.();
  };

  return (
    <section className="app-launcher" aria-label="Connectome app launcher">
      <div className="app-launcher__intro">
        <span>Applications</span>
        <h2>Choose where Connectome should focus.</h2>
      </div>
      <div className="app-launcher__grid">
        {CONNECTOME_APPS.map((app) => (
          <button
            key={app.name}
            type="button"
            className="app-launcher__card"
            onClick={() => launch(app.path, app.soon)}
            aria-disabled={app.soon}
          >
            <span className="app-launcher__icon">{app.icon}</span>
            <span className="app-launcher__name">{app.name}</span>
            <span className="app-launcher__description">{app.description}</span>
            {app.soon && <span className="app-launcher__soon">More coming</span>}
          </button>
        ))}
      </div>
    </section>
  );
}
