import { Link } from 'react-router-dom'

const APP_LINK = '/auth?utm_source=owned_landing&utm_campaign=ai_daily_planner'
const CHECK_IN_LINK = '/daily-ai-check-in'
const EXAMPLES_LINK = '/path-feed-examples'
const BUILDERS_LINK = '/connectome-builders'

const plannerLoop = [
  {
    title: 'Start from your real capacity',
    detail: 'A useful AI daily planner should ask what kind of day you are actually having before it recommends a task list.',
  },
  {
    title: 'Turn advice into one action',
    detail: 'Connectome’s Path Feed turns recommendations into cards you can do now, save, rate, or reject instead of burying them in a chat transcript.',
  },
  {
    title: 'Learn from every response',
    detail: 'Ratings, saves, skipped cards, and feedback should improve the next plan so tomorrow feels less generic than today.',
  },
]

const comparison = [
  'Traditional planners capture tasks but rarely know which one fits your energy, context, or goals right now.',
  'Chatbots can brainstorm plans, but the output often becomes another list to manually manage.',
  'Connectome is testing an action-first planner loop: check in, receive a focused Path Feed, respond, and let Aura adapt.',
]

function Panel({ children, accent = '#00d4aa' }: { children: React.ReactNode; accent?: string }) {
  return (
    <section style={{ background: 'linear-gradient(145deg, rgba(255,255,255,0.072), rgba(255,255,255,0.026))', border: `1px solid ${accent}35`, borderRadius: 26, padding: 24, boxShadow: '0 24px 70px rgba(0,0,0,0.25)' }}>
      {children}
    </section>
  )
}

export default function AiDailyPlannerLandingPage() {
  return (
    <main style={{ minHeight: 'var(--visual-viewport-height, 100dvh)', background: '#060610', color: '#f8f8fc', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(circle at 18% 8%, rgba(0,212,170,0.23), transparent 30rem), radial-gradient(circle at 86% 20%, rgba(129,140,248,0.23), transparent 32rem), radial-gradient(circle at 50% 110%, rgba(244,194,107,0.14), transparent 34rem)' }} />

      <div style={{ position: 'relative', maxWidth: 1120, margin: '0 auto', padding: '28px 20px 76px' }}>
        <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 54 }}>
          <Link to="/" style={{ color: '#f8f8fc', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, fontWeight: 950 }}>
            <span style={{ width: 34, height: 34, borderRadius: 12, display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg, rgba(0,212,170,0.28), rgba(129,140,248,0.32))', border: '1px solid rgba(0,212,170,0.35)' }}>◈</span>
            <span>Connectome</span>
          </Link>
          <Link to={EXAMPLES_LINK} style={{ color: 'rgba(248,248,252,0.72)', textDecoration: 'none', fontSize: 14, fontWeight: 850 }}>View Path Feed examples →</Link>
        </nav>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: 28, alignItems: 'center' }}>
          <div>
            <div style={{ color: '#00d4aa', fontSize: 12, fontWeight: 950, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 16 }}>AI daily planner · action-first personal AI</div>
            <h1 style={{ fontSize: 'clamp(42px, 7vw, 78px)', lineHeight: 0.96, letterSpacing: -3.5, margin: '0 0 20px', fontWeight: 950 }}>
              A daily planner that starts with your next right action.
            </h1>
            <p style={{ fontSize: 20, lineHeight: 1.6, color: 'rgba(248,248,252,0.72)', maxWidth: 760, margin: '0 0 28px' }}>
              Connectome is building an AI daily planner around Aura and the Path Feed: a calm loop for checking in, choosing one useful step, and teaching the system what actually helped.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link to={APP_LINK} style={{ background: 'linear-gradient(135deg, #00d4aa, #818cf8)', color: '#07100f', padding: '15px 20px', borderRadius: 14, textDecoration: 'none', fontWeight: 950, boxShadow: '0 18px 44px rgba(0,212,170,0.18)' }}>
                Try the planner loop →
              </Link>
              <Link to={CHECK_IN_LINK} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#f8f8fc', padding: '15px 20px', borderRadius: 14, textDecoration: 'none', fontWeight: 850 }}>
                See the daily check-in
              </Link>
            </div>
          </div>

          <Panel accent="#818cf8">
            <div style={{ color: '#a5b4fc', fontSize: 12, fontWeight: 950, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 10 }}>Why this page exists</div>
            <h2 style={{ margin: '0 0 14px', fontSize: 32, letterSpacing: -1.1 }}>Search traffic should land on a concrete product promise.</h2>
            <p style={{ color: 'rgba(248,248,252,0.68)', lineHeight: 1.75, margin: 0 }}>
              This owned inbound page targets people looking for an AI daily planner and explains the Connectome difference without a cold message, blast, or hype-driven launch post.
            </p>
          </Panel>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(285px, 1fr))', gap: 18, marginTop: 24 }}>
          {plannerLoop.map((item, index) => (
            <Panel key={item.title}>
              <div style={{ color: '#98ffe9', fontSize: 12, fontWeight: 950, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 12 }}>{index + 1} · {item.title}</div>
              <p style={{ color: 'rgba(248,248,252,0.76)', lineHeight: 1.7, margin: 0 }}>{item.detail}</p>
            </Panel>
          ))}
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: 18, marginTop: 18 }}>
          <Panel accent="#f4c26b">
            <h2 style={{ fontSize: 28, letterSpacing: -1, margin: '0 0 16px' }}>How it differs from a to-do app</h2>
            <ul style={{ margin: 0, paddingLeft: 20, color: 'rgba(248,248,252,0.72)', lineHeight: 1.75 }}>
              {comparison.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </Panel>
          <Panel accent="#00d4aa">
            <h2 style={{ fontSize: 28, letterSpacing: -1, margin: '0 0 16px' }}>For builders</h2>
            <p style={{ color: 'rgba(248,248,252,0.72)', lineHeight: 1.75, margin: '0 0 16px' }}>
              Helpful contribution lanes include first-session clarity, activation telemetry, Path Feed cards, and trustworthy recommendation UX. CP is contribution recognition/reputation only — not cash, tokens, equity, or investment returns.
            </p>
            <Link to={BUILDERS_LINK} style={{ color: '#98ffe9', fontWeight: 900, textDecoration: 'none' }}>Open the builder path →</Link>
          </Panel>
        </section>
      </div>
    </main>
  )
}
