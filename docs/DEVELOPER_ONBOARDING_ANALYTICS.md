# Developer onboarding analytics

The Contribute surface records a small authenticated funnel through the existing A/B event pipeline.

## Funnel identity

- `experiment_id`: `developer_onboarding_funnel`
- `variant`: `contribute_page_v1`

Telemetry is best-effort and silent: if the user is signed out, local dev has no API, Redis is unavailable, or the request fails, the UI keeps working.

## Events

- `contribute_page_viewed`
- `cp_explainer_opened`
- `cp_issue_list_clicked`
- `web_repo_clicked`
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

Do not add personal data, PR contents, issue contents, or free-form user text to these events. Event names and numeric values are enough for this funnel.
