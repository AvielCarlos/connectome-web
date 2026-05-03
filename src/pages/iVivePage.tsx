import React from 'react';
import { FEED_SURFACES } from '../runtime/ontology';

const domains = [
  { title: 'Biometrics', body: 'HRV, sleep, recovery, energy, mood, focus, and biomarker signals in one readiness layer.' },
  { title: 'Sleep & Recovery', body: 'Rest is a first-class iVive aspect — nudges, protocols, and recovery windows that make action sustainable.' },
  { title: 'Pomodoro Rest Loops', body: 'Work/rest cycles that protect nervous-system capacity instead of pushing endless output.' },
  { title: 'Vitality Path', body: 'Physical health, mental resilience, inner world, creativity, finances, and longevity as one growth path.' },
];

const iviveFeed = FEED_SURFACES.find((surface) => surface.owner === 'ivive_domain_feed');

function openAuraOverlay() {
  window.dispatchEvent(new CustomEvent('connectome:open-aura'));
}

export default function iVivePage() {
  return (
    <section className="meta-app-page meta-app-page--ivive">
      <div className="meta-app-page__glow" aria-hidden="true" />
      <header className="meta-app-page__hero">
        <span className="meta-app-page__eyebrow">Domain feed · rest & readiness</span>
        <h1>iVive 🌱</h1>
        <p>Your vitality OS — sleep, recovery, biometrics, rest loops, and human readiness.</p>
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
        <p>
          iVive runs a {iviveFeed?.rankingStrategy.replace(/_/g, ' ')} feed. The best signals can flow into the Path Feed’s daily
          “what should I do next?” feed when recovery, energy, or sleep should shape the next action.
        </p>
        <button type="button" onClick={openAuraOverlay}>Tell Aura about your recovery and vitality goals</button>
      </div>
    </section>
  );
}
