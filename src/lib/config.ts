export const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
export const ENABLE_NOTIFICATION_BELL = import.meta.env.VITE_ENABLE_NOTIFICATION_BELL !== 'false';

if (!API_URL && import.meta.env.DEV) {
  // Keep local failures obvious instead of silently calling the wrong backend.
  // Set VITE_API_URL in .env.local, or via the deploy environment.
  console.warn('[config] VITE_API_URL is not set; API calls will use relative paths.');
}

export function apiUrl(path = ''): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_URL}${normalizedPath}`;
}
