import { Link } from 'react-router-dom'

const APP_LINK = '/auth?utm_source=owned_landing&utm_campaign=path_feed_return_loop'
const EXAMPLES_LINK = '/path-feed-examples'
const BUILDERS_LINK = '/connectome-builders'

const returnLoop = [
  {
    step: '1 · Pick one useful card',
    detail: 'Start with a Path Feed recommendation that fits your actual energy, place, and goal context today.',
  },
  {
    step: '2 · Rate, save, complete, or skip',
    detail: 'Every lightweight action tells Aura whether the suggestion was timely, too hard, irrelevant, or worth doing again.',
  },
  {
    step: '3 · Come back for the next better move',
    detail: 'Daily Momentum and Weekly Recaps should turn yesterday’s signal into a clearer next card, not a noisy notification loop.',
  },
]

const activationSignals = [
  'New account/login in production, excluding obvious internal/test accounts when identifiable.',
  'First Path Feed action: rating, save, completed action, check-in, or feedback.',
  'Return within 48 hours after Aura has learned from a real interaction.',
]

function Panel({ children, accent = '#00d4aa' }: { children: React.ReactNode; accent?: string }) {
  return (
    <section style={{ background: 'linear-gradient(145deg, rgba(255,255,255,0.07), rgba(255,255,255,0.026))', border: `1px solid ${accent}36`, borderRadius: 26, padding: 24, boxShadow: '0 24px 70px rgba(0,0,0,0.25)' }}>
      {children}
    </section>
  )
}

export default function PathFeedReturnLoopLandingPage() {
  return (
    <main style={{ minHeight: 'var(--visual-viewport-height, 100dvh)', background: '#060610', color: '#f8f8fc', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(circle at 18% 10%, rgba(0,212,170,0.22), transparent 30rem), radial-gradient(circle at 86% 18%, rgba(129,140,248,0.24), transparent 32rem), radial-gradient(circle at 45% 105%, rgba(244,194,107,0.13), transparent 34rem)' }} />

      <div style={{ position: 'relative', maxWidth: 1120, margin: '0 auto', padding: '28px 20px 76px' }}>
        <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 54 }}>
          <Link to="/" style={{ color: '#f8f8fc', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, fontWeight: 950 }}>
            <span style={{ width: 34, height: 34, borderRadius: 12, display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg, rgba(0,212,170,0.28), rgba(129,140,248,0.32))', border: '1px solid rgba(0,212,170,0.35)' }}>◈</span>
            <span>Connectome</span>
          </Link>
          <Link to={EXAMPLES_LINK} style={{ color: 'rgba(248,248,252,0.72)', textDecoration: 'none', fontSize: 14, fontWeight: 850 }}>See example cards →</Link>
        </nav>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: 28, alignItems: 'center' }}>
          <div>
            <div style={{ color: '#00d4aa', fontSize: 12, fontWeight: 950, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 16 }}>Path Feed return loop · activation proof</div>
            <h1 style={{ fontSize: 'clamp(42px, 7vw, 78px)', lineHeight: 0.96, letterSpacing: -3.5, margin: '0 0 20px', fontWeight: 950 }}>
              Connectome should earn a second session, not just a signup.
            </h1>
            <p style={{ fontSize: 20, lineHeight: 1.6, color: 'rgba(248,248,252,0.72)', maxWidth: 760, margin: '0 0 28px' }}>
              The current growth target is 10 new users/day, but the product only deserves broader traffic when a first visit turns into a useful Path Feed action and a clear reason to return.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link to={APP_LINK} style={{ background: 'linear-gradient(135deg, #00d4aa, #818cf8)', color: '#07100f', padding: '15px 20px', borderRadius: 14, textDecoration: 'none', fontWeight: 950, boxShadow: '0 18px 44px rgba(0,212,170,0.18)' }}>
                Try one Path Feed card →
              </Link>
              <Link to={BUILDERS_LINK} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#f8f8fc', padding: '15px 20px', borderRadius: 14, textDecoration: 'none', fontWeight: 850 }}>
                Build the loop with us
              </Link>
            </div>
          </div>

          <Panel accent="#818cf8">
            <div style={{ color: '#a5b4fc', fontSize: 12, fontWeight: 950, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 10 }}>Why this page exists</div>
            <h2 style={{ margin: '0 0 14px', fontSize: 32, letterSpacing: -1.1 }}>Traffic without activation is noise.</h2>
            <p style={{ color: 'rgba(248,248,252,0.68)', lineHeight: 1.75, margin: 0 }}>
              This owned page turns the growth loop into a public product promise: show people how Connectome learns from a single card, measure the activation event, and improve retention before posting more broadly.
            </p>
          </Panel>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(285px, 1fr))', gap: 18, marginTop: 24 }}>
          {returnLoop.map((item) => (
            <Panel key={item.step}>
              <div style={{ color: '#98ffe9', fontSize: 12, fontWeight: 950, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 12 }}>{item.step}</div>
              <p style={{ color: 'rgba(248,248,252,0.76)', lineHeight: 1.7, margin: 0 }}>{item.detail}</p>
            </Panel>
          ))}
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: 18, marginTop: 18 }}>
          <Panel accent="#f4c26b">
            <h2 style={{ fontSize: 28, letterSpacing: -1, margin: '0 0 16px' }}>Activation signals we care about</h2>
            <ul style={{ margin: 0, paddingLeft: 20, color: 'rgba(248,248,252,0.72)', lineHeight: 1.75 }}>
              {activationSignals.map((signal) => <li key={signal}>{signal}</li>)}
            </ul>
          </Panel>
          <Panel accent="#00d4aa">
            <h2 style={{ fontSize: 28, letterSpacing: -1, margin: '0 0 16px' }}>No-spam growth rule</h2>
            <p style={{ color: 'rgba(248,248,252,0.72)', lineHeight: 1.75, margin: 0 }}>
              Public updates should point to durable owned proof like this page. No cold DMs, scraped lists, repetitive promo, or CP promises beyond contribution recognition/reputation.
            </p>
          </Panel>
        </section>
      </div>
    </main>
  )
}
