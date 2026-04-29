import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CONNECTOME_APPS } from '../shell/AppLauncher';

const highlights = [
  { label: 'Next IOO node', title: 'Clarify your next 24-hour move', meta: 'Ready when you are' },
  { label: 'Pending challenge', title: 'Aventi discovery streak is waiting', meta: '12 minutes to start' },
  { label: 'Signal from the network', title: '2 friends logged new intentions', meta: 'Reflect or join' },
];

const recent = [
  'Ora mapped a fresh goal thread through the AIOS.',
  'Ascension DAO contribution queue refreshed with new CP opportunities.',
  'Aventi has 4 new experiences tuned to your current path.',
];

function greetingName(profile: any) {
  const raw = profile?.display_name || profile?.name || profile?.email?.split('@')[0] || 'Avi';
  return String(raw).split(' ')[0];
}

function dayPart() {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}

export default function ConnectomeHome() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="connectome-home">
      <section className="connectome-home__hero">
        <div className="connectome-home__signal">
          <span className="ora-orb" /> Ora is online
        </div>
        <h1>Your AI OS for Human Flourishing</h1>
        <p>Daily guidance, vitality, experiences, missions, and community — orchestrated by Ora.</p>
        <p>Good {dayPart()}, {greetingName(profile)}. Ora is orienting the OS around what matters next.</p>
      </section>

      <section className="connectome-home__highlights" aria-label="Ora highlights">
        {highlights.map((item) => (
          <article key={item.label} className="connectome-home__highlight">
            <span>{item.label}</span>
            <h3>{item.title}</h3>
            <p>{item.meta}</p>
          </article>
        ))}
      </section>

      <section className="connectome-home__apps" aria-label="Ora apps">
        <h2>Ora apps</h2>
        {CONNECTOME_APPS.filter((app) => !app.soon && !app.external).slice(0, 5).map((app) => (
          <button key={app.name} type="button" onClick={() => navigate(app.path)}>
            <span>{app.icon}</span>
            <strong>{app.name}</strong>
          </button>
        ))}
      </section>

      <section className="connectome-home__activity">
        <div>
          <span>Recent activity</span>
          <h2>Light signals from the OS</h2>
        </div>
        {recent.map((entry) => <p key={entry}>{entry}</p>)}
      </section>
    </div>
  );
}
