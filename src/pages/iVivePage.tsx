import React from 'react';

const domains = [
  { title: 'Physical Health', body: 'Track workouts, nutrition, sleep, and body energy.' },
  { title: 'Mental & Emotional', body: 'Understand stress, mood, mindfulness, and resilience patterns.' },
  { title: 'Inner World', body: 'Deepen spiritual practice, purpose, creativity, and meaning.' },
  { title: 'Longevity', body: 'Bring biometrics, longevity protocols, HRV, and recovery into one path.' },
];

function openOraOverlay() {
  window.dispatchEvent(new CustomEvent('connectome:open-ora'));
}

export default function iVivePage() {
  return (
    <section className="meta-app-page meta-app-page--ivive">
      <div className="meta-app-page__glow" aria-hidden="true" />
      <header className="meta-app-page__hero">
        <span className="meta-app-page__eyebrow">Meta-app shell</span>
        <h1>iVive 🌱</h1>
        <p>Your vitality OS — coming soon</p>
      </header>

      <div className="meta-app-page__grid meta-app-page__grid--two">
        {domains.map((domain) => (
          <article className="meta-app-page__card" key={domain.title}>
            <h2>{domain.title}</h2>
            <p>{domain.body}</p>
          </article>
        ))}
      </div>

      <div className="meta-app-page__footer-card">
        <p>Ora is building your personalized vitality path based on your iVive goals.</p>
        <button type="button" onClick={openOraOverlay}>Tell Ora about your health goals</button>
      </div>
    </section>
  );
}
