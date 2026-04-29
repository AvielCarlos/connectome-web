import React, { Suspense, lazy } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './components/Toast'
import { NavBar } from './components/NavBar'
import './index.css'

// Eagerly load auth pages (small, needed immediately)
import AuthPage from './pages/AuthPage'
import AuthCallbackPage from './pages/AuthCallbackPage'

// Lazy-load all app pages for route-level code splitting
const FeedPage = lazy(() => import('./pages/FeedPage'))
const LandingRouter = lazy(() => import('./pages/LandingRouter'))
const GoalsPage = lazy(() => import('./pages/GoalsPage'))
const JournalPage = lazy(() => import('./pages/JournalPage'))
const OraPage = lazy(() => import('./pages/OraPage'))
const DAOPage = lazy(() => import('./pages/DAOPage'))
const ServicesPage = lazy(() => import('./pages/ServicesPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const SurfacePage = lazy(() => import('./pages/SurfacePage'))
const HomePage = lazy(() => import('./pages/HomePage'))
const IOOPage = lazy(() => import('./pages/IOOPage'))

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <>{children}</> : <Navigate to="/" replace />
}

function App() {
  const { isAuthenticated } = useAuth()
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#f8f8fc' }}>
      {isAuthenticated && <NavBar />}
      <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: '#888' }}>Loading…</div>}>
        <Routes>
          <Route path="/" element={isAuthenticated ? <Navigate to="/home" replace /> : <AuthPage />} />
          <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          {/* Google OAuth callback — must be accessible without auth */}
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/feed"    element={<ProtectedRoute><LandingRouter /></ProtectedRoute>} />
          <Route path="/goals"   element={<ProtectedRoute><GoalsPage /></ProtectedRoute>} />
          <Route path="/journal" element={<ProtectedRoute><JournalPage /></ProtectedRoute>} />
          <Route path="/ora"     element={<ProtectedRoute><OraPage /></ProtectedRoute>} />
          <Route path="/dao"      element={<ProtectedRoute><DAOPage /></ProtectedRoute>} />
          <Route path="/services" element={<ProtectedRoute><ServicesPage /></ProtectedRoute>} />
          <Route path="/profile"  element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/ioo"      element={<ProtectedRoute><IOOPage /></ProtectedRoute>} />
          {/* WebSpawn surfaces — auth-gated but accessible via direct link */}
          <Route path="/surfaces/:surfaceId" element={<SurfacePage />} />
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
