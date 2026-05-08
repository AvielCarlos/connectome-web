import { Link } from 'react-router-dom'

const APP_LINK = '/auth?utm_source=owned_landing&utm_campaign=connectome_builders'
const ISSUES_LINK = 'https://github.com/AvielCarlos/connectome-web/issues?q=is%3Aissue%20is%3Aopen%20label%3Agood-first-issue%20OR%20label%3Agrowth%20OR%20label%3Adesign'
const BACKEND_ISSUES_LINK = 'https://github.com/AvielCarlos/connectome-backend/issues'

const contributionTracks = [
  {
    title: 'First-session quality',
    body: 'Make the Path Feed clearer, faster, and easier to trust when someone opens Connectome for the first time.',
  },
  {
    title: 'Agent UX',
    body: 'Turn Aura capabilities into contextual actions, explanations, and feedback loops instead of generic chat.',
  },
  {
    title: 'Growth infrastructure',
    body: 'Improve analytics, referral paths, landing pages, onboarding copy, and public docs without cold outreach or spam mechanics.',
  },
]

const firstPrSteps = [
  'Try the app and note one confusing or promising moment in the Path Feed.',
  'Pick a narrow issue or propose a small change before writing a large PR.',
  'Open a focused PR with screenshots, test notes, and the CP category you think fits.',
]

const principles = [
  'Useful before promotional: ship proof, screenshots, docs, and first-session fixes before broad posting.',
  'No scraped lists, cold DMs, repetitive promo, or direct outreach to individuals.',
  'CP is contribution recognition and reputation only — not cash, tokens, equity, profit share, or investment returns.',
]

function Panel({ children, accent = '#00d4aa' }: { children: React.ReactNode; accent?: string }) {
  return (
    <section style={{ background: 'linear-gradient(145deg, rgba(255,255,255,0.06), rgba(255,255,255,0.025))', border: `1px solid ${accent}33`, borderRadius: 26, padding: 24, boxShadow: '0 24px 70px rgba(0,0,0,0.24)' }}>
      {children}
    </section>
  )
}

function StepList({ items }: { items: string[] }) {
  return (
    <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 12 }}>
      {items.map((item, index) => (
        <li key={item} style={{ display: 'grid', gridTemplateColumns: '34px 1fr', gap: 12, alignItems: 'start', color: 'rgba(248,248,252,0.72)', lineHeight: 1.55 }}>
          <span style={{ width: 34, height: 34, borderRadius: 14, display: 'grid', placeItems: 'center', background: 'rgba(0,212,170,0.14)', color: '#98ffe9', fontWeight: 950 }}>{index + 1}</span>
          <span>{item}</span>
        </li>
      ))}
    </ol>
  )
}

export default function ConnectomeBuildersLandingPage() {
  return (
    <main style={{ minHeight: 'var(--visual-viewport-height, 100dvh)', background: '#060610', color: '#f8f8fc', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(circle at 18% 6%, rgba(0,212,170,0.24), transparent 30rem), radial-gradient(circle at 88% 18%, rgba(99,102,241,0.20), transparent 32rem), radial-gradient(circle at 48% 100%, rgba(244,194,107,0.10), transparent 34rem)' }} />

      <div style={{ position: 'relative', maxWidth: 1120, margin: '0 auto', padding: '28px 20px 76px' }}>
        <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 54 }}>
          <Link to="/" style={{ color: '#f8f8fc', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, fontWeight: 950 }}>
            <span style={{ width: 34, height: 34, borderRadius: 12, display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg, rgba(0,212,170,0.28), rgba(99,102,241,0.32))', border: '1px solid rgba(0,212,170,0.35)' }}>◈</span>
            <span>Connectome</span>
          </Link>
          <a href={ISSUES_LINK} target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(248,248,252,0.72)', textDecoration: 'none', fontSize: 14, fontWeight: 850 }}>Open issues →</a>
        </nav>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: 28, alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ color: '#00d4aa', fontSize: 12, fontWeight: 950, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 16 }}>Builder invitation · no-spam growth loop</div>
            <h1 style={{ fontSize: 'clamp(42px, 7vw, 78px)', lineHeight: 0.96, letterSpacing: -3.5, margin: '0 0 20px', fontWeight: 950 }}>
              Help build an AI OS that turns intention into action.
            </h1>
            <p style={{ fontSize: 20, lineHeight: 1.6, color: 'rgba(248,248,252,0.72)', maxWidth: 740, margin: '0 0 28px' }}>
              Connectome is an open-source pathing system for human flourishing: Aura reasons over goals, context, feedback, and the IOO graph so people can choose one useful next step instead of staring at another blank chat box.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <a href={ISSUES_LINK} target="_blank" rel="noopener noreferrer" style={{ background: 'linear-gradient(135deg, #00d4aa, #818cf8)', color: '#07100f', padding: '15px 20px', borderRadius: 14, textDecoration: 'none', fontWeight: 950, boxShadow: '0 18px 44px rgba(0,212,170,0.18)' }}>
                Find a focused issue →
              </a>
              <Link to={APP_LINK} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#f8f8fc', padding: '15px 20px', borderRadius: 14, textDecoration: 'none', fontWeight: 850 }}>
                Try Connectome first
              </Link>
            </div>
          </div>

          <Panel accent="#818cf8">
            <div style={{ color: '#a5b4fc', fontSize: 12, fontWeight: 950, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 10 }}>What good looks like</div>
            <h2 style={{ margin: '0 0 14px', fontSize: 32, letterSpacing: -1.1 }}>Small, reviewable work that improves trust.</h2>
            <p style={{ color: 'rgba(248,248,252,0.68)', lineHeight: 1.75, margin: 0 }}>
              The current priority is not hype. It is making the first session understandable, useful, and safe to share: better feed explanations, clearer contribution paths, better QA, and public docs people can evaluate on their own.
            </p>
          </Panel>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 18, marginTop: 18 }}>
          {contributionTracks.map((track) => (
            <Panel key={track.title}>
              <h2 style={{ fontSize: 25, letterSpacing: -0.9, margin: '0 0 10px' }}>{track.title}</h2>
              <p style={{ color: 'rgba(248,248,252,0.7)', lineHeight: 1.7, margin: 0 }}>{track.body}</p>
            </Panel>
          ))}
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: 18, marginTop: 18 }}>
          <Panel accent="#f4c26b">
            <h2 style={{ fontSize: 28, letterSpacing: -1, margin: '0 0 16px' }}>Your first PR path</h2>
            <StepList items={firstPrSteps} />
          </Panel>
          <Panel accent="#00d4aa">
            <h2 style={{ fontSize: 28, letterSpacing: -1, margin: '0 0 16px' }}>Growth and CP guardrails</h2>
            <StepList items={principles} />
          </Panel>
        </section>

        <section style={{ marginTop: 18 }}>
          <Panel accent="#818cf8">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: 30, letterSpacing: -1.1, margin: '0 0 8px' }}>Prefer backend, agents, or graph work?</h2>
                <p style={{ color: 'rgba(248,248,252,0.65)', lineHeight: 1.65, margin: 0, maxWidth: 700 }}>
                  The backend repo covers Aura agents, IOO execution, PostgreSQL/pgvector, Redis, contribution tracking, and API reliability.
                </p>
              </div>
              <a href={BACKEND_ISSUES_LINK} target="_blank" rel="noopener noreferrer" style={{ background: 'rgba(129,140,248,0.14)', border: '1px solid rgba(129,140,248,0.32)', color: '#c7d2fe', padding: '14px 18px', borderRadius: 14, textDecoration: 'none', fontWeight: 900 }}>
                Backend issues →
              </a>
            </div>
          </Panel>
        </section>
      </div>
    </main>
  )
}
