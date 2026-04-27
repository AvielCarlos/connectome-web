/**
 * Toast — lightweight notification system
 * Usage: useToast().show('+5 CP', 'success')
 */
import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

type ToastType = 'success' | 'info' | 'error' | 'cp';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  show: (message: string, type?: ToastType) => void;
  showCP: (cp: number, total?: number) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counterRef = useRef(0);

  const show = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++counterRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const showCP = useCallback((cp: number, total?: number) => {
    show(total ? `+${cp} CP · ${total.toLocaleString()} total` : `+${cp} CP earned`, 'cp');
  }, [show]);

  return (
    <ToastContext.Provider value={{ show, showCP }}>
      {children}
      <ToastContainer toasts={toasts} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const TYPE_STYLES: Record<ToastType, { bg: string; border: string; color: string; icon: string }> = {
  cp:      { bg: 'rgba(244,194,107,0.12)', border: 'rgba(244,194,107,0.4)', color: '#f4c26b', icon: '⚡' },
  success: { bg: 'rgba(0,212,170,0.12)',   border: 'rgba(0,212,170,0.4)',   color: '#00d4aa', icon: '✓' },
  info:    { bg: 'rgba(99,102,241,0.12)',   border: 'rgba(99,102,241,0.4)', color: '#a5b4fc', icon: '◈' },
  error:   { bg: 'rgba(239,68,68,0.12)',    border: 'rgba(239,68,68,0.4)',  color: '#f87171', icon: '⚠' },
};

function ToastContainer({ toasts }: { toasts: ToastItem[] }) {
  return (
    <div style={{
      position: 'fixed',
      top: 'max(16px, env(safe-area-inset-top))',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      alignItems: 'center',
      pointerEvents: 'none',
      width: '100%',
      maxWidth: 360,
      padding: '0 16px',
    }}>
      {toasts.map((toast) => {
        const s = TYPE_STYLES[toast.type];
        return (
          <div
            key={toast.id}
            style={{
              background: s.bg,
              border: `1px solid ${s.border}`,
              borderRadius: 12,
              padding: '10px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              backdropFilter: 'blur(16px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              animation: 'toast-in 0.3s cubic-bezier(.25,.8,.25,1)',
              width: '100%',
            }}
          >
            <span style={{ fontSize: 16, color: s.color, flexShrink: 0 }}>{s.icon}</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: s.color }}>{toast.message}</span>
          </div>
        );
      })}
      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateY(-12px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
