import { API_URL } from './config';

const TOKEN_KEY = 'connectome_token';
const EXPERIMENT_ID = 'developer_onboarding_funnel';
const VARIANT = 'contribute_page_v1';

export type DeveloperOnboardingEvent =
  | 'contribute_page_viewed'
  | 'cp_explainer_opened'
  | 'cp_issue_list_clicked'
  | 'web_repo_clicked'
  | 'community_clicked'
  | 'github_connect_clicked'
  | 'contribution_type_selected'
  | 'github_sync_clicked'
  | 'contribution_submit_started'
  | 'contribution_submit_succeeded'
  | 'contribution_submit_failed';

export function trackDeveloperOnboardingEvent(eventType: DeveloperOnboardingEvent, value = 1): void {
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
