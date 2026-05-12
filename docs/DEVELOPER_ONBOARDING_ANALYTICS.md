# Developer onboarding analytics

The Contribute surface records a small privacy-light funnel through the existing A/B event pipeline, with a local browser buffer for unauthenticated/local inspection.

## Funnel identity

- `experiment_id`: `developer_onboarding_funnel`
- `variant`: `contribute_page_v1`

Telemetry is best-effort and silent: if the user is signed out, local dev has no API, Redis is unavailable, or the request fails, the UI keeps working. Every event is also written to a capped local browser ring buffer so the funnel remains inspectable before auth/backend capture is available.

## Events

- `contribute_page_viewed`
- `cp_explainer_opened`
- `cp_issue_list_clicked`
- `web_repo_clicked`
- `backend_repo_clicked`
- `community_clicked`
- `github_connect_clicked`
- `contribution_type_selected`
- `github_sync_clicked`
- `contribution_submit_started`
- `contribution_submit_succeeded`
- `contribution_submit_failed`

## Inspecting results

Use the existing results endpoint while signed in as an authorised user:

```text
GET /api/ab/results/developer_onboarding_funnel
```

The backend stores events under Redis keys shaped like:

```text
ab:events:developer_onboarding_funnel:contribute_page_v1
```

For local or unauthenticated browser inspection, open DevTools on the Contribute page and run:

```js
window.logConnectomeDeveloperOnboardingEvents()
```

or retrieve the raw array with:

```js
window.connectomeDeveloperOnboardingEvents()
```

The local ring buffer is stored at `localStorage.connectome_developer_onboarding_events` and keeps the latest 50 events.

Do not add personal data, PR contents, issue contents, or free-form user text to these events. Event names, numeric values, timestamps, and route paths are enough for this funnel.
