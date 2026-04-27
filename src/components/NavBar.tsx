import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { path: '/feed',    label: 'Feed',    icon: '✦' },
  { path: '/goals',   label: 'Goals',   icon: '◎' },
  { path: '/journal', label: 'Journal', icon: '✍' },
  { path: '/ora',     label: 'Ora',     icon: '◈' },
  { path: '/dao',     label: 'DAO',     icon: '🏛' },
];

export function NavBar() {
  const { logout, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [navVisible, setNavVisible] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Hide on scroll down, show on scroll up
  useEffect(() => {
    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        const current = window.scrollY;
        if (current > lastScrollY.current + 8 && current > 60) {
          setNavVisible(false);
        } else if (current < lastScrollY.current - 4) {
          setNavVisible(true);
        }
        lastScrollY.current = current;
        ticking.current = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Always show nav on route change
  useEffect(() => {
    setNavVisible(true);
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  return (
    <>
      {/* ──────────────────────── Desktop Sidebar ──────────────────────────── */}
      <nav
        className="hidden-mobile"
        style={{
          position: 'fixed',
          left: 0, top: 0, bottom: 0,
          width: 220,
          background: '#0e0e16',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          flexDirection: 'column',
          padding: '28px 16px',
          zIndex: 100,
        }}
      >
        {/* Logo */}
        <div style={{ padding: '0 12px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, #00d4aa22, #00d4aa44)',
              border: '1px solid #00d4aa55',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18,
            }}>◈</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 17, letterSpacing: -0.3 }}>Connectome</div>
              <div style={{ fontSize: 11, color: 'rgba(248,248,252,0.4)', letterSpacing: 1, textTransform: 'uppercase' }}>by Ora</div>
            </div>
          </div>
        </div>

        {/* Nav links */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 14px',
                borderRadius: 10,
                textDecoration: 'none',
                fontSize: 15,
                fontWeight: 500,
                background: isActive ? 'rgba(0,212,170,0.1)' : 'transparent',
                color: isActive ? '#00d4aa' : 'rgba(248,248,252,0.65)',
                borderLeft: isActive ? '2px solid #00d4aa' : '2px solid transparent',
                transition: 'all 0.15s',
              })}
            >
              <span style={{ fontSize: 18, width: 22, textAlign: 'center' }}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </div>

        {/* Profile + Logout */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16, marginTop: 8 }}>
          {profile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', marginBottom: 8 }}>
              <div style={{
                width: 30, height: 30, borderRadius: 15,
                background: 'linear-gradient(135deg, rgba(0,212,170,0.3), rgba(99,102,241,0.3))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, color: '#00d4aa',
              }}>
                {(profile.display_name || profile.email || '?')[0].toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {profile.display_name || profile.email?.split('@')[0]}
                </div>
                {profile.total_dao_cp != null && (
                  <div style={{ fontSize: 10, color: '#f4c26b' }}>⚡ {(profile.total_dao_cp || 0).toLocaleString()} CP</div>
                )}
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            style={{
              background: 'transparent',
              color: 'rgba(248,248,252,0.35)',
              fontSize: 13,
              padding: '8px 14px',
              borderRadius: 8,
              textAlign: 'left',
              width: '100%',
            }}
          >
            ← Sign out
          </button>
        </div>
      </nav>

      {/* ──────────────────────── Mobile Top Header ─────────────────────────── */}
      <header
        className="show-mobile"
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0,
          height: 'var(--top-header-height)',
          background: 'rgba(10,10,15,0.96)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          zIndex: 99,
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
        }}
      >
        {/* Ora Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: 'linear-gradient(135deg, rgba(0,212,170,0.2), rgba(0,212,170,0.4))',
            border: '1px solid rgba(0,212,170,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 15,
          }}>◈</div>
          <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: -0.3 }}>Connectome</span>
        </div>

        {/* Profile button */}
        <button
          onClick={handleLogout}
          title="Sign out"
          style={{
            width: 34, height: 34, borderRadius: 17,
            background: 'linear-gradient(135deg, rgba(0,212,170,0.15), rgba(99,102,241,0.15))',
            border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: 'rgba(248,248,252,0.7)',
          }}
        >
          {profile ? (profile.display_name || profile.email || '?')[0].toUpperCase() : '◈'}
        </button>
      </header>

      {/* ──────────────────────── Mobile Bottom Nav ─────────────────────────── */}
      <nav
        className="show-mobile"
        style={{
          position: 'fixed',
          bottom: 0, left: 0, right: 0,
          height: 'var(--bottom-nav-height)',
          background: 'rgba(10,10,15,0.97)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          zIndex: 100,
          alignItems: 'stretch',
          paddingBottom: 'env(safe-area-inset-bottom)',
          transform: navVisible ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.25s cubic-bezier(.25,.8,.25,1)',
        }}
      >
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              textDecoration: 'none',
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: 0.3,
              color: isActive ? '#00d4aa' : 'rgba(248,248,252,0.38)',
              paddingBottom: 2,
              position: 'relative',
              transition: 'color 0.15s',
            })}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span style={{
                    position: 'absolute',
                    top: 0, left: '50%',
                    transform: 'translateX(-50%)',
                    width: 24, height: 2,
                    background: '#00d4aa',
                    borderRadius: '0 0 3px 3px',
                  }} />
                )}
                <span style={{
                  fontSize: 20,
                  lineHeight: 1,
                  filter: isActive ? 'none' : 'opacity(0.6)',
                  transform: isActive ? 'scale(1.1)' : 'scale(1)',
                  transition: 'transform 0.15s, filter 0.15s',
                }}>{item.icon}</span>
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </>
  );
}
