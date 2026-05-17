import { Link } from 'react-router-dom'

const APP_LINK = '/auth?utm_source=owned_landing&utm_campaign=path_feed_vs_chatbot'
const EXAMPLES_LINK = '/path-feed-examples'
const CHECK_IN_LINK = '/daily-ai-check-in'
const BUILDERS_LINK = '/connectome-builders'

const differences = [
  {
    title: 'A card proposes one next step',
    detail: 'Instead of asking you to invent the perfect prompt, Aura should surface a timely action with context, confidence, and a way to correct it.',
  },
  {
    title: 'Feedback is the interface',
    detail: 'Do now, save for later, rate, skip, and feedback signals are first-class. The product should learn from explicit intent, not hidden attention capture.',
  },
  {
    title: 'The loop continues tomorrow',
    detail: 'Daily check-ins and weekly recaps turn scattered conversations into a living path: what helped, what was ignored, and what should resurface.',
  },
]

const chatbotGaps = [
  'Blank input boxes make first sessions depend on prompt-writing skill.',
  'Useful advice often dies in the chat transcript instead of becoming an action.',
  'Return visits feel vague unless the system remembers goals, capacity, and feedback.',
]

function Panel({ children, accent = '#00d4aa' }: { children: React.ReactNode; accent?: string }) {
  return (
    <section style={{ background: 'linear-gradient(145deg, rgba(255,255,255,0.07), rgba(255,255,255,0.025))', border: `1px solid ${accent}34`, borderRadius: 26, padding: 24, boxShadow: '0 24px 70px rgba(0,0,0,0.25)' }}>
      {children}
    </section>
  )
}

export default function PathFeedVsChatbotLandingPage() {
  return (
    <main style={{ minHeight: 'var(--visual-viewport-height, 100dvh)', background: '#060610', color: '#f8f8fc', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(circle at 12% 10%, rgba(0,212,170,0.24), transparent 30rem), radial-gradient(circle at 86% 18%, rgba(129,140,248,0.23), transparent 32rem), radial-gradient(circle at 52% 106%, rgba(244,194,107,0.13), transparent 34rem)' }} />

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
            <div style={{ color: '#00d4aa', fontSize: 12, fontWeight: 950, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 16 }}>Path Feed vs chatbot · first-session clarity</div>
            <h1 style={{ fontSize: 'clamp(42px, 7vw, 78px)', lineHeight: 0.96, letterSpacing: -3.5, margin: '0 0 20px', fontWeight: 950 }}>
              What if personal AI started with your next useful action?
            </h1>
            <p style={{ fontSize: 20, lineHeight: 1.6, color: 'rgba(248,248,252,0.72)', maxWidth: 760, margin: '0 0 28px' }}>
              Chat is powerful, but a blank box is a hard first session. Connectome is testing a Path Feed: concrete recommendations you can do now, save, rate, or correct so Aura learns what actually helps.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link to={APP_LINK} style={{ background: 'linear-gradient(135deg, #00d4aa, #818cf8)', color: '#07100f', padding: '15px 20px', borderRadius: 14, textDecoration: 'none', fontWeight: 950, boxShadow: '0 18px 44px rgba(0,212,170,0.18)' }}>
                Try Connectome →
              </Link>
              <Link to={CHECK_IN_LINK} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#f8f8fc', padding: '15px 20px', borderRadius: 14, textDecoration: 'none', fontWeight: 850 }}>
                See daily check-in
              </Link>
            </div>
          </div>

          <Panel accent="#818cf8">
            <div style={{ color: '#a5b4fc', fontSize: 12, fontWeight: 950, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 10 }}>The conversion problem</div>
            <h2 style={{ margin: '0 0 14px', fontSize: 32, letterSpacing: -1.1 }}>People should understand the product before they need to trust it.</h2>
            <p style={{ color: 'rgba(248,248,252,0.68)', lineHeight: 1.75, margin: 0 }}>
              This page is an owned inbound asset for people comparing personal AI workflows. It explains the Path Feed pattern clearly before any broad public launch or directory submission.
            </p>
          </Panel>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(285px, 1fr))', gap: 18, marginTop: 24 }}>
          {differences.map((item, index) => (
            <Panel key={item.title}>
              <div style={{ color: '#98ffe9', fontSize: 12, fontWeight: 950, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 12 }}>{index + 1} · {item.title}</div>
              <p style={{ color: 'rgba(248,248,252,0.76)', lineHeight: 1.7, margin: 0 }}>{item.detail}</p>
            </Panel>
          ))}
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: 18, marginTop: 18 }}>
          <Panel accent="#f4c26b">
            <h2 style={{ fontSize: 28, letterSpacing: -1, margin: '0 0 16px' }}>Why not only chat?</h2>
            <ul style={{ margin: 0, paddingLeft: 20, color: 'rgba(248,248,252,0.72)', lineHeight: 1.75 }}>
              {chatbotGaps.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </Panel>
          <Panel accent="#00d4aa">
            <h2 style={{ fontSize: 28, letterSpacing: -1, margin: '0 0 16px' }}>For builders</h2>
            <p style={{ color: 'rgba(248,248,252,0.72)', lineHeight: 1.75, margin: '0 0 16px' }}>
              The open contribution path is ranking quality, first-session UX, telemetry, and trustworthy agent flows. CP is contribution recognition/reputation only — not cash, tokens, equity, or investment returns.
            </p>
            <Link to={BUILDERS_LINK} style={{ color: '#98ffe9', fontWeight: 900, textDecoration: 'none' }}>Open the builder path →</Link>
          </Panel>
        </section>
      </div>
    </main>
  )
}
