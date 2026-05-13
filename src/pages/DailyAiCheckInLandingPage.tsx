import { Link } from 'react-router-dom'

const APP_LINK = '/auth?utm_source=owned_landing&utm_campaign=daily_ai_check_in'
const EXAMPLES_LINK = '/path-feed-examples'
const RETURN_LOOP_LINK = '/path-feed-return-loop'
const BUILDERS_LINK = '/connectome-builders'

const checkInSteps = [
  {
    title: 'Tell Aura what today feels like',
    detail: 'A check-in should be fast: energy, constraints, location context, and the goal that matters most right now.',
  },
  {
    title: 'Get one realistic next move',
    detail: 'Connectome turns that context into a Path Feed card instead of a generic productivity list or infinite feed.',
  },
  {
    title: 'Rate, save, complete, or skip',
    detail: 'A tiny action closes the loop so tomorrow’s recommendations can become more useful and less noisy.',
  },
]

const useCases = [
  'You want a daily AI check-in that respects your actual day, not an abstract ideal schedule.',
  'You are testing personal AI tools and care about activation, feedback, and return loops.',
  'You are a builder looking for a narrow contribution path into AI OS / human flourishing infrastructure.',
]

function Panel({ children, accent = '#00d4aa' }: { children: React.ReactNode; accent?: string }) {
  return (
    <section style={{ background: 'linear-gradient(145deg, rgba(255,255,255,0.075), rgba(255,255,255,0.026))', border: `1px solid ${accent}34`, borderRadius: 26, padding: 24, boxShadow: '0 24px 70px rgba(0,0,0,0.25)' }}>
      {children}
    </section>
  )
}

export default function DailyAiCheckInLandingPage() {
  return (
    <main style={{ minHeight: 'var(--visual-viewport-height, 100dvh)', background: '#060610', color: '#f8f8fc', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(circle at 14% 12%, rgba(0,212,170,0.24), transparent 30rem), radial-gradient(circle at 86% 16%, rgba(129,140,248,0.24), transparent 32rem), radial-gradient(circle at 50% 108%, rgba(244,194,107,0.14), transparent 34rem)' }} />

      <div style={{ position: 'relative', maxWidth: 1120, margin: '0 auto', padding: '28px 20px 76px' }}>
        <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 54 }}>
          <Link to="/" style={{ color: '#f8f8fc', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, fontWeight: 950 }}>
            <span style={{ width: 34, height: 34, borderRadius: 12, display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg, rgba(0,212,170,0.28), rgba(129,140,248,0.32))', border: '1px solid rgba(0,212,170,0.35)' }}>◈</span>
            <span>Connectome</span>
          </Link>
          <Link to={EXAMPLES_LINK} style={{ color: 'rgba(248,248,252,0.72)', textDecoration: 'none', fontSize: 14, fontWeight: 850 }}>See Path Feed examples →</Link>
        </nav>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: 28, alignItems: 'center' }}>
          <div>
            <div style={{ color: '#00d4aa', fontSize: 12, fontWeight: 950, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 16 }}>Daily AI check-in · Path Feed activation</div>
            <h1 style={{ fontSize: 'clamp(42px, 7vw, 78px)', lineHeight: 0.96, letterSpacing: -3.5, margin: '0 0 20px', fontWeight: 950 }}>
              A daily AI check-in should end in one useful action.
            </h1>
            <p style={{ fontSize: 20, lineHeight: 1.6, color: 'rgba(248,248,252,0.72)', maxWidth: 760, margin: '0 0 28px' }}>
              Connectome is building a personal AI OS for human flourishing: a calm check-in, a contextual Path Feed, and a feedback loop that learns what actually helped.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link to={APP_LINK} style={{ background: 'linear-gradient(135deg, #00d4aa, #818cf8)', color: '#07100f', padding: '15px 20px', borderRadius: 14, textDecoration: 'none', fontWeight: 950, boxShadow: '0 18px 44px rgba(0,212,170,0.18)' }}>
                Try a check-in →
              </Link>
              <Link to={RETURN_LOOP_LINK} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#f8f8fc', padding: '15px 20px', borderRadius: 14, textDecoration: 'none', fontWeight: 850 }}>
                See the return loop
              </Link>
            </div>
          </div>

          <Panel accent="#818cf8">
            <div style={{ color: '#a5b4fc', fontSize: 12, fontWeight: 950, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 10 }}>What makes it different</div>
            <h2 style={{ margin: '0 0 14px', fontSize: 32, letterSpacing: -1.1 }}>Less dashboard. More next move.</h2>
            <p style={{ color: 'rgba(248,248,252,0.68)', lineHeight: 1.75, margin: 0 }}>
              Most personal AI tools ask for lots of context and leave you with another interface to manage. Connectome’s first-session promise is narrower: show a useful card, ask for a clear signal, and improve from there.
            </p>
          </Panel>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(285px, 1fr))', gap: 18, marginTop: 24 }}>
          {checkInSteps.map((step, index) => (
            <Panel key={step.title}>
              <div style={{ color: '#98ffe9', fontSize: 12, fontWeight: 950, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 12 }}>{index + 1} · {step.title}</div>
              <p style={{ color: 'rgba(248,248,252,0.76)', lineHeight: 1.7, margin: 0 }}>{step.detail}</p>
            </Panel>
          ))}
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: 18, marginTop: 18 }}>
          <Panel accent="#f4c26b">
            <h2 style={{ fontSize: 28, letterSpacing: -1, margin: '0 0 16px' }}>Good fit if…</h2>
            <ul style={{ margin: 0, paddingLeft: 20, color: 'rgba(248,248,252,0.72)', lineHeight: 1.75 }}>
              {useCases.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </Panel>
          <Panel accent="#00d4aa">
            <h2 style={{ fontSize: 28, letterSpacing: -1, margin: '0 0 16px' }}>Builders welcome</h2>
            <p style={{ color: 'rgba(248,248,252,0.72)', lineHeight: 1.75, margin: '0 0 16px' }}>
              The public roadmap needs focused help on onboarding, Path Feed quality, contribution analytics, and safe agent UX. Contribution Points are recognition/reputation only — not cash, tokens, equity, or investment returns.
            </p>
            <Link to={BUILDERS_LINK} style={{ color: '#98ffe9', fontWeight: 900, textDecoration: 'none' }}>Open the builder path →</Link>
          </Panel>
        </section>
      </div>
    </main>
  )
}
