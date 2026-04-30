import { Link } from 'react-router-dom';

const SERVICES_UTM = '/services?utm_source=landing&utm_campaign=ai_os_setup_beta';
const MAP_CALL_MAILTO = 'mailto:nea@atdao.org?subject=20-min%20AI%20OS%20map&body=Hi%20Nea%2C%0A%0AI%20would%20like%20to%20start%20with%20a%2020-minute%20AI%20OS%20map.%0A%0AContext%3A%0A-%20What%20I%20do%3A%0A-%20Where%20my%20tools%2Fnotes%2Fgoals%20feel%20fragmented%3A%0A-%20What%20I%20want%20AI%20to%20help%20me%20execute%3A%0A';

const sections = {
  pains: ['Goals live in one place, notes in another, tasks somewhere else', 'AI chats are useful but forget your context and direction', 'Habits, content, clients, offers, and decisions compete for attention', 'You sense AI could change everything, but you do not have an architecture for it'],
  gets: ['Personal AI OS map across life, work, vitality, creativity, relationships, and money/admin', 'Custom Ora persona and system instructions tuned to your voice, values, boundaries, and decision rules', 'Knowledge/context structure for the information your AI needs to remember', '3–5 practical workflows for weekly planning, content, client prep, research, decisions, or vitality', '30-day implementation path so the system becomes usable without overwhelm'],
  fit: ['Founders and operators carrying too many open loops', 'Coaches, healers, consultants, and practitioners turning expertise into leverage', 'Creators, writers, educators, and mission-led builders with a serious body of work', 'High-agency people ready to share context and implement quickly'],
  notFit: ['You only want a generic chatbot setup', 'You are looking for free coaching or enterprise software', 'You do not want to map your real goals, tools, habits, and constraints', 'You are not ready to act on the system after it is built'],
};

const cardStyle = {
  background: 'rgba(255,255,255,0.045)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 22,
  padding: 24,
} as const;

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      border: '1px solid rgba(0,212,170,0.28)',
      background: 'rgba(0,212,170,0.09)',
      color: '#94f7df',
      borderRadius: 999,
      padding: '7px 11px',
      fontSize: 12,
      fontWeight: 800,
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    }}>{children}</span>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 12 }}>
      {items.map((item) => (
        <li key={item} style={{ display: 'flex', gap: 10, color: 'rgba(248,248,252,0.72)', lineHeight: 1.55, fontSize: 15 }}>
          <span style={{ color: '#00d4aa', fontWeight: 900 }}>✦</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function AiOsSetupLandingPage() {
  return (
    <main style={{ minHeight: 'var(--visual-viewport-height, 100dvh)', overflow: 'hidden', background: '#060610' }}>
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(circle at 18% 8%, rgba(0,212,170,0.22), transparent 30%), radial-gradient(circle at 82% 16%, rgba(99,102,241,0.18), transparent 32%), radial-gradient(circle at 50% 88%, rgba(168,85,247,0.14), transparent 34%)',
      }} />

      <div style={{ position: 'relative', maxWidth: 1120, margin: '0 auto', padding: '28px 20px 72px' }}>
        <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 56 }}>
          <Link to="/" style={{ color: '#f8f8fc', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, fontWeight: 900 }}>
            <span style={{ width: 34, height: 34, borderRadius: 12, display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg, rgba(0,212,170,0.28), rgba(99,102,241,0.32))', border: '1px solid rgba(0,212,170,0.35)' }}>◈</span>
            <span>Ora</span>
          </Link>
          <Link to={SERVICES_UTM} style={{ color: 'rgba(248,248,252,0.62)', textDecoration: 'none', fontSize: 14, fontWeight: 700 }}>
            View checkout →
          </Link>
        </nav>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 28, alignItems: 'center', marginBottom: 42 }}>
          <div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
              <Pill>Founder beta</Pill>
              <Pill>7-day private build</Pill>
              <Pill>3 spots</Pill>
            </div>
            <h1 style={{ fontSize: 'clamp(42px, 7vw, 76px)', lineHeight: 0.96, letterSpacing: -3.2, margin: '0 0 20px', fontWeight: 950 }}>
              Personal AI OS for founders, coaches, creators, and operators.
            </h1>
            <p style={{ fontSize: 20, lineHeight: 1.55, color: 'rgba(248,248,252,0.72)', maxWidth: 690, margin: '0 0 28px' }}>
              Turn your goals, knowledge, tools, habits, and recurring decisions into a practical AI operating system — not another scattered chatbot thread.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <a href={MAP_CALL_MAILTO} style={{ background: 'linear-gradient(135deg, #00d4aa, #818cf8)', color: '#07100f', padding: '15px 20px', borderRadius: 14, textDecoration: 'none', fontWeight: 900, boxShadow: '0 18px 44px rgba(0,212,170,0.18)' }}>
                Start with a 20-min AI OS map →
              </a>
              <Link to={SERVICES_UTM} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#f8f8fc', padding: '15px 20px', borderRadius: 14, textDecoration: 'none', fontWeight: 800 }}>
                View Stripe checkout
              </Link>
            </div>
          </div>

          <aside style={{ ...cardStyle, background: 'linear-gradient(145deg, rgba(0,212,170,0.12), rgba(99,102,241,0.10)), rgba(255,255,255,0.045)' }}>
            <div style={{ color: '#00d4aa', fontSize: 12, fontWeight: 900, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 }}>The promise</div>
            <h2 style={{ margin: '0 0 14px', fontSize: 30, letterSpacing: -1.2 }}>A 7-day beta build for your life and work.</h2>
            <p style={{ color: 'rgba(248,248,252,0.68)', lineHeight: 1.7, marginBottom: 18 }}>
              Avi maps the way you think, work, create, decide, and recover — then builds the personal AI instructions, context structure, and workflows that make AI usable as an operating system.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ background: 'rgba(6,6,16,0.52)', borderRadius: 16, padding: 16, border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: 30, fontWeight: 950, color: '#00d4aa' }}>$1,500</div>
                <div style={{ color: 'rgba(248,248,252,0.48)', fontSize: 13 }}>Founder beta</div>
              </div>
              <div style={{ background: 'rgba(6,6,16,0.52)', borderRadius: 16, padding: 16, border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: 30, fontWeight: 950, color: '#a5b4fc' }}>$3,500</div>
                <div style={{ color: 'rgba(248,248,252,0.48)', fontSize: 13 }}>Standard</div>
              </div>
            </div>
          </aside>
        </section>

        <section style={{ ...cardStyle, marginBottom: 18 }}>
          <h2 style={{ fontSize: 28, letterSpacing: -1, margin: '0 0 16px' }}>The real problem: your operating system is fragmented.</h2>
          <BulletList items={sections.pains} />
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18, marginBottom: 18 }}>
          <div style={cardStyle}>
            <h2 style={{ fontSize: 26, letterSpacing: -0.8, margin: '0 0 16px' }}>What you get</h2>
            <BulletList items={sections.gets} />
          </div>
          <div style={cardStyle}>
            <h2 style={{ fontSize: 26, letterSpacing: -0.8, margin: '0 0 16px' }}>Built for / not for</h2>
            <h3 style={{ color: '#00d4aa', fontSize: 13, letterSpacing: 1, textTransform: 'uppercase', margin: '0 0 10px' }}>For</h3>
            <BulletList items={sections.fit} />
            <h3 style={{ color: '#fbbf24', fontSize: 13, letterSpacing: 1, textTransform: 'uppercase', margin: '22px 0 10px' }}>Not for</h3>
            <BulletList items={sections.notFit} />
          </div>
        </section>

        <section style={{ ...cardStyle, marginBottom: 18 }}>
          <div style={{ color: '#00d4aa', fontSize: 12, fontWeight: 900, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>Trust note</div>
          <h2 style={{ fontSize: 28, letterSpacing: -1, margin: '0 0 12px' }}>Founder-led, limited beta, not a generic chatbot setup.</h2>
          <p style={{ color: 'rgba(248,248,252,0.7)', lineHeight: 1.75, margin: 0 }}>
            Ora is being built as an AI operating system for human fulfilment. This private setup is the human-delivered precursor: a focused build around your actual life, business, knowledge, values, and execution rhythm. Founder beta is intentionally limited so each system can be mapped with care.
          </p>
        </section>

        <section style={{ ...cardStyle, textAlign: 'center', background: 'linear-gradient(135deg, rgba(0,212,170,0.14), rgba(99,102,241,0.13))' }}>
          <h2 style={{ fontSize: 34, letterSpacing: -1.4, margin: '0 0 10px' }}>Want to see what your AI OS would look like?</h2>
          <p style={{ color: 'rgba(248,248,252,0.7)', lineHeight: 1.65, margin: '0 auto 22px', maxWidth: 680 }}>
            Start with a low-friction 20-minute map. If it is aligned, you can reserve the $1,500 founder beta through the services checkout.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            <a href={MAP_CALL_MAILTO} style={{ background: 'linear-gradient(135deg, #00d4aa, #818cf8)', color: '#07100f', padding: '15px 20px', borderRadius: 14, textDecoration: 'none', fontWeight: 900 }}>
              Start with a 20-min AI OS map →
            </a>
            <Link to={SERVICES_UTM} style={{ background: 'rgba(6,6,16,0.45)', border: '1px solid rgba(255,255,255,0.12)', color: '#f8f8fc', padding: '15px 20px', borderRadius: 14, textDecoration: 'none', fontWeight: 800 }}>
              Secondary: services checkout
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
