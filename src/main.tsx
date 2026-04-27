import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './components/Toast'
import AuthPage from './pages/AuthPage'
import FeedPage from './pages/FeedPage'
import GoalsPage from './pages/GoalsPage'
import JournalPage from './pages/JournalPage'
import OraPage from './pages/OraPage'
import DAOPage from './pages/DAOPage'
import { NavBar } from './components/NavBar'
import SuggestionButton from './components/SuggestionButton'
import './index.css'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <>{children}</> : <Navigate to="/" replace />
}

function App() {
  const { isAuthenticated } = useAuth()
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#f8f8fc' }}>
      {isAuthenticated && <NavBar />}
      {isAuthenticated && <SuggestionButton />}
      <Routes>
        <Route path="/" element={isAuthenticated ? <Navigate to="/feed" replace /> : <AuthPage />} />
        <Route path="/feed"    element={<ProtectedRoute><FeedPage /></ProtectedRoute>} />
        <Route path="/goals"   element={<ProtectedRoute><GoalsPage /></ProtectedRoute>} />
        <Route path="/journal" element={<ProtectedRoute><JournalPage /></ProtectedRoute>} />
        <Route path="/ora"     element={<ProtectedRoute><OraPage /></ProtectedRoute>} />
        <Route path="/dao"     element={<ProtectedRoute><DAOPage /></ProtectedRoute>} />
      </Routes>
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
