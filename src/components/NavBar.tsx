import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { path: '/feed', label: 'Feed', icon: '✦' },
  { path: '/goals', label: 'Goals', icon: '◎' },
  { path: '/journal', label: 'Journal', icon: '✍' },
  { path: '/ora', label: 'Ora', icon: '◈' },
  { path: '/dao', label: 'DAO', icon: '🏛' },
];

export function NavBar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      {/* Desktop sidebar */}
      <nav
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          width: 220,
          background: '#0e0e16',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          flexDirection: 'column',
          padding: '28px 16px',
          zIndex: 100,
        }}
        className="hidden-mobile"
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

        {/* Logout */}
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
      </nav>

      {/* Mobile bottom nav */}
      <nav
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'rgba(10,10,15,0.95)',
          backdropFilter: 'blur(16px)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          zIndex: 100,
          padding: '8px 0 max(8px, env(safe-area-inset-bottom))',
        }}
        className="show-mobile"
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
              gap: 3,
              textDecoration: 'none',
              fontSize: 10,
              fontWeight: 500,
              color: isActive ? '#00d4aa' : 'rgba(248,248,252,0.4)',
              padding: '4px 0',
            })}
          >
            <span style={{ fontSize: 20 }}>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <style>{`
        @media (min-width: 768px) {
          .hidden-mobile { display: flex !important; }
          .show-mobile { display: none !important; }
        }
        @media (max-width: 767px) {
          .hidden-mobile { display: none !important; }
          .show-mobile { display: flex !important; }
        }
      `}</style>
    </>
  );
}
