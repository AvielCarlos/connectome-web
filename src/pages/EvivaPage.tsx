import React from 'react';

const serveCards = [
  'Find a purpose-driven job',
  'Volunteer globally',
  'Contribute to a cause',
];

const categories = ['Health & Wellness', 'Tech', 'Travel', 'Food', 'Finance', 'Education', 'Home', 'Entertainment'];

function openOraOverlay() {
  window.dispatchEvent(new CustomEvent('connectome:open-ora'));
}

export default function EvivaPage() {
  return (
    <section className="meta-app-page meta-app-page--eviva">
      <div className="meta-app-page__glow" aria-hidden="true" />
      <header className="meta-app-page__hero">
        <span className="meta-app-page__eyebrow">World-facing missions</span>
        <h1>Eviva 🌊</h1>
        <p>Meaningful work, missions, products, and services beyond the internal DAO.</p>
      </header>

      <div className="meta-app-page__section">
        <div>
          <span className="meta-app-page__eyebrow">Serve</span>
          <h2>Find meaningful work, missions, causes, and contribution opportunities.</h2>
        </div>
        <div className="meta-app-page__grid meta-app-page__grid--three">
          {serveCards.map((card) => (
            <article className="meta-app-page__card" key={card}>
              <h3>{card}</h3>
              <p>Ora will match your strengths with real-world opportunities.</p>
            </article>
          ))}
        </div>
      </div>

      <div className="meta-app-page__section">
        <div>
          <span className="meta-app-page__eyebrow">Discover</span>
          <h2>The best products and services, intelligently curated.</h2>
        </div>
        <input
          className="meta-app-page__search"
          placeholder="Search products, services, restaurants, experiences..."
          aria-label="Search products, services, restaurants, experiences"
        />
        <div className="meta-app-page__pills">
          {categories.map((category) => <span key={category}>{category}</span>)}
        </div>
        <p className="meta-app-page__note">AI-researched reviews — coming soon. We&apos;re training Ora to surface the world&apos;s best.</p>
      </div>

      <div className="meta-app-page__footer-card">
        <p>Eviva is the world-facing opportunity layer. Internal ecosystem work stays in Contribute; governance and rewards stay in DAO.</p>
        <button type="button" onClick={openOraOverlay}>Connect your Eviva goals</button>
      </div>
    </section>
  );
}
