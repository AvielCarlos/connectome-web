import React from 'react';

const ACCENT = '#00d4aa';

const steps = [
  {
    number: '01',
    title: 'Join the Community',
    items: [
      <>Join Telegram: <a href="https://t.me/ascensiontechai" target="_blank" rel="noopener noreferrer">t.me/ascensiontechai</a></>,
      'Introduce yourself, say what you build',
    ],
  },
  {
    number: '02',
    title: 'Pick Something to Build',
    items: [
      <>Browse open GitHub issues: <a href="https://github.com/AvielCarlos/connectome-backend/issues" target="_blank" rel="noopener noreferrer">connectome-backend/issues</a></>,
      'Or propose something new in Telegram',
      'Contribute code, design, research, content, or governance votes',
    ],
  },
  {
    number: '03',
    title: 'Build It',
    items: [
      'Fork the repo, create a branch',
      'Build the feature or fix',
      'Open a PR with a clear description',
    ],
  },
  {
    number: '04',
    title: 'Get CP',
    items: [
      'A core reviewer merges your PR → you earn CP',
      "CP = Contributor Points, the DAO's unit of contribution",
      'CP earns you governance votes, recognition, and future revenue share',
      'Quality matters: complex, high-impact contributions earn more CP',
    ],
  },
];

const cpRewards = [
  { label: 'Bug fix', value: '50–150 CP' },
  { label: 'Small feature', value: '200–400 CP' },
  { label: 'Major feature', value: '500–1000 CP' },
  { label: 'Architecture/design', value: '300–600 CP' },
  { label: 'Content/docs', value: '50–200 CP' },
];

const ctas = [
  { label: 'View Open Issues →', href: 'https://github.com/AvielCarlos/connectome-backend/issues', primary: true },
  { label: 'Join Telegram →', href: 'https://t.me/ascensiontechai' },
  { label: 'Read the Docs →', href: 'https://atdao.org' },
];

export default function ContributePage() {
  return (
    <main style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at 50% 0%, rgba(0,212,170,0.11), transparent 34%), #0a0a0f',
      color: '#f8f8fc',
      padding: '48px 18px 110px',
    }}>
      <style>{`
        .contribute-page a { color: ${ACCENT}; text-decoration: none; }
        .contribute-page a:hover { text-decoration: underline; }
      `}</style>
      <div className="contribute-page" style={{ maxWidth: 980, margin: '0 auto' }}>
        <section style={{ textAlign: 'center' as const, marginBottom: 34 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            border: '1px solid rgba(0,212,170,0.28)',
            background: 'rgba(0,212,170,0.08)', color: ACCENT,
            borderRadius: 999, padding: '7px 12px', fontSize: 12,
            fontWeight: 800, letterSpacing: 0.8, textTransform: 'uppercase',
            marginBottom: 18,
          }}>
            ◈ Ora Contributor Path
          </div>
          <h1 style={{
            fontSize: 'clamp(38px, 8vw, 76px)',
            lineHeight: 0.96,
            letterSpacing: -2.5,
            margin: '0 0 18px',
            fontWeight: 950,
          }}>
            Build Ora. Earn CP. Shape the Future.
          </h1>
          <p style={{
            margin: '0 auto', maxWidth: 680,
            color: 'rgba(248,248,252,0.62)', fontSize: 17,
            lineHeight: 1.65,
          }}>
            Ora is being built in the open by people who care about AI, consciousness, and human flourishing. Pick a useful piece, ship it well, and earn your place in the DAO.
          </p>
        </section>

        <section style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(245px, 1fr))',
          gap: 14, marginBottom: 36,
        }}>
          {steps.map((step) => (
            <article key={step.number} style={{
              background: 'linear-gradient(180deg, rgba(18,18,26,0.96), rgba(12,12,18,0.96))',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 18, padding: 20,
              boxShadow: '0 18px 60px rgba(0,0,0,0.22)',
            }}>
              <div style={{ color: ACCENT, fontWeight: 900, fontSize: 12, letterSpacing: 1.4, marginBottom: 10 }}>
                STEP {step.number}
              </div>
              <h2 style={{ margin: '0 0 14px', fontSize: 21, letterSpacing: -0.4 }}>{step.title}</h2>
              <ul style={{ margin: 0, paddingLeft: 18, color: 'rgba(248,248,252,0.66)', lineHeight: 1.6, fontSize: 14 }}>
                {step.items.map((item, index) => <li key={index} style={{ marginBottom: 8 }}>{item}</li>)}
              </ul>
            </article>
          ))}
        </section>

        <section style={{
          background: 'rgba(0,212,170,0.055)',
          border: '1px solid rgba(0,212,170,0.18)',
          borderRadius: 22, padding: 22, marginBottom: 32,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' as const, alignItems: 'end', marginBottom: 18 }}>
            <div>
              <div style={{ color: ACCENT, fontSize: 12, fontWeight: 900, letterSpacing: 1.2, textTransform: 'uppercase' }}>CP Rewards</div>
              <h2 style={{ margin: '6px 0 0', fontSize: 28, letterSpacing: -0.8 }}>Contribution points are earned by shipped value.</h2>
            </div>
            <p style={{ margin: 0, color: 'rgba(248,248,252,0.52)', maxWidth: 360, lineHeight: 1.5 }}>
              These ranges are starting guidance. Reviewers can adjust for complexity, polish, and impact.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
            {cpRewards.map((reward) => (
              <div key={reward.label} style={{
                background: '#101018', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 15, padding: 16,
              }}>
                <div style={{ color: 'rgba(248,248,252,0.56)', fontSize: 13, marginBottom: 8 }}>{reward.label}</div>
                <div style={{ color: '#f4c26b', fontWeight: 900, fontSize: 20 }}>{reward.value}</div>
              </div>
            ))}
          </div>
        </section>

        <section style={{ display: 'flex', gap: 12, flexWrap: 'wrap' as const, justifyContent: 'center' }}>
          {ctas.map((cta) => (
            <a key={cta.href} href={cta.href} target="_blank" rel="noopener noreferrer" style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              minWidth: 180, padding: '14px 18px', borderRadius: 13,
              background: cta.primary ? `linear-gradient(135deg, ${ACCENT}, #00b896)` : 'rgba(255,255,255,0.04)',
              color: cta.primary ? '#06100e' : '#f8f8fc',
              border: cta.primary ? 'none' : '1px solid rgba(255,255,255,0.1)',
              fontWeight: 850, textDecoration: 'none',
              boxShadow: cta.primary ? '0 12px 34px rgba(0,212,170,0.22)' : 'none',
            }}>
              {cta.label}
            </a>
          ))}
        </section>
      </div>
    </main>
  );
}
