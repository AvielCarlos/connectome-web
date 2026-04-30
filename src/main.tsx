import React, { Suspense, lazy, useEffect } from 'react'
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

// Lazy-load all app pages for route-level code splitting
const FeedPage = lazy(() => import('./pages/FeedPage'))
const GoalsPage = lazy(() => import('./pages/GoalsPage'))
const RoutinesPage = lazy(() => import('./pages/RoutinesPage'))
const DAOPage = lazy(() => import('./pages/DAOPage'))
const ContributePage = lazy(() => import('./pages/ContributePage'))
const ServicesPage = lazy(() => import('./pages/ServicesPage'))
const AiOsSetupLandingPage = lazy(() => import('./pages/AiOsSetupLandingPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const SurfacePage = lazy(() => import('./pages/SurfacePage'))
const IOOPage = lazy(() => import('./pages/IOOPage'))

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
      const keyboardInset = Math.max(0, Math.round(layoutHeight - visualHeight - offsetTop))
      const keyboardOpen = keyboardInset > 80

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

function App() {
  useKeyboardViewport()
  const { isAuthenticated } = useAuth()
  return (
    <div style={{ minHeight: 'var(--visual-viewport-height, 100dvh)', background: '#060610', color: '#f8f8fc' }}>
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
          <Route path="/app/goals" element={<ShellRoute activeApp="goals"><GoalsPage /></ShellRoute>} />
          <Route path="/app/routines" element={<ShellRoute activeApp="routines"><RoutinesPage /></ShellRoute>} />
          <Route path="/app/dao" element={<ShellRoute activeApp="dao"><DAOPage /></ShellRoute>} />
          <Route path="/app/contribute" element={<ShellRoute activeApp="contribute"><ContributePage /></ShellRoute>} />
          <Route path="/app/profile" element={<ShellRoute activeApp="profile"><ProfilePage /></ShellRoute>} />
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
          <Route path="/ora" element={<Navigate to="/app" replace />} />
          <Route path="/dao" element={<Navigate to="/app/dao" replace />} />
          <Route path="/contribute" element={<Navigate to="/app/contribute" replace />} />
          <Route path="/profile" element={<Navigate to="/app/profile" replace />} />
          <Route path="/ioo" element={<Navigate to="/app/ioo" replace />} />

          {/* WebSpawn surfaces — auth-gated but accessible via direct link */}
          <Route path="/surfaces/:surfaceId" element={<ShellRoute activeApp="services"><SurfacePage /></ShellRoute>} />
        </Routes>
      </Suspense>
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
