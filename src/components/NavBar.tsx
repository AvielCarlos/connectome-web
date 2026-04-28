import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS: Array<{ path: string; label: string; icon: string | null; emoji?: boolean; special?: boolean; isProfile?: boolean; isAdmin?: boolean }> = [
  { path: '/feed',    label: 'Feed',    icon: '✦',  emoji: true  },
  { path: '/ora',     label: 'Ora',     icon: '◈',  special: true },
  { path: '/goals',   label: 'Goals',   icon: '◎',  emoji: false },
  { path: '/journal', label: 'Journal', icon: '✍',  emoji: false },
  { path: '/dao',     label: 'DAO',     icon: '🏛', emoji: true  },
  { path: '/profile', label: 'Me',      icon: null,  isProfile: true },
];

const TIER_COLORS: Record<string, string> = {
  sovereign: '#a855f7',
  explorer:  '#3b82f6',
  free:      '#6b7280',
};

export function NavBar() {
  const { logout, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [navVisible, setNavVisible] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  const tier = (profile as any)?.subscription_tier || 'free';
  const tierColor = TIER_COLORS[tier] || '#6b7280';
  const initials = ((profile as any)?.display_name || (profile as any)?.email || 'U')[0].toUpperCase();
  const isAdmin = (profile as any)?.is_admin || (profile as any)?.profile?.is_admin;

  useEffect(() => {
    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        const current = window.scrollY;
        if (current > lastScrollY.current + 12 && current > 80) setNavVisible(false);
        else if (current < lastScrollY.current - 6) setNavVisible(true);
        lastScrollY.current = current;
        ticking.current = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setNavVisible(true);
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  return (
    <>
      {/* ── Desktop Sidebar ──────────────────────────────────────────────── */}
      <nav className="hidden-mobile" style={{
        position: 'fixed', left: 0, top: 0, bottom: 0, width: 230,
        background: 'rgba(10,10,18,0.98)', backdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', flexDirection: 'column', padding: '24px 12px',
        zIndex: 100,
      }}>
        {/* Brand */}
        <div style={{ padding: '0 10px 28px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 12,
            background: 'linear-gradient(135deg, rgba(0,212,170,0.15), rgba(0,212,170,0.35))',
            border: '1px solid rgba(0,212,170,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 19, boxShadow: '0 0 20px rgba(0,212,170,0.12)',
          }}>◈</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: -0.5 }}>iDo</div>
            <div style={{ fontSize: 10, color: 'rgba(248,248,252,0.3)', letterSpacing: 1.5, textTransform: 'uppercase' }}>by Ora</div>
          </div>
        </div>

        {/* Nav links */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.path} to={item.path} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '11px 14px', borderRadius: 12,
              textDecoration: 'none', fontSize: 14, fontWeight: isActive ? 700 : 500,
              background: isActive ? 'rgba(0,212,170,0.1)' : 'transparent',
              color: isActive ? '#00d4aa' : 'rgba(248,248,252,0.55)',
              transition: 'all 0.15s',
            })}>
              {item.isProfile ? (
                <div style={{
                  width: 22, height: 22, borderRadius: 11,
                  background: `linear-gradient(135deg, ${tierColor}44, ${tierColor}88)`,
                  border: `1.5px solid ${tierColor}66`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 800, color: tierColor,
                }}>{initials}</div>
              ) : (
                <span style={{ fontSize: 17, width: 22, textAlign: 'center', lineHeight: 1 }}>{item.icon}</span>
              )}
              <span>{item.label}</span>
              {item.isAdmin && isAdmin && (
                <span style={{ marginLeft: 'auto', fontSize: 9, color: '#00d4aa', background: 'rgba(0,212,170,0.1)', padding: '1px 6px', borderRadius: 8 }}>ADMIN</span>
              )}
            </NavLink>
          ))}
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 14 }}>
          {profile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', marginBottom: 6, borderRadius: 10, background: 'rgba(255,255,255,0.03)' }}>
              <div style={{
                width: 32, height: 32, borderRadius: 16, flexShrink: 0,
                background: `linear-gradient(135deg, ${tierColor}33, ${tierColor}66)`,
                border: `1.5px solid ${tierColor}55`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 800, color: tierColor,
              }}>{initials}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {(profile as any).display_name || (profile as any).email?.split('@')[0]}
                </div>
                <div style={{ fontSize: 10, color: tierColor, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {tier}{isAdmin ? ' · admin' : ''}
                </div>
              </div>
            </div>
          )}
          <button onClick={() => { logout(); navigate('/'); }} style={{
            background: 'transparent', color: 'rgba(248,248,252,0.25)',
            fontSize: 12, padding: '8px 12px', borderRadius: 8, width: '100%', textAlign: 'left',
          }}>← Sign out</button>
        </div>
      </nav>

      {/* ── Mobile Top Bar ───────────────────────────────────────────────── */}
      <header className="show-mobile" style={{
        position: 'fixed', top: 0, left: 0, right: 0,
        height: 'var(--top-header-height)',
        background: 'rgba(10,10,15,0.95)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        zIndex: 99,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 18px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'linear-gradient(135deg, rgba(0,212,170,0.2), rgba(0,212,170,0.4))',
            border: '1px solid rgba(0,212,170,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
          }}>◈</div>
          <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: -0.3 }}>iDo</span>
        </div>
        {/* Avatar — navigates to profile */}
        <button onClick={() => navigate('/profile')} style={{
          width: 34, height: 34, borderRadius: 17, border: 'none', cursor: 'pointer',
          background: `linear-gradient(135deg, ${tierColor}44, ${tierColor}88)`,
          outline: `1.5px solid ${tierColor}66`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 800, color: tierColor, position: 'relative',
        }}>
          {initials}
          {isAdmin && (
            <span style={{
              position: 'absolute', top: -3, right: -3,
              width: 10, height: 10, borderRadius: 5,
              background: '#00d4aa', border: '1.5px solid #0a0a0f',
            }} />
          )}
        </button>
      </header>

      {/* ── Mobile Bottom Nav — floating pill ───────────────────────────── */}
      <div className="show-mobile" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        zIndex: 100,
        padding: '0 12px calc(12px + env(safe-area-inset-bottom))',
        background: 'linear-gradient(transparent, rgba(10,10,15,0.9) 40%)',
        transform: navVisible ? 'translateY(0)' : 'translateY(110%)',
        transition: 'transform 0.28s cubic-bezier(.25,.8,.25,1)',
        pointerEvents: navVisible ? 'auto' : 'none',
      }}>
        <nav style={{
          background: 'rgba(18,18,30,0.97)',
          backdropFilter: 'blur(24px)',
          borderRadius: 26,
          border: '1px solid rgba(255,255,255,0.09)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)',
          display: 'flex', alignItems: 'center',
          padding: '6px 4px',
          gap: 2,
        }}>
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                style={{
                  flex: 1,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  gap: 3, textDecoration: 'none',
                  padding: '7px 4px',
                  borderRadius: 20,
                  background: isActive ? 'rgba(0,212,170,0.12)' : 'transparent',
                  transition: 'all 0.18s',
                  minWidth: 0,
                  position: 'relative',
                }}
              >
                {item.isProfile ? (
                  <div style={{
                    width: 24, height: 24, borderRadius: 12,
                    background: isActive
                      ? `linear-gradient(135deg, ${tierColor}66, ${tierColor}aa)`
                      : `linear-gradient(135deg, ${tierColor}33, ${tierColor}55)`,
                    border: `1.5px solid ${isActive ? tierColor : tierColor + '66'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 800, color: isActive ? tierColor : tierColor + 'aa',
                    transition: 'all 0.18s',
                  }}>
                    {initials}
                    {isAdmin && (
                      <span style={{
                        position: 'absolute', top: 4, right: '50%', transform: 'translateX(12px)',
                        width: 6, height: 6, borderRadius: 3,
                        background: '#00d4aa', border: '1px solid rgba(18,18,30,0.97)',
                      }} />
                    )}
                  </div>
                ) : item.path === '/ora' ? (
                  // Special Ora button — slightly larger
                  <div style={{
                    width: 32, height: 32, borderRadius: 16,
                    background: isActive
                      ? 'linear-gradient(135deg, rgba(0,212,170,0.25), rgba(0,212,170,0.45))'
                      : 'rgba(0,212,170,0.07)',
                    border: `1.5px solid ${isActive ? 'rgba(0,212,170,0.6)' : 'rgba(0,212,170,0.2)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 17, color: isActive ? '#00d4aa' : 'rgba(0,212,170,0.5)',
                    boxShadow: isActive ? '0 0 12px rgba(0,212,170,0.25)' : 'none',
                    transition: 'all 0.18s',
                  }}>◈</div>
                ) : (
                  <span style={{
                    fontSize: 20, lineHeight: 1,
                    color: isActive ? '#00d4aa' : 'rgba(248,248,252,0.35)',
                    transform: isActive ? 'scale(1.15)' : 'scale(1)',
                    transition: 'all 0.18s',
                    filter: isActive ? 'drop-shadow(0 0 6px rgba(0,212,170,0.4))' : 'none',
                  }}>{item.icon}</span>
                )}
                <span style={{
                  fontSize: 9, fontWeight: isActive ? 700 : 500, letterSpacing: 0.3,
                  color: isActive ? '#00d4aa' : 'rgba(248,248,252,0.3)',
                  transition: 'color 0.18s',
                }}>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <style>{`
        .hidden-mobile { display: none !important; }
        @media (min-width: 768px) {
          .hidden-mobile { display: flex !important; }
          .show-mobile   { display: none  !important; }
        }
        @media (max-width: 767px) {
          .show-mobile   { display: flex  !important; }
        }
      `}</style>
    </>
  );
}
