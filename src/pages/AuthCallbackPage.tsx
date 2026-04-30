/**
 * AuthCallbackPage — handles the Google OAuth redirect
 *
 * Google → Railway backend → redirects to:
 *   https://avielcarlos.github.io/connectome-web/auth/callback?token=<jwt>
 *
 * This page reads the token from the URL, stores it, and redirects to the app home.
 * If there's an error param instead, it shows an error and redirects to login.
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authStorage } from '../lib/OraClient';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const errorParam = params.get('error');

    if (errorParam) {
      setError(decodeURIComponent(errorParam));
      setTimeout(() => navigate('/', { replace: true }), 3000);
      return;
    }

    if (!token) {
      setError('No token received from Google. Please try again.');
      setTimeout(() => navigate('/', { replace: true }), 3000);
      return;
    }

    // Decode the JWT payload to extract user_id (sub claim)
    try {
      const parts = token.split('.');
      if (parts.length !== 3) throw new Error('Invalid token format');
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      const userId = payload.sub;
      if (!userId) throw new Error('No user ID in token');

      authStorage.setAuth(token, userId);
      // Small delay to let state settle, then redirect to the orientation home
      setTimeout(() => navigate('/app', { replace: true }), 100);
    } catch (e: any) {
      setError(`Token error: ${e.message}`);
      setTimeout(() => navigate('/', { replace: true }), 3000);
    }
  }, [navigate]);

  return (
    <div style={{
      minHeight: 'var(--visual-viewport-height, 100dvh)',
      background: '#0a0a0f',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: 16,
    }}>
      {error ? (
        <>
          <div style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 12,
            padding: '16px 24px',
            fontSize: 14,
            color: '#fca5a5',
            maxWidth: 400,
            textAlign: 'center',
          }}>
            ⚠️ {error}
          </div>
          <p style={{ color: 'rgba(248,248,252,0.4)', fontSize: 13 }}>
            Redirecting back to login…
          </p>
        </>
      ) : (
        <>
          <div style={{
            width: 48,
            height: 48,
            border: '3px solid rgba(0,212,170,0.3)',
            borderTopColor: '#00d4aa',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
          <p style={{ color: 'rgba(248,248,252,0.6)', fontSize: 15 }}>
            Signing you in with Google…
          </p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </>
      )}
    </div>
  );
}
