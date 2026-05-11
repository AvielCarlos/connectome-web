export const ACTIVE_FEEDBACK_CONTEXT_KEY = 'aura_active_feedback_context';
export const FEEDBACK_ROUTE_TRAIL_KEY = 'aura_feedback_route_trail';
export const FEEDBACK_ACTION_TRAIL_KEY = 'aura_feedback_action_trail';

const MAX_TRAIL_ITEMS = 8;

function readJsonArray(key: string): Record<string, any>[] {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || '[]');
    return Array.isArray(parsed) ? parsed.filter((item) => item && typeof item === 'object') : [];
  } catch {
    return [];
  }
}

function writeJsonArray(key: string, items: Record<string, any>[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(items.slice(-MAX_TRAIL_ITEMS)));
  } catch {
    // Feedback context is best-effort only; never block the UI.
  }
}

export function appendFeedbackTrail(key: string, entry: Record<string, any>) {
  const trail = readJsonArray(key);
  writeJsonArray(key, [...trail, entry]);
}

export function recordFeedbackRoute(route: string, app?: string) {
  const existingTrail = readJsonArray(FEEDBACK_ROUTE_TRAIL_KEY);
  const last = existingTrail[existingTrail.length - 1];
  if (last?.route === route) return;
  appendFeedbackTrail(FEEDBACK_ROUTE_TRAIL_KEY, {
    route,
    app: app || null,
    title: typeof document !== 'undefined' ? document.title : null,
    visited_at: new Date().toISOString(),
  });
}

export function recordFeedbackAction(entry: Record<string, any>) {
  appendFeedbackTrail(FEEDBACK_ACTION_TRAIL_KEY, {
    ...entry,
    happened_at: new Date().toISOString(),
  });
}

export function setActiveFeedbackContext(context: Record<string, any>) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(ACTIVE_FEEDBACK_CONTEXT_KEY, JSON.stringify(context));
  } catch {
    // Best-effort only.
  }
}

export function buildFeedbackContextSnapshot() {
  if (typeof window === 'undefined') return null;
  let active: Record<string, any> | null = null;
  try {
    const raw = window.localStorage.getItem(ACTIVE_FEEDBACK_CONTEXT_KEY);
    active = raw ? JSON.parse(raw) : null;
  } catch {
    active = null;
  }

  return {
    active,
    route_trail: readJsonArray(FEEDBACK_ROUTE_TRAIL_KEY),
    action_trail: readJsonArray(FEEDBACK_ACTION_TRAIL_KEY),
  };
}
