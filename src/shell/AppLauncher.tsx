import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OraClient } from '../lib/OraClient';

type ConnectomeApp = {
  path: string;
  icon: string;
  name: string;
  description: string;
  soon?: boolean;
  external?: boolean;
};

type AiosState = {
  featured_apps?: string[];
  ora_mission_statement?: string;
};

export const CONNECTOME_APPS: ConnectomeApp[] = [
  { path: '/app/ido', icon: '🚀', name: 'iDo', description: 'Daily feed, goals, routines, and delegate / plan / ditch decisions.' },
  { path: 'https://aventi.app', icon: '🎉', name: 'Aventi', description: 'Experience discovery for adventures, events, and IRL momentum.', external: true },
  { path: '/app/ivive', icon: '🌱', name: 'iVive', description: 'Vitality, health, biometrics, and wellness guidance.' },
  { path: '/app/eviva', icon: '🌊', name: 'Eviva', description: 'Meaningful missions, services, products, and civilization work.' },
  { path: '/app/goals', icon: '🎯', name: 'Goals', description: 'Your IOO path, broken into living quests.' },
  { path: '/app/dao', icon: '🏛️', name: 'DAO', description: 'Contribute, coordinate, and earn CP.' },
  { path: '/app/profile', icon: '👤', name: 'Profile', description: 'Identity, stats, streaks, and sovereignty.' },
];

interface AppLauncherProps {
  onLaunch?: () => void;
}

const DEFAULT_FEATURED_APPS = ['iDo', 'Aventi', 'iVive', 'Eviva'];

export default function AppLauncher({ onLaunch }: AppLauncherProps) {
  const navigate = useNavigate();
  const [aiosState, setAiosState] = useState<AiosState>({ featured_apps: DEFAULT_FEATURED_APPS });

  useEffect(() => {
    let cancelled = false;
    OraClient.get<AiosState>('/api/system/aios-state')
      .then((state) => {
        if (!cancelled) setAiosState(state);
      })
      .catch(() => {
        if (!cancelled) setAiosState({ featured_apps: DEFAULT_FEATURED_APPS });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const featuredApps = aiosState.featured_apps?.length ? aiosState.featured_apps : DEFAULT_FEATURED_APPS;
  const orderedApps = useMemo(() => {
    const rank = new Map(featuredApps.map((name, index) => [name.toLowerCase(), index]));
    return [...CONNECTOME_APPS].sort((a, b) => {
      const aRank = rank.get(a.name.toLowerCase()) ?? 999;
      const bRank = rank.get(b.name.toLowerCase()) ?? 999;
      if (aRank !== bRank) return aRank - bRank;
      return CONNECTOME_APPS.indexOf(a) - CONNECTOME_APPS.indexOf(b);
    });
  }, [featuredApps]);

  const launch = (app: ConnectomeApp) => {
    if (app.external) {
      window.open(app.path, '_blank', 'noopener,noreferrer');
      onLaunch?.();
      return;
    }
    navigate(app.path);
    onLaunch?.();
  };

  return (
    <section className="app-launcher" aria-label="AIOS app launcher">
      <div className="app-launcher__intro">
        <span>Ora AIOS</span>
        <h2>Choose the life domain Ora should focus.</h2>
        {aiosState.ora_mission_statement && (
          <p className="app-launcher__mission">{aiosState.ora_mission_statement}</p>
        )}
      </div>
      <div className="app-launcher__grid">
        {orderedApps.map((app) => {
          const featuredIndex = featuredApps.findIndex((name) => name.toLowerCase() === app.name.toLowerCase());
          const isFeatured = featuredIndex >= 0 && featuredIndex <= 1;
          return (
            <button
              key={app.name}
              type="button"
              className={`app-launcher__card ${isFeatured ? 'app-launcher__card--featured' : ''}`}
              onClick={() => launch(app)}
            >
              {isFeatured && <span className="app-launcher__featured-badge">Featured</span>}
              <span className="app-launcher__icon">{app.icon}</span>
              <span className="app-launcher__name">{app.name}</span>
              <span className="app-launcher__description">{app.description}</span>
              {app.external && <span className="app-launcher__soon">Opens externally</span>}
            </button>
          );
        })}
      </div>
    </section>
  );
}
