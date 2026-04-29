# Connectome Web — iDo/Ora AI OS Interface

Connectome Web is the user-facing surface for an AI OS for human flourishing. It is where Ora, iDo, the Connectome nervous system, and the Ascension Technologies DAO become understandable and usable for real people.

The app combines daily action, goals, routines, discovery, contribution, DAO visibility, and agentic assistance into a WeChat-like life OS experience.

## Why builders should care

This is a rare chance to shape the interface layer for an agentic AI ecosystem:

- **Frontend/design engineers** can turn complex AI systems into calm, practical product surfaces.
- **Agent developers** can expose Ora capabilities through contextual quick actions, overlays, and workflows.
- **Growth engineers** can improve onboarding, contribution loops, analytics, referrals, and activation.
- **Product engineers** can connect mission, CP rewards, DAO participation, and daily utility in one coherent experience.

Contributors earn Contribution Points (CP), leaderboard recognition, and a path toward founding steward status in the Ascension Technologies ecosystem.

## Architecture overview

```text
Connectome Web
├── React + Vite + TypeScript app
├── ConnectomeShell / AppLauncher      AI OS shell
├── OraOverlay                         contextual assistant layer
├── Pages                              goals, routines, feed, DAO, IOO, profile, contribution
├── Components                         reusable product surfaces
└── OraClient                          API client for Connectome backend
```

Ecosystem map:

- **Ora** — the AI brain and agent layer.
- **Connectome** — the AI OS / nervous system.
- **iDo** — the daily app experience.
- **Ascension Technologies** — DAO, CP, governance, and contributor ownership layer.

## Contribute and earn CP

Contribution Points recognise shipped work and help identify trusted builders.

| Contribution | CP range |
| --- | ---: |
| UI polish, docs, small bug | 25–75 CP |
| Good first issue / contained component | 75–200 CP |
| Product feature or agent UX integration | 200–600 CP |
| Major UX system, design architecture, growth engine | 600–1,500+ CP |

CP can support reputation, leaderboard placement, steward invitations, governance influence, and future upside as the DAO matures.

## Good first areas

- Build a shared design component kit: `PageHero`, `SectionCard`, `PrimaryCTA`.
- Add contextual Ora quick actions per page.
- Split Profile vs Admin/System routes for clearer information architecture.
- Improve IOO execution UX and agent progress states.
- Add developer onboarding analytics and contribution funnel tracking.
- Improve responsive polish for iDo-style daily surfaces.

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
