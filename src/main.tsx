import React, { Suspense, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './components/Toast'
import ConnectomeShell from './shell/ConnectomeShell'
import AuraOnboarding from './components/AuraOnboarding'
import './index.css'

// Eagerly load auth pages (small, needed immediately)
import AuthPage from './pages/AuthPage'
import AuthCallbackPage from './pages/AuthCallbackPage'
import GitHubCallbackPage from './pages/GitHubCallbackPage'
import ConnectomeHome from './pages/ConnectomeHome'
import FeedPage from './pages/FeedPage'
import AuraPage from './pages/OraPage'
import GoalsPage from './pages/GoalsPage'
import RoutinesPage from './pages/RoutinesPage'
import DAOPage from './pages/DAOPage'
import ContributePage from './pages/ContributePage'
import ServicesPage from './pages/ServicesPage'
import AiOsSetupLandingPage from './pages/AiOsSetupLandingPage'
import ProfilePage from './pages/ProfilePage'
import SurfacePage from './pages/SurfacePage'
import IOOPage from './pages/IOOPage'
import PaymentSuccessPage from './pages/PaymentSuccessPage'

type ShellApp = React.ComponentProps<typeof ConnectomeShell>['activeApp']

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <>{children}</> : <Navigate to="/" replace />
}

function ShellRoute({ activeApp, children }: { activeApp: ShellApp; children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <ConnectomeShell activeApp={activeApp}>{children}</ConnectomeShell>
    </ProtectedRoute>
  )
}


function useKeyboardViewport() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const root = document.documentElement
    const body = document.body
    let settleTimer: number | undefined

    const keepFocusedFieldVisible = () => {
      const active = document.activeElement
      if (!(active instanceof HTMLElement)) return
      if (!active.matches('input, textarea, select, [contenteditable="true"]')) return
      // Fixed app surfaces (Aura chat/feed sheets) handle their own keyboard
      // geometry. Browser scrollIntoView centering makes the composer float too
      // far above the keyboard on mobile Safari.
      if (active.closest('.ora-container, .feed-container, .ora-overlay')) return

      window.requestAnimationFrame(() => {
        const viewportHeight = window.visualViewport?.height ?? window.innerHeight
        const rect = active.getBoundingClientRect()
        const safeTop = 92
        const safeBottom = Math.max(120, viewportHeight * 0.34)
        const isCovered = rect.bottom > viewportHeight - safeBottom || rect.top < safeTop

        if (isCovered) {
          active.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' })
        }
      })
    }

    const update = () => {
      const viewport = window.visualViewport
      const layoutHeight = window.innerHeight
      const visualHeight = viewport?.height ?? layoutHeight
      const offsetTop = viewport?.offsetTop ?? 0
      const visualDelta = Math.max(0, layoutHeight - visualHeight)
      // Mobile Safari can report a non-zero visualViewport.offsetTop while the
      // keyboard is open. Subtracting it can hide the keyboard-open state, which
      // leaves bottom-nav clearance below fixed composers as a scrollable gap.
      const keyboardInset = Math.max(0, Math.round(visualDelta - offsetTop), Math.round(visualDelta))
      const keyboardOpen = visualDelta > 80 || keyboardInset > 80

      root.style.setProperty('--visual-viewport-height', `${Math.round(visualHeight)}px`)
      root.style.setProperty('--keyboard-inset', `${keyboardInset}px`)
      body.classList.toggle('keyboard-open', keyboardOpen)

      if (keyboardOpen) {
        keepFocusedFieldVisible()
        if (settleTimer) window.clearTimeout(settleTimer)
        settleTimer = window.setTimeout(keepFocusedFieldVisible, 260)
      }
    }

    update()
    window.addEventListener('resize', update)
    window.addEventListener('orientationchange', update)
    window.addEventListener('focusin', update)
    window.visualViewport?.addEventListener('resize', update)
    window.visualViewport?.addEventListener('scroll', update)

    return () => {
      if (settleTimer) window.clearTimeout(settleTimer)
      window.removeEventListener('resize', update)
      window.removeEventListener('orientationchange', update)
      window.removeEventListener('focusin', update)
      window.visualViewport?.removeEventListener('resize', update)
      window.visualViewport?.removeEventListener('scroll', update)
      root.style.removeProperty('--visual-viewport-height')
      root.style.removeProperty('--keyboard-inset')
      body.classList.remove('keyboard-open')
    }
  }, [])
}

class AppErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error) {
    console.error('Connectome render error', error)
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: 'var(--visual-viewport-height, 100dvh)', display: 'grid', placeItems: 'center', padding: 24, background: '#060610', color: '#f8f8fc' }}>
          <div style={{ maxWidth: 420, padding: 22, borderRadius: 18, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)', textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>◈</div>
            <h1 style={{ fontSize: 20, marginBottom: 8 }}>Connectome needs a refresh</h1>
            <p style={{ color: 'rgba(248,248,252,0.68)', lineHeight: 1.5, marginBottom: 16 }}>A new Aura update just shipped and this page hit a stale app state.</p>
            <button type="button" onClick={() => window.location.reload()} style={{ border: 0, borderRadius: 999, padding: '11px 18px', fontWeight: 800, background: '#00d4aa', color: '#06110f' }}>Refresh Connectome</button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

function App() {
  useKeyboardViewport()
  const { isAuthenticated } = useAuth()
  return (
    <div style={{ minHeight: 'var(--visual-viewport-height, 100dvh)', background: '#060610', color: '#f8f8fc' }}>
      <AppErrorBoundary>
        <Suspense fallback={<div className="connectome-loading">Loading…</div>}>
        <Routes>
          <Route path="/" element={isAuthenticated ? <ShellRoute activeApp="home"><ConnectomeHome /></ShellRoute> : <AuthPage />} />
          <Route path="/auth" element={isAuthenticated ? <Navigate to="/app" replace /> : <AuthPage />} />
          {/* Google OAuth callback — must be accessible without auth */}
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/auth/github-callback" element={<GitHubCallbackPage />} />

          {/* AIOS app routes */}
          <Route path="/app" element={<ShellRoute activeApp="home"><ConnectomeHome /></ShellRoute>} />
          <Route path="/app/ido" element={<ShellRoute activeApp="ido"><FeedPage /></ShellRoute>} />
          <Route path="/app/future" element={<ShellRoute activeApp="ido"><FeedPage /></ShellRoute>} />
          <Route path="/app/ora" element={<ShellRoute activeApp="ora"><AuraPage /></ShellRoute>} />
          <Route path="/app/goals" element={<ShellRoute activeApp="goals"><GoalsPage /></ShellRoute>} />
          <Route path="/app/routines" element={<ShellRoute activeApp="routines"><RoutinesPage /></ShellRoute>} />
          <Route path="/app/dao" element={<ShellRoute activeApp="dao"><DAOPage /></ShellRoute>} />
          <Route path="/app/contribute" element={<ShellRoute activeApp="contribute"><ContributePage /></ShellRoute>} />
          <Route path="/app/profile" element={<ShellRoute activeApp="profile"><ProfilePage /></ShellRoute>} />
          <Route path="/app/billing/success" element={<ShellRoute activeApp="profile"><PaymentSuccessPage /></ShellRoute>} />
          <Route path="/app/journal" element={<Navigate to="/app/ido" replace />} />
          <Route path="/app/services" element={<ShellRoute activeApp="services"><ServicesPage /></ShellRoute>} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/ai-os-setup" element={<AiOsSetupLandingPage />} />
          <Route path="/services/ai-os-setup" element={<AiOsSetupLandingPage />} />
          <Route path="/app/ioo" element={<ShellRoute activeApp="ioo"><IOOPage /></ShellRoute>} />
          <Route path="/app/ivive" element={<Navigate to="/app/ioo" replace />} />
          <Route path="/app/eviva" element={<Navigate to="/app/ioo" replace />} />
          <Route path="/app/aventi" element={<Navigate to="/app/ioo" replace />} />
          <Route path="/onboarding" element={<ShellRoute activeApp="home"><AuraOnboarding /></ShellRoute>} />

          {/* Backward-compatible redirects */}
          <Route path="/home" element={<Navigate to="/app" replace />} />
          <Route path="/feed" element={<Navigate to="/app/ido" replace />} />
          <Route path="/discover" element={<Navigate to="/app/ido" replace />} />
          <Route path="/goals" element={<Navigate to="/app/goals" replace />} />
          <Route path="/routines" element={<Navigate to="/app/routines" replace />} />
          <Route path="/journal" element={<Navigate to="/app/ido" replace />} />
          <Route path="/ora" element={<Navigate to="/app/ora" replace />} />
          <Route path="/dao" element={<Navigate to="/app/dao" replace />} />
          <Route path="/contribute" element={<Navigate to="/app/contribute" replace />} />
          <Route path="/profile" element={<Navigate to="/app/profile" replace />} />
          <Route path="/ioo" element={<Navigate to="/app/ioo" replace />} />

          {/* WebSpawn surfaces — auth-gated but accessible via direct link */}
          <Route path="/surfaces/:surfaceId" element={<ShellRoute activeApp="services"><SurfacePage /></ShellRoute>} />
        </Routes>
        </Suspense>
      </AppErrorBoundary>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename="/connectome-web">
      <AuthProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/connectome-web/sw.js').catch(() => {
      // SW registration is best-effort
    })
  })
}
