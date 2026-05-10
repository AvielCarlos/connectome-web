import { Link } from 'react-router-dom'

const APP_LINK = '/auth?utm_source=owned_landing&utm_campaign=path_feed_examples'
const MOMENTUM_LINK = '/path-feed-momentum'
const BUILDERS_LINK = '/connectome-builders'

const examples = [
  {
    context: 'You want more energy but your week is full.',
    card: 'Take a 12-minute outdoor reset before the next calendar block.',
    why: 'Aura should prefer low-friction actions when momentum is low, then learn from skip/rate/check-in feedback.',
  },
  {
    context: 'You want to contribute to an aligned open-source project.',
    card: 'Review one good-first Connectome issue and leave a narrow implementation note.',
    why: 'The feed is meant to convert intention into a concrete next step, not a vague productivity prompt.',
  },
  {
    context: 'You are in Victoria and want something meaningful this week.',
    card: 'Save one local workshop, walk, or community event that matches your current goals.',
    why: 'Future-oriented cards should help people notice opportunities they would otherwise miss.',
  },
]

const proofPoints = [
  'A deeper Path Feed queue is now protected by the first-session reliability work already shipped in the app.',
  'Daily Momentum Check-ins and Weekly Progress Recaps give returning users a reason to come back without spammy notifications.',
  'Feedback, ratings, saves, and completed actions are the core activation signals we measure before broader promotion.',
]

function Panel({ children, accent = '#00d4aa' }: { children: React.ReactNode; accent?: string }) {
  return (
    <section style={{ background: 'linear-gradient(145deg, rgba(255,255,255,0.065), rgba(255,255,255,0.025))', border: `1px solid ${accent}33`, borderRadius: 26, padding: 24, boxShadow: '0 24px 70px rgba(0,0,0,0.24)' }}>
      {children}
    </section>
  )
}

export default function PathFeedExamplesLandingPage() {
  return (
    <main style={{ minHeight: 'var(--visual-viewport-height, 100dvh)', background: '#060610', color: '#f8f8fc', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(circle at 15% 8%, rgba(0,212,170,0.24), transparent 30rem), radial-gradient(circle at 88% 22%, rgba(129,140,248,0.22), transparent 32rem), radial-gradient(circle at 48% 100%, rgba(244,194,107,0.12), transparent 34rem)' }} />

      <div style={{ position: 'relative', maxWidth: 1120, margin: '0 auto', padding: '28px 20px 76px' }}>
        <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 54 }}>
          <Link to="/" style={{ color: '#f8f8fc', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, fontWeight: 950 }}>
            <span style={{ width: 34, height: 34, borderRadius: 12, display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg, rgba(0,212,170,0.28), rgba(129,140,248,0.32))', border: '1px solid rgba(0,212,170,0.35)' }}>◈</span>
            <span>Connectome</span>
          </Link>
          <Link to={MOMENTUM_LINK} style={{ color: 'rgba(248,248,252,0.72)', textDecoration: 'none', fontSize: 14, fontWeight: 850 }}>Momentum proof →</Link>
        </nav>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: 28, alignItems: 'center', marginBottom: 18 }}>
          <div>
            <div style={{ color: '#00d4aa', fontSize: 12, fontWeight: 950, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 16 }}>Path Feed examples · first-session proof</div>
            <h1 style={{ fontSize: 'clamp(42px, 7vw, 78px)', lineHeight: 0.96, letterSpacing: -3.5, margin: '0 0 20px', fontWeight: 950 }}>
              See what Connectome is supposed to do before you sign in.
            </h1>
            <p style={{ fontSize: 20, lineHeight: 1.6, color: 'rgba(248,248,252,0.72)', maxWidth: 760, margin: '0 0 28px' }}>
              The Path Feed is not another generic AI chat. It is a queue of context-aware next steps: practical cards you can rate, save, complete, or refine so Aura learns what actually helps.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link to={APP_LINK} style={{ background: 'linear-gradient(135deg, #00d4aa, #818cf8)', color: '#07100f', padding: '15px 20px', borderRadius: 14, textDecoration: 'none', fontWeight: 950, boxShadow: '0 18px 44px rgba(0,212,170,0.18)' }}>
                Try the Path Feed →
              </Link>
              <Link to={BUILDERS_LINK} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#f8f8fc', padding: '15px 20px', borderRadius: 14, textDecoration: 'none', fontWeight: 850 }}>
                Help improve it
              </Link>
            </div>
          </div>

          <Panel accent="#818cf8">
            <div style={{ color: '#a5b4fc', fontSize: 12, fontWeight: 950, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 10 }}>Why this page exists</div>
            <h2 style={{ margin: '0 0 14px', fontSize: 32, letterSpacing: -1.1 }}>Make the value legible before asking for attention.</h2>
            <p style={{ color: 'rgba(248,248,252,0.68)', lineHeight: 1.75, margin: 0 }}>
              Growth is paused unless first-session quality is credible. This public page gives new users and contributors concrete examples to evaluate, without cold outreach, DMs, scraped lists, or repetitive promotion.
            </p>
          </Panel>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(285px, 1fr))', gap: 18, marginTop: 18 }}>
          {examples.map((example) => (
            <Panel key={example.context}>
              <div style={{ color: '#98ffe9', fontSize: 12, fontWeight: 950, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 12 }}>Example card</div>
              <h2 style={{ fontSize: 24, lineHeight: 1.15, letterSpacing: -0.8, margin: '0 0 12px' }}>{example.context}</h2>
              <p style={{ color: '#f8f8fc', fontSize: 18, lineHeight: 1.55, margin: '0 0 14px', fontWeight: 850 }}>“{example.card}”</p>
              <p style={{ color: 'rgba(248,248,252,0.66)', lineHeight: 1.65, margin: 0 }}>{example.why}</p>
            </Panel>
          ))}
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: 18, marginTop: 18 }}>
          <Panel accent="#f4c26b">
            <h2 style={{ fontSize: 28, letterSpacing: -1, margin: '0 0 16px' }}>What we measure</h2>
            <ul style={{ margin: 0, paddingLeft: 20, color: 'rgba(248,248,252,0.72)', lineHeight: 1.75 }}>
              <li>New users in the last 24 hours.</li>
              <li>Activation: feed action, check-in, save, rating, or feedback.</li>
              <li>Return behaviour after the first useful card.</li>
            </ul>
          </Panel>
          <Panel accent="#00d4aa">
            <h2 style={{ fontSize: 28, letterSpacing: -1, margin: '0 0 16px' }}>Current proof points</h2>
            <ul style={{ margin: 0, paddingLeft: 20, color: 'rgba(248,248,252,0.72)', lineHeight: 1.75 }}>
              {proofPoints.map((point) => <li key={point}>{point}</li>)}
            </ul>
          </Panel>
        </section>
      </div>
    </main>
  )
}
