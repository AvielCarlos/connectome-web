# Connectome Web — Aura AI OS Interface

Connectome Web is the user-facing surface for an AI OS for human flourishing. It is where Aura, the Connectome nervous system, and the Ascension Technologies DAO become understandable and usable for real people.

The app combines daily action, goals, routines, discovery, contribution, DAO visibility, and agentic assistance into a calm life OS experience.

## Why builders should care

This is a rare chance to shape the interface layer for an agentic AI ecosystem:

- **Frontend/design engineers** can turn complex AI systems into calm, practical product surfaces.
- **Agent developers** can expose Aura capabilities through contextual quick actions, overlays, and workflows.
- **Growth engineers** can improve onboarding, contribution loops, analytics, referrals, and activation.
- **Product engineers** can connect mission, CP recognition, DAO participation, and daily utility in one coherent experience.

Contributors can earn Contribution Points (CP), leaderboard recognition, and a path toward founding steward review in the Ascension Technologies ecosystem. CP is reputation/recognition for contribution quality; it is not cash, token, equity, or an investment promise.

## Architecture overview

```text
Connectome Web
├── React + Vite + TypeScript app
├── ConnectomeShell / AppLauncher      AI OS shell
├── AuraOverlay                         contextual assistant layer
├── Pages                              goals, routines, feed, DAO, IOO, profile, contribution
├── Components                         reusable product surfaces
└── AuraClient                          API client for Connectome backend
```

Ecosystem map:

- **Aura** — the AI brain and agent layer.
- **Connectome** — the AI OS / nervous system.
- **iDo** — the daily app experience.
- **Ascension Technologies** — DAO, CP, governance, and contributor coordination layer.


## Try / share / contribute

We are currently aiming for **10 new users per day** through no-spam inbound growth: useful public assets, clear GitHub issues, SEO/owned pages, and product proof — not cold DMs or blasts.

Useful first actions:

- Try the app: https://avielcarlos.github.io/connectome-web/
- Read the current Path Feed proof page: https://avielcarlos.github.io/connectome-web/path-feed-momentum/
- Read the builder invitation and first-PR path: https://avielcarlos.github.io/connectome-web/connectome-builders/
- Open the Path Feed and give feedback on confusing or useful cards.
- Share one concrete critique or screenshot with context.
- Builders: pick one narrow issue and comment with your approach before opening a PR.

## Contribute and earn CP

Contribution Points recognise shipped work and help identify trusted builders.

| Contribution | CP range |
| --- | ---: |
| UI polish, docs, small bug | 25–75 CP |
| Good first issue / contained component | 75–200 CP |
| Product feature or agent UX integration | 200–600 CP |
| Major UX system, design architecture, growth engine | 600–1,500+ CP |

CP can support reputation, leaderboard placement, steward invitations, and governance signal as the DAO matures. CP does not promise cash, tokens, equity, profit share, or investment returns.

## Good first areas

- Build a shared design component kit: `PageHero`, `SectionCard`, `PrimaryCTA`.
- Add contextual Aura quick actions per page.
- Split Profile vs Admin/System routes for clearer information architecture.
- Improve IOO execution UX and agent progress states.
- Add developer onboarding analytics and contribution funnel tracking.
- Improve responsive polish for Path Feed-style daily surfaces.

## Local setup

```bash
git clone https://github.com/AvielCarlos/connectome-web.git
cd connectome-web
npm install
npm run dev
```

Useful checks:

```bash
npm run build
```

## Start contributing

1. Read [`CONTRIBUTING.md`](CONTRIBUTING.md).
2. Read [`docs/DEVELOPER_MISSION.md`](docs/DEVELOPER_MISSION.md).
3. Pick an issue labelled `good first issue`, `frontend`, `agent-dev`, `design`, or `growth`.
4. Comment with your intended approach.
5. Open a focused PR and mention the CP category you believe applies.

The bar is simple: make meaningful AI infrastructure feel usable, trustworthy, and alive.
