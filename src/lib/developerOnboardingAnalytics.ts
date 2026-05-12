import { API_URL } from './config';

const TOKEN_KEY = 'connectome_token';
const EXPERIMENT_ID = 'developer_onboarding_funnel';
const VARIANT = 'contribute_page_v1';
const LOCAL_EVENT_KEY = 'connectome_developer_onboarding_events';
const MAX_LOCAL_EVENTS = 50;

export type DeveloperOnboardingEvent =
  | 'contribute_page_viewed'
  | 'cp_explainer_opened'
  | 'cp_issue_list_clicked'
  | 'web_repo_clicked'
  | 'backend_repo_clicked'
  | 'community_clicked'
  | 'github_connect_clicked'
  | 'contribution_type_selected'
  | 'github_sync_clicked'
  | 'contribution_submit_started'
  | 'contribution_submit_succeeded'
  | 'contribution_submit_failed';

export type DeveloperOnboardingLocalEvent = {
  experiment_id: typeof EXPERIMENT_ID;
  variant: typeof VARIANT;
  event_type: DeveloperOnboardingEvent;
  value: number;
  created_at: string;
  path: string;
};

function readLocalEvents(): DeveloperOnboardingLocalEvent[] {
  try {
    const raw = localStorage.getItem(LOCAL_EVENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item) => item?.event_type && item?.created_at) : [];
  } catch {
    return [];
  }
}

function storeLocalEvent(eventType: DeveloperOnboardingEvent, value: number): void {
  const event: DeveloperOnboardingLocalEvent = {
    experiment_id: EXPERIMENT_ID,
    variant: VARIANT,
    event_type: eventType,
    value,
    created_at: new Date().toISOString(),
    path: window.location.pathname,
  };

  try {
    const events = [...readLocalEvents(), event].slice(-MAX_LOCAL_EVENTS);
    localStorage.setItem(LOCAL_EVENT_KEY, JSON.stringify(events));
  } catch {
    // Local diagnostics should never block contribution flows.
  }
}

export function getDeveloperOnboardingEvents(): DeveloperOnboardingLocalEvent[] {
  return readLocalEvents();
}

export function logDeveloperOnboardingEvents(): DeveloperOnboardingLocalEvent[] {
  const events = getDeveloperOnboardingEvents();
  if (typeof console.table === 'function') console.table(events);
  else console.log(events);
  return events;
}

if (typeof window !== 'undefined') {
  (window as Window & { connectomeDeveloperOnboardingEvents?: typeof getDeveloperOnboardingEvents; logConnectomeDeveloperOnboardingEvents?: typeof logDeveloperOnboardingEvents }).connectomeDeveloperOnboardingEvents = getDeveloperOnboardingEvents;
  (window as Window & { connectomeDeveloperOnboardingEvents?: typeof getDeveloperOnboardingEvents; logConnectomeDeveloperOnboardingEvents?: typeof logDeveloperOnboardingEvents }).logConnectomeDeveloperOnboardingEvents = logDeveloperOnboardingEvents;
}

export function trackDeveloperOnboardingEvent(eventType: DeveloperOnboardingEvent, value = 1): void {
  storeLocalEvent(eventType, value);

  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return;

  fetch(`${API_URL}/api/ab/event`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      experiment_id: EXPERIMENT_ID,
      variant: VARIANT,
      event_type: eventType,
      value,
    }),
  }).catch(() => {
    // Telemetry must never block the contribution flow.
  });
}
