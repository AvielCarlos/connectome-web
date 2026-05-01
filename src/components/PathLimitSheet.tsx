/**
 * PathLimitSheet — shown inline (as an IOO node sheet) when the user hits
 * the 4-active-path free-tier limit. Never navigates away; stays in context.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';

interface Props {
  activePaths: number;
  pathLimit: number;
  onClose: () => void;
  onArchive?: () => void; // opens goal archive picker
}

export function PathLimitSheet({ activePaths, pathLimit, onClose, onArchive }: Props) {
  const navigate = useNavigate();

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(10,10,15,0.85)', backdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: '100%', maxWidth: 480,
        background: 'linear-gradient(160deg, #0f0f1a 0%, #141420 100%)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '24px 24px 0 0',
        padding: '32px 24px 40px',
        display: 'flex', flexDirection: 'column', gap: 20,
      }}>
        {/* Handle */}
        <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)', margin: '0 auto -8px' }} />

        {/* Icon + title */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>◈</div>
          <div style={{ fontWeight: 900, fontSize: 20, color: '#f8f8fc', letterSpacing: -0.4 }}>
            {activePaths} of {pathLimit} paths open
          </div>
          <div style={{ fontSize: 14, color: 'rgba(248,248,252,0.45)', marginTop: 8, lineHeight: 1.6 }}>
            Your neural graph supports {pathLimit} active paths on the free tier.
            Complete or archive one to open a new direction — or subscribe to unlock unlimited paths.
          </div>
        </div>

        {/* Path slots visual */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', margin: '4px 0' }}>
          {Array.from({ length: pathLimit }).map((_, i) => (
            <div
              key={i}
              style={{
                width: 44, height: 8, borderRadius: 4,
                background: i < activePaths
                  ? 'linear-gradient(90deg, #00d4aa, #00b896)'
                  : 'rgba(255,255,255,0.1)',
                transition: 'background 0.3s',
              }}
            />
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {onArchive && (
            <button
              onClick={onArchive}
              style={{
                background: 'rgba(0,212,170,0.12)',
                border: '1px solid rgba(0,212,170,0.35)',
                color: '#00d4aa',
                padding: '14px 20px',
                borderRadius: 14,
                fontWeight: 800, fontSize: 15,
                cursor: 'pointer',
              }}
            >
              Archive a path to make room →
            </button>
          )}

          <button
            onClick={() => navigate('/app/profile?upgrade=paths')}
            style={{
              background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
              border: 'none',
              color: '#fff',
              padding: '14px 20px',
              borderRadius: 14,
              fontWeight: 800, fontSize: 15,
              cursor: 'pointer',
              boxShadow: '0 4px 24px rgba(139,92,246,0.25)',
            }}
          >
            Unlock unlimited paths ✦
          </button>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(248,248,252,0.45)',
              padding: '12px 20px',
              borderRadius: 14,
              fontWeight: 600, fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
