import { Link } from 'react-router-dom'

const APP_LINK = '/auth?utm_source=owned_landing&utm_campaign=ai_os_human_flourishing'
const CONTRIBUTE_LINK = '/contribute?utm_source=owned_landing&utm_campaign=ai_os_human_flourishing'

const principles = [
  'Start from your real goals, energy, relationships, location, and constraints — not a blank chat box.',
  'Turn context into practical Now and Future recommendations you can act on today or plan around this week.',
  'Keep contribution visible: builders can earn CP as recognition for shipped improvements and thoughtful review.',
]

const useCases = [
  'Find better local actions when you feel stuck or scattered.',
  'Connect long-term intentions to concrete routines, events, places, and next steps.',
  'Build an open-source agentic life OS where feedback improves the product instead of disappearing.',
]

const faq = [
  {
    q: 'Is Connectome another chatbot?',
    a: 'No. Aura is designed as an operating layer that turns goals, context, and signals into useful app surfaces — especially the Path Feed.',
  },
  {
    q: 'What should a first-time user try?',
    a: 'Open the Path Feed, review several cards, and save, rate, skip, or give feedback on what feels useful or confusing.',
  },
  {
    q: 'Can developers contribute?',
    a: 'Yes. Start with a narrow GitHub issue, comment with your intended approach, and open a focused PR. CP is contribution recognition and reputation, not a cash/token/equity promise.',
  },
]

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <section style={{ background: 'rgba(255,255,255,0.045)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 24, padding: 24 }}>
      {children}
    </section>
  )
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 12 }}>
      {items.map((item) => (
        <li key={item} style={{ display: 'flex', gap: 10, color: 'rgba(248,248,252,0.72)', lineHeight: 1.6 }}>
          <span style={{ color: '#00d4aa', fontWeight: 900 }}>✦</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

export default function HumanFlourishingLandingPage() {
  return (
    <main style={{ minHeight: 'var(--visual-viewport-height, 100dvh)', background: '#060610', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(circle at 18% 10%, rgba(0,212,170,0.22), transparent 30%), radial-gradient(circle at 80% 18%, rgba(129,140,248,0.18), transparent 34%), radial-gradient(circle at 50% 100%, rgba(168,85,247,0.12), transparent 36%)' }} />

      <div style={{ position: 'relative', maxWidth: 1120, margin: '0 auto', padding: '28px 20px 76px' }}>
        <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 56 }}>
          <Link to="/" style={{ color: '#f8f8fc', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, fontWeight: 900 }}>
            <span style={{ width: 34, height: 34, borderRadius: 12, display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg, rgba(0,212,170,0.28), rgba(99,102,241,0.32))', border: '1px solid rgba(0,212,170,0.35)' }}>◈</span>
            <span>Connectome</span>
          </Link>
          <Link to={CONTRIBUTE_LINK} style={{ color: 'rgba(248,248,252,0.68)', textDecoration: 'none', fontSize: 14, fontWeight: 800 }}>Contribute →</Link>
        </nav>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 28, alignItems: 'center', marginBottom: 22 }}>
          <div>
            <div style={{ color: '#00d4aa', fontSize: 12, fontWeight: 900, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 14 }}>AI OS for human flourishing</div>
            <h1 style={{ fontSize: 'clamp(42px, 7vw, 78px)', lineHeight: 0.96, letterSpacing: -3.4, margin: '0 0 20px', fontWeight: 950 }}>
              A personal AI operating system for a life that actually moves.
            </h1>
            <p style={{ fontSize: 20, lineHeight: 1.6, color: 'rgba(248,248,252,0.72)', maxWidth: 720, margin: '0 0 28px' }}>
              Connectome pairs Aura with a Path Feed that turns goals, context, places, routines, and feedback into practical next actions — so AI helps you live, not just chat.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link to={APP_LINK} style={{ background: 'linear-gradient(135deg, #00d4aa, #818cf8)', color: '#07100f', padding: '15px 20px', borderRadius: 14, textDecoration: 'none', fontWeight: 950, boxShadow: '0 18px 44px rgba(0,212,170,0.18)' }}>
                Try the Path Feed →
              </Link>
              <Link to={CONTRIBUTE_LINK} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#f8f8fc', padding: '15px 20px', borderRadius: 14, textDecoration: 'none', fontWeight: 850 }}>
                Build with us
              </Link>
            </div>
          </div>

          <SectionCard>
            <div style={{ color: '#a5b4fc', fontSize: 12, fontWeight: 900, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 10 }}>First-session promise</div>
            <h2 style={{ margin: '0 0 14px', fontSize: 31, letterSpacing: -1.2 }}>Open the feed. See more than one path. Tell Aura what lands.</h2>
            <p style={{ color: 'rgba(248,248,252,0.68)', lineHeight: 1.7, margin: 0 }}>
              The best first session is concrete: review several Now/Future cards, rate or save what matters, and leave one line of feedback. That signal helps Connectome become useful faster.
            </p>
          </SectionCard>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18, marginTop: 18 }}>
          <SectionCard>
            <h2 style={{ fontSize: 28, letterSpacing: -1, margin: '0 0 16px' }}>Design principles</h2>
            <BulletList items={principles} />
          </SectionCard>
          <SectionCard>
            <h2 style={{ fontSize: 28, letterSpacing: -1, margin: '0 0 16px' }}>What it helps with</h2>
            <BulletList items={useCases} />
          </SectionCard>
        </section>

        <section style={{ display: 'grid', gap: 14, marginTop: 18 }}>
          {faq.map((item) => (
            <SectionCard key={item.q}>
              <h2 style={{ fontSize: 22, letterSpacing: -0.7, margin: '0 0 8px' }}>{item.q}</h2>
              <p style={{ color: 'rgba(248,248,252,0.7)', lineHeight: 1.7, margin: 0 }}>{item.a}</p>
            </SectionCard>
          ))}
        </section>
      </div>
    </main>
  )
}
