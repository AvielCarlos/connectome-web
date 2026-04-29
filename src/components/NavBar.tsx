/**
 * NavBar — WeChat-inspired navigation shell.
 *
 * Mobile: 5-tab bottom bar with elevated center Ora button.
 *   Tabs: Feed · Goals · [Ora] · Map · Me
 *   Active state: filled icon + label + accent underline
 *   Ora button: elevated, glowing, always prominent
 *
 * Desktop: sidebar with brand + nav links + user card.
 *
 * Inspired by:
 *   - WeChat: 5 tabs, flat, center action button
 *   - TikTok: "+" center button elevated, tab labels below icon
 *   - Duolingo: bright active state, bottom pill nav
 *   - Snapchat: ghost/map tabs, icon-first
 */
import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// ─── Mobile 5-tab config (WeChat pattern) ────────────────────────────────────
const MOBILE_TABS = [
  { path: '/feed',    icon: '◉',  label: 'Discover' },
  { path: '/goals',   icon: '◎',  label: 'Goals'    },
  { path: '/ora',     icon: null, label: 'Ora',  isOra: true },
  { path: '/ioo',     icon: '🗺', label: 'Map'      },
  { path: '/profile', icon: null, label: 'Me',   isProfile: true },
] as const;

// ─── Desktop sidebar config ───────────────────────────────────────────────────
const SIDEBAR_ITEMS = [
  { path: '/home',     icon: '◉',  label: 'Home'     },
  { path: '/feed',     icon: '✦',  label: 'Discover' },
  { path: '/ora',      icon: '◈',  label: 'Ora',     special: true },
  { path: '/goals',    icon: '◎',  label: 'Goals'    },
  { path: '/ioo',      icon: '🗺', label: 'Map'      },
  { path: '/journal',  icon: '✍',  label: 'Journal'  },
  { path: '/services', icon: '⚡', label: 'Services' },
  { path: '/dao',      icon: '🏛', label: 'DAO'      },
  { path: '/profile',  icon: null, label: 'Me',      isProfile: true },
] as const;

const TIER_COLORS: Record<string, string> = {
  sovereign: '#a855f7',
  explorer: '#3b82f6',
  free: '#6b7280',
};

export function NavBar() {
  const { logout, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [navVisible, setNavVisible] = useState(true);
  const [moreMenu, setMoreMenu] = useState<'me' | 'map' | null>(null);

  // More menu items for Me tab
  const ME_MORE = [
    { path: '/dao',      icon: '🏛', label: 'DAO & Contributions' },
    { path: '/services', icon: '⚡', label: 'Services' },
    { path: '/journal',  icon: '✍', label: 'Journal' },
    { path: '/home',     icon: '◉', label: 'Home' },
  ];

  const MAP_MORE = [
    { path: '/ioo',      icon: '🗺', label: 'IOO Map' },
    { path: '/goals',    icon: '◎', label: 'Goals' },
  ];
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  const tier = (profile as any)?.subscription_tier || 'free';
  const tierColor = TIER_COLORS[tier] || '#6b7280';
  const initials = ((profile as any)?.display_name || (profile as any)?.email || 'U')[0].toUpperCase();
  const isAdmin = (profile as any)?.is_admin || (profile as any)?.profile?.is_admin;

  // Hide nav on scroll down, show on scroll up
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

  // Show nav on route change
  useEffect(() => {
    setNavVisible(true);
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  return (
    <>
      {/* ── Desktop Sidebar ──────────────────────────────────────────────── */}
      <nav className="hidden-mobile" style={{
        position: 'fixed', left: 0, top: 0, bottom: 0, width: 240,
        background: 'rgba(8,8,14,0.99)',
        backdropFilter: 'blur(24px)',
        borderRight: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', flexDirection: 'column', padding: '20px 10px',
        zIndex: 100,
      }}>
        {/* Brand */}
        <div style={{ padding: '4px 12px 32px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 14,
            background: 'linear-gradient(135deg, rgba(0,212,170,0.2), rgba(0,212,170,0.4))',
            border: '1px solid rgba(0,212,170,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, boxShadow: '0 0 24px rgba(0,212,170,0.15)',
          }}>◈</div>
          <div>
            <div style={{ fontWeight: 900, fontSize: 17, letterSpacing: -0.6, color: '#f8f8fc' }}>iDo</div>
            <div style={{ fontSize: 10, color: 'rgba(248,248,252,0.25)', letterSpacing: 2, textTransform: 'uppercase', marginTop: 1 }}>by Ora</div>
          </div>
        </div>

        {/* Nav links */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {SIDEBAR_ITEMS.map((item) => (
            <NavLink key={item.path} to={item.path} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 14px', borderRadius: 12,
              textDecoration: 'none', fontSize: 14,
              fontWeight: isActive ? 700 : 500,
              background: isActive
                ? (item as any).special
                  ? 'rgba(0,212,170,0.12)'
                  : 'rgba(255,255,255,0.07)'
                : 'transparent',
              color: isActive ? '#f8f8fc' : 'rgba(248,248,252,0.45)',
              borderLeft: isActive ? `3px solid ${(item as any).special ? '#00d4aa' : 'rgba(255,255,255,0.4)'}` : '3px solid transparent',
              transition: 'all 0.15s',
            })}>
              {(item as any).isProfile ? (
                <div style={{
                  width: 22, height: 22, borderRadius: 11,
                  background: `linear-gradient(135deg, ${tierColor}44, ${tierColor}88)`,
                  border: `1.5px solid ${tierColor}66`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 800, color: tierColor,
                }}>{initials}</div>
              ) : (
                <span style={{ fontSize: 17, width: 22, textAlign: 'center', lineHeight: 1, color: (item as any).special ? '#00d4aa' : 'inherit' }}>
                  {item.icon}
                </span>
              )}
              <span>{item.label}</span>
              {(item as any).isAdmin && isAdmin && (
                <span style={{ marginLeft: 'auto', fontSize: 9, color: '#00d4aa', background: 'rgba(0,212,170,0.1)', padding: '1px 6px', borderRadius: 8 }}>ADMIN</span>
              )}
            </NavLink>
          ))}
        </div>

        {/* User footer */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 14 }}>
          {profile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', marginBottom: 6, borderRadius: 12, background: 'rgba(255,255,255,0.03)' }}>
              <div style={{
                width: 34, height: 34, borderRadius: 17, flexShrink: 0,
                background: `linear-gradient(135deg, ${tierColor}33, ${tierColor}66)`,
                border: `1.5px solid ${tierColor}55`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 800, color: tierColor,
              }}>{initials}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#f8f8fc' }}>
                  {(profile as any).display_name || (profile as any).email?.split('@')[0]}
                </div>
                <div style={{ fontSize: 10, color: tierColor, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {tier}{isAdmin ? ' · admin' : ''}
                </div>
              </div>
            </div>
          )}
          <button onClick={() => { logout(); navigate('/'); }} style={{
            background: 'transparent', color: 'rgba(248,248,252,0.2)',
            fontSize: 12, padding: '8px 14px', borderRadius: 8, width: '100%', textAlign: 'left',
            transition: 'color 0.15s',
          }}>← Sign out</button>
        </div>
      </nav>

      {/* More menu popover */}
      {moreMenu && (
        <div className="show-mobile" onClick={() => setMoreMenu(null)} style={{
          position: 'fixed', inset: 0, zIndex: 150,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
        }}>
          <div onClick={(e: React.MouseEvent) => e.stopPropagation()} style={{
            position: 'absolute', bottom: 80, right: 16,
            background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 16, overflow: 'hidden', minWidth: 220,
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}>
            {(moreMenu === 'me' ? ME_MORE : MAP_MORE).map((item, i, arr) => (
              <button key={item.path} onClick={() => { navigate(item.path); setMoreMenu(null); }} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 18px', background: 'none', border: 'none',
                borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                color: '#f8f8fc', fontSize: 15, fontWeight: 500, cursor: 'pointer',
                textAlign: 'left' as const,
              }}>
                <span style={{ fontSize: 20 }}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Mobile Bottom Nav — WeChat 5-tab pattern ─────────────────────── */}
      <div className="show-mobile" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        zIndex: 100,
        transform: navVisible ? 'translateY(0)' : 'translateY(110%)',
        transition: 'transform 0.3s cubic-bezier(.25,.8,.25,1)',
        pointerEvents: navVisible ? 'auto' : 'none',
      }}>
        {/* Frosted glass background */}
        <div style={{
          background: 'rgba(10,10,18,0.96)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          borderTop: '1px solid rgba(255,255,255,0.07)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          paddingTop: 4,
          boxShadow: '0 -1px 0 rgba(255,255,255,0.04), 0 -20px 60px rgba(0,0,0,0.4)',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            paddingLeft: 4,
            paddingRight: 4,
          }}>
            {MOBILE_TABS.map((tab) => {
              const isActive = location.pathname === tab.path ||
                (tab.path === '/feed' && location.pathname === '/');

              if ((tab as any).isOra) {
                // ─── Center Ora button — elevated like WeChat "+" ──────────
                return (
                  <div key={tab.path} style={{ flex: 1, display: 'flex', justifyContent: 'center', paddingBottom: 6 }}>
                    <NavLink to={tab.path} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
                      {/* Elevated Ora button */}
                      <div style={{
                        width: 54, height: 54,
                        borderRadius: 20,
                        background: isActive
                          ? 'linear-gradient(135deg, #00d4aa, #00b896)'
                          : 'linear-gradient(135deg, rgba(0,212,170,0.25), rgba(0,212,170,0.4))',
                        border: `1.5px solid ${isActive ? 'transparent' : 'rgba(0,212,170,0.5)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 26, color: isActive ? '#0a0a0f' : '#00d4aa',
                        boxShadow: isActive
                          ? '0 4px 24px rgba(0,212,170,0.5), 0 0 0 4px rgba(0,212,170,0.12)'
                          : '0 4px 20px rgba(0,212,170,0.25)',
                        transform: 'translateY(-8px)',
                        transition: 'all 0.2s cubic-bezier(.25,.8,.25,1)',
                      }}>◈</div>
                      <span style={{
                        fontSize: 10, fontWeight: 700, letterSpacing: 0.3,
                        color: isActive ? '#00d4aa' : 'rgba(248,248,252,0.4)',
                        paddingBottom: 2,
                      }}>Ora</span>
                    </NavLink>
                  </div>
                );
              }

              if ((tab as any).isProfile) {
                return (
                  <button key={tab.path} onClick={() => {
                    if (isActive) { setMoreMenu(moreMenu === 'me' ? null : 'me'); }
                    else { navigate(tab.path); setMoreMenu(null); }
                  }} style={{
                    flex: 1, background: 'none', border: 'none', cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    gap: 4, padding: '10px 4px 10px',
                    position: 'relative',
                  }}>
                    {/* Active indicator dot */}
                    {isActive && (
                      <div style={{
                        position: 'absolute', top: 7,
                        width: 18, height: 2, borderRadius: 1,
                        background: '#00d4aa',
                      }} />
                    )}
                    <div style={{
                      width: 28, height: 28, borderRadius: 14,
                      background: isActive
                        ? `linear-gradient(135deg, ${tierColor}88, ${tierColor}cc)`
                        : `linear-gradient(135deg, ${tierColor}33, ${tierColor}55)`,
                      border: `2px solid ${isActive ? tierColor : tierColor + '44'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 800, color: isActive ? '#fff' : tierColor,
                      transition: 'all 0.18s',
                      boxShadow: isActive ? `0 2px 12px ${tierColor}44` : 'none',
                    }}>{initials}</div>
                    <span style={{
                      fontSize: 10, fontWeight: isActive ? 700 : 500, letterSpacing: 0.3,
                      color: isActive ? '#f8f8fc' : 'rgba(248,248,252,0.35)',
                    }}>{tab.label}{moreMenu === 'me' ? ' ▲' : isActive ? ' ⋯' : ''}</span>
                  </button>
                );
              }

              // ─── Standard tab ─────────────────────────────────────────
              return (
                <NavLink key={tab.path} to={tab.path} style={{
                  flex: 1,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  gap: 4, textDecoration: 'none', padding: '10px 4px 10px',
                  position: 'relative',
                }}>
                  {/* Active indicator */}
                  {isActive && (
                    <div style={{
                      position: 'absolute', top: 7,
                      width: 18, height: 2, borderRadius: 1,
                      background: '#00d4aa',
                      animation: 'fadeIn 0.2s ease-out',
                    }} />
                  )}
                  <span style={{
                    fontSize: 22, lineHeight: 1,
                    color: isActive ? '#00d4aa' : 'rgba(248,248,252,0.35)',
                    transform: isActive ? 'scale(1.1)' : 'scale(1)',
                    transition: 'all 0.18s cubic-bezier(.25,.8,.25,1)',
                    filter: isActive ? 'drop-shadow(0 0 8px rgba(0,212,170,0.5))' : 'none',
                  }}>{tab.icon}</span>
                  <span style={{
                    fontSize: 10, fontWeight: isActive ? 700 : 500, letterSpacing: 0.3,
                    color: isActive ? '#00d4aa' : 'rgba(248,248,252,0.3)',
                    transition: 'color 0.18s',
                  }}>{tab.label}</span>
                </NavLink>
              );
            })}
          </div>
        </div>
      </div>

      <style>{`
        .hidden-mobile { display: none !important; }
        @media (min-width: 768px) {
          .hidden-mobile { display: flex !important; }
          .show-mobile   { display: none !important; }
        }
        @media (max-width: 767px) {
          .show-mobile   { display: flex  !important; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </>
  );
}
