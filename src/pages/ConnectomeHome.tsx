import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const nextSignals = [
  { label: 'Guided path', title: 'Turn a desire into a concrete next step', path: '/app/goals' },
  { label: 'Discovery feed', title: 'Browse one doable action at a time', path: '/app/ido' },
  { label: 'Community', title: 'Contribute to the ecosystem and earn CP', path: '/app/dao' },
];

const guidanceSteps = [
  ['Clarify', 'Tell Aura what you want, what feels off, or what constraint matters. Short answers are enough.'],
  ['Choose', 'Save what feels alive, skip what is wrong, and use “Do now” only when you would actually act.'],
  ['Do', 'Take the real-world step: book, visit, message, practice, create, rest, or contribute.'],
  ['Give evidence', 'After action, add a quick note, rating, link, or photo. Evidence earns small CP and teaches Aura what works.'],
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

const panel: React.CSSProperties = {
  background: 'linear-gradient(180deg, rgba(18,18,26,0.94), rgba(12,12,18,0.94))',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 24,
  boxShadow: '0 20px 70px rgba(0,0,0,0.24)',
};

export default function ConnectomeHome() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="connectome-home" style={{ maxWidth: 1040, margin: '0 auto', padding: '78px 18px 120px' }}>
      <section className="connectome-home__hero" style={{ textAlign: 'center', marginBottom: 26 }}>
        <div className="connectome-home__signal">
          <span className="ora-orb" /> Aura is online
        </div>
        <h1>Your AI OS for Human Flourishing</h1>
        <p style={{ maxWidth: 720, margin: '0 auto 10px' }}>
          Good {dayPart()}, {greetingName(profile)}. This is the Connectome home base: choose whether you already know your aim, or want the Path Feed to surface a next action.
        </p>
      </section>

      <section aria-label="How to guide Aura" style={{ ...panel, padding: 22, marginBottom: 24 }}>
        <div style={{ color: '#00d4aa', fontSize: 12, fontWeight: 900, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>How to make Aura better</div>
        <h2 style={{ margin: '0 0 10px', fontSize: 24, letterSpacing: -0.5 }}>Use it like a living path, not a static app</h2>
        <p style={{ margin: '0 0 16px', color: 'rgba(248,248,252,0.62)', lineHeight: 1.6 }}>
          Every honest choice teaches the graph. Aura handles scaffolding, search, reminders, pathing, and adaptation; you clarify, decide, and do real things.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
          {guidanceSteps.map(([title, copy], index) => (
            <div key={title} style={{ background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 14 }}>
              <div style={{ width: 28, height: 28, borderRadius: 14, background: 'rgba(0,212,170,0.14)', color: '#00d4aa', display: 'grid', placeItems: 'center', fontWeight: 900, marginBottom: 9 }}>{index + 1}</div>
              <strong>{title}</strong>
              <p style={{ margin: '6px 0 0', color: 'rgba(248,248,252,0.58)', fontSize: 13, lineHeight: 1.45 }}>{copy}</p>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 14, padding: '12px 14px', borderRadius: 16, background: 'rgba(244,194,107,0.09)', color: 'rgba(248,248,252,0.78)', border: '1px solid rgba(244,194,107,0.18)', fontSize: 13, lineHeight: 1.5 }}>
          Evidence after action earns a small CP reward — currently capped and intentionally modest to reward real proof without making spam profitable.
        </div>
      </section>

      <section aria-label="Choose your next mode" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: 16, marginBottom: 24 }}>
        <button
          type="button"
          onClick={() => navigate('/app/goals?clarify=1')}
          style={{ ...panel, padding: 24, color: '#f8f8fc', textAlign: 'left', cursor: 'pointer' }}
        >
          <div style={{ color: '#00d4aa', fontSize: 12, fontWeight: 900, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>I know what I want to do</div>
          <h2 style={{ margin: '0 0 10px', fontSize: 28, letterSpacing: -0.7 }}>Clarify it with Aura</h2>
          <p style={{ margin: 0, color: 'rgba(248,248,252,0.62)', lineHeight: 1.6 }}>Turn a goal, feeling, or problem into a concrete path with steps, constraints, and support.</p>
          <div style={{ marginTop: 18, color: '#00d4aa', fontWeight: 900 }}>Start with a goal →</div>
        </button>

        <button
          type="button"
          onClick={() => navigate('/app/ido')}
          style={{ ...panel, padding: 24, color: '#f8f8fc', textAlign: 'left', cursor: 'pointer' }}
        >
          <div style={{ color: '#f4c26b', fontSize: 12, fontWeight: 900, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>I don’t know what I want to do</div>
          <h2 style={{ margin: '0 0 10px', fontSize: 28, letterSpacing: -0.7 }}>Begin your path</h2>
          <p style={{ margin: 0, color: 'rgba(248,248,252,0.62)', lineHeight: 1.6 }}>Open the discovery feed and choose, save, skip, or act on one useful possibility at a time.</p>
          <div style={{ marginTop: 18, color: '#f4c26b', fontWeight: 900 }}>Open Path Feed →</div>
        </button>
      </section>

      <section aria-label="What this is" style={{ ...panel, padding: 22, marginBottom: 24 }}>
        <div style={{ color: '#00d4aa', fontSize: 12, fontWeight: 900, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>How the pieces fit</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12 }}>
          {[
            ['Ascension', 'The DAO and mission ecosystem.'],
            ['Connectome', 'The AIOS that connects your life context.'],
            ['Aura', 'The brain and interface that helps you decide.'],
            ['Path Feed', 'One concrete next action from the IOO graph.'],
          ].map(([name, copy]) => (
            <div key={name} style={{ background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 15 }}>
              <strong>{name}</strong>
              <p style={{ margin: '6px 0 0', color: 'rgba(248,248,252,0.58)', fontSize: 13, lineHeight: 1.5 }}>{copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="connectome-home__highlights" aria-label="Next places">
        {nextSignals.map((item) => (
          <button key={item.label} className="connectome-home__highlight" type="button" onClick={() => navigate(item.path)} style={{ textAlign: 'left', cursor: 'pointer' }}>
            <span>{item.label}</span>
            <h3>{item.title}</h3>
            <p>Open →</p>
          </button>
        ))}
      </section>
    </div>
  );
}
