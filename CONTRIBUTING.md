# Contributing to Connectome Web

Connectome Web is the interface for Ora, iDo, and the Ascension Technologies contribution economy. Contributions should make the AI OS clearer, calmer, more useful, or easier to build on.

## Local setup

```bash
git clone https://github.com/AvielCarlos/connectome-web.git
cd connectome-web
npm install
npm run dev
```

Before opening a PR, run:

```bash
npm run build
```

## How to pick work

1. Browse open issues.
2. Prefer issues labelled `good first issue`, `frontend`, `design`, `agent-dev`, or `growth`.
3. Comment with your intended approach if the work affects UX architecture or agent behaviour.
4. Keep PRs focused and reviewable.

## Contribution categories

- **Frontend/product** — React surfaces, routes, state, user flows, responsive polish.
- **Design systems** — shared components, layout primitives, visual consistency, accessibility.
- **Agent UX** — Ora overlays, contextual actions, IOO progress states, agent handoffs.
- **Growth engineering** — onboarding analytics, contribution funnel, referral loops, activation metrics.
- **DAO/contribution UX** — CP visibility, leaderboards, steward pathways, contribution submission.
- **Docs/devex** — setup guides, architecture notes, examples, issue quality.

## CP rewards

Contribution Points recognise shipped work and help identify trusted builders in the ecosystem.

| Work type | Typical CP |
| --- | ---: |
| Docs polish, small UI bug, copy fix | 25–75 |
| Good first issue / contained component | 75–200 |
| Product feature, route, agent UX integration | 200–600 |
| Major design system, architecture, growth loop | 600–1,500+ |

CP is awarded after review based on impact, quality, maintainability, and mission alignment. Include your expected CP category in the PR description.

## Pull request checklist

- [ ] The PR has a clear title and summary.
- [ ] The change is scoped to one user/developer problem.
- [ ] `npm run build` passes, or the blocker is stated.
- [ ] UX changes include screenshots or a short screen recording when practical.
- [ ] New routes/components are named clearly and are reusable where appropriate.
- [ ] The PR links the related issue and mentions expected CP category.

## Product principles

- Make powerful AI feel calm and understandable.
- Prefer composable components over one-off screens.
- Show users what Ora is doing and why.
- Keep contribution and CP pathways visible without turning the product into a casino.
- Build surfaces that a real person would trust with their daily life.
