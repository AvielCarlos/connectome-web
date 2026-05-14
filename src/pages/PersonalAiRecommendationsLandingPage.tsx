import { Link } from 'react-router-dom'

const APP_LINK = '/auth?utm_source=owned_landing&utm_campaign=personal_ai_recommendations'
const CHECK_IN_LINK = '/daily-ai-check-in'
const EXAMPLES_LINK = '/path-feed-examples'
const BUILDERS_LINK = '/connectome-builders'

const intents = [
  {
    title: 'Daily planning without another dashboard',
    detail: 'Start with a short context check-in, then let Aura propose one next move that fits today’s energy, location, and constraints.',
  },
  {
    title: 'Local opportunities that match your goals',
    detail: 'The Path Feed is designed to surface timely events, contribution paths, and meaningful actions instead of generic content recommendations.',
  },
  {
    title: 'A feedback loop you can control',
    detail: 'Rate, save, complete, or skip cards so the system learns from explicit signal rather than passive attention capture.',
  },
]

const comparison = [
  'Not an endless social feed optimized for time-on-site.',
  'Not a chatbot that forgets the action layer after the conversation ends.',
  'Not a productivity template that assumes every day has the same capacity.',
]

function Panel({ children, accent = '#00d4aa' }: { children: React.ReactNode; accent?: string }) {
  return (
    <section style={{ background: 'linear-gradient(145deg, rgba(255,255,255,0.07), rgba(255,255,255,0.024))', border: `1px solid ${accent}34`, borderRadius: 26, padding: 24, boxShadow: '0 24px 70px rgba(0,0,0,0.25)' }}>
      {children}
    </section>
  )
}

export default function PersonalAiRecommendationsLandingPage() {
  return (
    <main style={{ minHeight: 'var(--visual-viewport-height, 100dvh)', background: '#060610', color: '#f8f8fc', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(circle at 14% 12%, rgba(0,212,170,0.24), transparent 30rem), radial-gradient(circle at 86% 18%, rgba(129,140,248,0.23), transparent 32rem), radial-gradient(circle at 50% 108%, rgba(244,194,107,0.13), transparent 34rem)' }} />

      <div style={{ position: 'relative', maxWidth: 1120, margin: '0 auto', padding: '28px 20px 76px' }}>
        <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 54 }}>
          <Link to="/" style={{ color: '#f8f8fc', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, fontWeight: 950 }}>
            <span style={{ width: 34, height: 34, borderRadius: 12, display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg, rgba(0,212,170,0.28), rgba(129,140,248,0.32))', border: '1px solid rgba(0,212,170,0.35)' }}>◈</span>
            <span>Connectome</span>
          </Link>
          <Link to={EXAMPLES_LINK} style={{ color: 'rgba(248,248,252,0.72)', textDecoration: 'none', fontSize: 14, fontWeight: 850 }}>View example cards →</Link>
        </nav>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: 28, alignItems: 'center' }}>
          <div>
            <div style={{ color: '#00d4aa', fontSize: 12, fontWeight: 950, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 16 }}>Personal AI recommendations · Path Feed</div>
            <h1 style={{ fontSize: 'clamp(42px, 7vw, 78px)', lineHeight: 0.96, letterSpacing: -3.5, margin: '0 0 20px', fontWeight: 950 }}>
              Personal AI recommendations should become useful next steps.
            </h1>
            <p style={{ fontSize: 20, lineHeight: 1.6, color: 'rgba(248,248,252,0.72)', maxWidth: 760, margin: '0 0 28px' }}>
              Connectome is building a personal AI OS that turns check-ins, goals, and local context into a Path Feed: concrete cards you can try, rate, save, complete, or refine.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link to={APP_LINK} style={{ background: 'linear-gradient(135deg, #00d4aa, #818cf8)', color: '#07100f', padding: '15px 20px', borderRadius: 14, textDecoration: 'none', fontWeight: 950, boxShadow: '0 18px 44px rgba(0,212,170,0.18)' }}>
                Try Connectome →
              </Link>
              <Link to={CHECK_IN_LINK} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#f8f8fc', padding: '15px 20px', borderRadius: 14, textDecoration: 'none', fontWeight: 850 }}>
                See the daily check-in
              </Link>
            </div>
          </div>

          <Panel accent="#818cf8">
            <div style={{ color: '#a5b4fc', fontSize: 12, fontWeight: 950, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 10 }}>Why this matters</div>
            <h2 style={{ margin: '0 0 14px', fontSize: 32, letterSpacing: -1.1 }}>A recommendation is only helpful if it survives real life.</h2>
            <p style={{ color: 'rgba(248,248,252,0.68)', lineHeight: 1.75, margin: 0 }}>
              The first-session bar is practical: show more than one relevant card, make the next action clear, and collect a small feedback signal so tomorrow’s suggestions are less noisy.
            </p>
          </Panel>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(285px, 1fr))', gap: 18, marginTop: 24 }}>
          {intents.map((intent, index) => (
            <Panel key={intent.title}>
              <div style={{ color: '#98ffe9', fontSize: 12, fontWeight: 950, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 12 }}>{index + 1} · {intent.title}</div>
              <p style={{ color: 'rgba(248,248,252,0.76)', lineHeight: 1.7, margin: 0 }}>{intent.detail}</p>
            </Panel>
          ))}
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: 18, marginTop: 18 }}>
          <Panel accent="#f4c26b">
            <h2 style={{ fontSize: 28, letterSpacing: -1, margin: '0 0 16px' }}>What it is not</h2>
            <ul style={{ margin: 0, paddingLeft: 20, color: 'rgba(248,248,252,0.72)', lineHeight: 1.75 }}>
              {comparison.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </Panel>
          <Panel accent="#00d4aa">
            <h2 style={{ fontSize: 28, letterSpacing: -1, margin: '0 0 16px' }}>Help shape the recommendation engine</h2>
            <p style={{ color: 'rgba(248,248,252,0.72)', lineHeight: 1.75, margin: '0 0 16px' }}>
              Builders can contribute to onboarding, Path Feed quality, telemetry, and trustworthy agent UX. Contribution Points are recognition/reputation only — not cash, tokens, equity, or investment returns.
            </p>
            <Link to={BUILDERS_LINK} style={{ color: '#98ffe9', fontWeight: 900, textDecoration: 'none' }}>Open the builder path →</Link>
          </Panel>
        </section>
      </div>
    </main>
  )
}
