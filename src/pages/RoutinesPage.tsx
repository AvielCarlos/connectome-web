import React from 'react';

const routines = [
  {
    title: 'Clarify the next move',
    description: 'Turn a goal into the smallest useful action Ora can guide right now.',
    steps: ['Name the outcome', 'Choose the next 15-minute action', 'Ask Ora to remove one blocker'],
  },
  {
    title: 'Build momentum',
    description: 'A lightweight streak loop for making progress without overthinking.',
    steps: ['Start tiny', 'Log the win', 'Let Ora suggest the next repetition'],
  },
  {
    title: 'Adventure activation',
    description: 'Convert intention into an actual experience, challenge, or social moment.',
    steps: ['Pick a domain', 'Choose a nearby opportunity', 'Commit or skip quickly'],
  },
];

export default function RoutinesPage() {
  return (
    <div className="meta-app-page meta-app-page--ivive">
      <div className="meta-app-page__glow" />
      <section className="meta-app-page__hero">
        <div className="meta-app-page__eyebrow">iDo subroutines</div>
        <h1>Routines</h1>
        <p>Goal-achievement loops that appear when Ora sees a useful path — tiny, actionable, and tuned to what you are trying to become.</p>
      </section>

      <section className="meta-app-page__section">
        <h2>Active loops</h2>
        <div className="meta-app-page__grid">
          {routines.map((routine) => (
            <article key={routine.title} className="meta-app-page__card">
              <h3>{routine.title}</h3>
              <p>{routine.description}</p>
              <ul>
                {routine.steps.map((step) => <li key={step}>{step}</li>)}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
