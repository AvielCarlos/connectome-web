import { Link } from 'react-router-dom'

const TRY_LINK = '/auth?utm_source=owned_landing&utm_campaign=path_feed_momentum'
const CONTRIBUTE_LINK = '/contribute?utm_source=owned_landing&utm_campaign=path_feed_momentum'

const updates = [
  {
    title: 'Daily Momentum Check-ins',
    body: 'Tell Aura what kind of day this is before you ask for the next step, so recommendations can match your actual energy and capacity.',
  },
  {
    title: 'Weekly Progress Recaps',
    body: 'Turn ratings, completions, and feedback into a weekly reflection loop instead of a noisy infinite feed.',
  },
  {
    title: 'Smart Difficulty Filters',
    body: 'Choose an easier start, a medium push, or a bigger challenge when the Path Feed needs to meet the moment.',
  },
]

const firstSessionSteps = [
  'Open the Path Feed and review several cards, not just the first one.',
  'Use the difficulty filter that matches your real capacity today.',
  'Rate, save, complete, or give one line of feedback so Aura can learn what was timely versus noisy.',
]

const builderPrompts = [
  'Improve the recommendation copy and metadata so cards explain why they fit today.',
  'Add small, reviewable telemetry or QA checks that prove first-session quality is improving.',
  'Write docs or issues that help new contributors make one focused PR safely.',
]

function Card({ children }: { children: React.ReactNode }) {
  return (
    <section style={{ background: 'rgba(255,255,255,0.045)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 24, padding: 24 }}>
      {children}
    </section>
  )
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: '1px solid rgba(0,212,170,0.22)', background: 'rgba(0,212,170,0.08)', color: '#bfffee', borderRadius: 999, padding: '8px 12px', fontSize: 13, fontWeight: 850 }}>
      {children}
    </span>
  )
}

function NumberedList({ items }: { items: string[] }) {
  return (
    <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 12 }}>
      {items.map((item, index) => (
        <li key={item} style={{ display: 'grid', gridTemplateColumns: '32px 1fr', gap: 12, alignItems: 'start', color: 'rgba(248,248,252,0.72)', lineHeight: 1.6 }}>
          <span style={{ width: 32, height: 32, borderRadius: 12, display: 'grid', placeItems: 'center', background: 'rgba(129,140,248,0.16)', color: '#c7d2fe', fontWeight: 950 }}>{index + 1}</span>
          <span>{item}</span>
        </li>
      ))}
    </ol>
  )
}

export default function PathFeedMomentumLandingPage() {
  return (
    <main style={{ minHeight: 'var(--visual-viewport-height, 100dvh)', background: '#060610', color: '#f8f8fc', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(circle at 15% 10%, rgba(0,212,170,0.24), transparent 32%), radial-gradient(circle at 82% 18%, rgba(129,140,248,0.18), transparent 34%), radial-gradient(circle at 48% 100%, rgba(168,85,247,0.12), transparent 38%)' }} />

      <div style={{ position: 'relative', maxWidth: 1120, margin: '0 auto', padding: '28px 20px 76px' }}>
        <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 56 }}>
          <Link to="/" style={{ color: '#f8f8fc', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, fontWeight: 950 }}>
            <span style={{ width: 34, height: 34, borderRadius: 12, display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg, rgba(0,212,170,0.28), rgba(99,102,241,0.32))', border: '1px solid rgba(0,212,170,0.35)' }}>◈</span>
            <span>Connectome</span>
          </Link>
          <Link to={CONTRIBUTE_LINK} style={{ color: 'rgba(248,248,252,0.68)', textDecoration: 'none', fontSize: 14, fontWeight: 850 }}>Contribute →</Link>
        </nav>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: 28, alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
              <Pill>Path Feed update</Pill>
              <Pill>Built for first-session quality</Pill>
            </div>
            <h1 style={{ fontSize: 'clamp(42px, 7vw, 78px)', lineHeight: 0.96, letterSpacing: -3.4, margin: '0 0 20px', fontWeight: 950 }}>
              Aura now adapts the Path Feed to your actual day.
            </h1>
            <p style={{ fontSize: 20, lineHeight: 1.6, color: 'rgba(248,248,252,0.72)', maxWidth: 730, margin: '0 0 28px' }}>
              Connectome is becoming a personal AI operating system that helps you choose what to do next. The latest Path Feed loop adds momentum check-ins, weekly recaps, and difficulty filters so recommendations can feel timely instead of noisy.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link to={TRY_LINK} style={{ background: 'linear-gradient(135deg, #00d4aa, #818cf8)', color: '#07100f', padding: '15px 20px', borderRadius: 14, textDecoration: 'none', fontWeight: 950, boxShadow: '0 18px 44px rgba(0,212,170,0.18)' }}>
                Try today’s Path Feed →
              </Link>
              <Link to={CONTRIBUTE_LINK} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#f8f8fc', padding: '15px 20px', borderRadius: 14, textDecoration: 'none', fontWeight: 850 }}>
                Help improve it
              </Link>
            </div>
          </div>

          <Card>
            <div style={{ color: '#a5b4fc', fontSize: 12, fontWeight: 950, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 10 }}>Why this matters</div>
            <h2 style={{ margin: '0 0 14px', fontSize: 32, letterSpacing: -1.2 }}>A good AI feed should not treat every day like the same day.</h2>
            <p style={{ color: 'rgba(248,248,252,0.68)', lineHeight: 1.75, margin: 0 }}>
              Some days need a gentle first step. Some days can handle a bigger challenge. The Path Feed is designed to learn from both your explicit feedback and your real follow-through.
            </p>
          </Card>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 18, marginTop: 18 }}>
          {updates.map((item) => (
            <Card key={item.title}>
              <h2 style={{ fontSize: 25, letterSpacing: -0.9, margin: '0 0 10px' }}>{item.title}</h2>
              <p style={{ color: 'rgba(248,248,252,0.7)', lineHeight: 1.7, margin: 0 }}>{item.body}</p>
            </Card>
          ))}
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: 18, marginTop: 18 }}>
          <Card>
            <h2 style={{ fontSize: 28, letterSpacing: -1, margin: '0 0 16px' }}>First session checklist</h2>
            <NumberedList items={firstSessionSteps} />
          </Card>
          <Card>
            <h2 style={{ fontSize: 28, letterSpacing: -1, margin: '0 0 16px' }}>Good first contributions</h2>
            <NumberedList items={builderPrompts} />
            <p style={{ color: 'rgba(248,248,252,0.54)', lineHeight: 1.6, margin: '16px 0 0', fontSize: 14 }}>
              CP is contribution recognition and reputation only; it is not a cash, token, equity, or investment promise.
            </p>
          </Card>
        </section>
      </div>
    </main>
  )
}
