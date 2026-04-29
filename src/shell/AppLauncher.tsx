import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OraClient } from '../lib/OraClient';
import { APP_MANIFEST, type AppManifestEntry } from '../runtime/ontology';

type ConnectomeApp = AppManifestEntry;

type AiosState = {
  featured_apps?: string[];
  ora_mission_statement?: string;
};

export const CONNECTOME_APPS: ConnectomeApp[] = APP_MANIFEST.filter((app) => app.visibleToUser);

interface AppLauncherProps {
  onLaunch?: () => void;
}

const DEFAULT_FEATURED_APPS = ['iDo', 'Aventi', 'iVive', 'Eviva'];

const OUTCOME_LABELS: Partial<Record<ConnectomeApp['id'], { title: string; description: string; badge?: string }>> = {
  ido: { title: 'Find one thing to do now', description: 'A simple action feed when you want momentum but not more planning.', badge: 'Daily' },
  goals: { title: 'Clarify a goal with Ora', description: 'Turn an intention into steps, constraints, and a path you can act on.', badge: 'Plan' },
  routines: { title: 'Build a repeatable rhythm', description: 'Make the helpful action automatic with small routines.', badge: 'Habits' },
  ivive: { title: 'Improve vitality', description: 'Care for energy, health, recovery, and inner stability.', badge: 'Vitality' },
  eviva: { title: 'Serve a meaningful mission', description: 'Find contribution, work, services, and world-facing opportunities.', badge: 'Mission' },
  aventi: { title: 'Discover life experiences', description: 'Open adventures, events, friends, dating, and spontaneity.', badge: 'External' },
  dao: { title: 'Understand the DAO', description: 'See governance, CP, proposals, and the contribution economy.', badge: 'DAO' },
  contribute: { title: 'Submit work and earn CP', description: 'Share code, design, research, ideas, or feedback for review.', badge: 'Build' },
  services: { title: 'Use Ora-powered tools', description: 'Open integrations and generated surfaces around your current path.', badge: 'Tools' },
  ioo: { title: 'View the life map', description: 'Explore the graph Ora uses to reason about what matters next.', badge: 'Map' },
  profile: { title: 'Manage identity and settings', description: 'Control profile, accounts, permissions, experiments, and system tools.', badge: 'You' },
};

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
    <section className="app-launcher" aria-label="App launcher">
      <div className="app-launcher__intro">
        <span>Connectome</span>
        <h2>What are you trying to do?</h2>
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
              key={app.id}
              type="button"
              className={`app-launcher__card ${isFeatured ? 'app-launcher__card--featured' : ''}`}
              onClick={() => launch(app)}
            >
              {isFeatured && <span className="app-launcher__featured-badge">{OUTCOME_LABELS[app.id]?.badge || 'Featured'}</span>}
              <span className="app-launcher__icon">{app.icon}</span>
              <span className="app-launcher__name">{OUTCOME_LABELS[app.id]?.title || app.name}</span>
              <span className="app-launcher__description">{OUTCOME_LABELS[app.id]?.description || app.description}</span>
              {app.external && <span className="app-launcher__soon">Opens externally</span>}
            </button>
          );
        })}
      </div>
    </section>
  );
}
