// Handles /auth/github-callback — shows "GitHub connected!" then redirects to /contribute
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function GitHubCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get('connected');
    void connected;
    // Slight delay, then go to contribute page
    setTimeout(() => navigate('/contribute?github=connected'), 1500);
  }, [navigate]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0a0a0f', flexDirection: 'column', gap: 20 }}>
      <div style={{ fontSize: 48 }}>✅</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: '#34d399' }}>GitHub connected!</div>
      <div style={{ fontSize: 15, color: 'rgba(248,248,252,0.5)' }}>Taking you back to contributions…</div>
    </div>
  );
}
