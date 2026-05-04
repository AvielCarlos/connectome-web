# Aura / iDo / Connectome UX Flow

## Product hierarchy

- **Ascension** = the DAO and mission ecosystem. It explains why the work matters, hosts contribution culture, and points people toward governance/community.
- **Aura** = the main user-facing intelligence brand: the shared AI personality, personalized per user. Aura clarifies, decides with the user, and guides real-world action.
- **Connectome** = the orchestration AIOS underneath Aura. It can be visible, but not overtly; ordinary users should not feel like they are operating infrastructure.
- **iDo / Path Feed** = the current path-building feed. It may remain the feed name, become a set of fulfilment interfaces, or evolve into the full life AIOS if testing/system coherence supports that.
- **IOO** = internal graph language. Users see Path Maps / Life Maps / tested front-end language, not raw IOO by default.

Public site (`web/atdao`) is the Ascension/DAO front door. GitHub Pages `connectome-web` remains the app surface until the domain strategy changes.

## Screen Graph principle

Connectome screens are not fixed destinations. A generated screen is a pathway node: a temporary interface between the user's current state, Aura's IOO possibility graph, and the execution layer.

This means UI work should assume:

- a page/card can clarify intent, route to another card, execute an action, or belong to an IOO node;
- screens should preserve enough metadata for Aura to learn why they were shown;
- transitions matter as much as the screen itself — what the screen leads to, requires, clarifies, or executes is part of the product;
- multiple possible paths can exist from point A to point B, and Aura may rank or reroute them over time.

Apps/domains such as **iVive**, **Eviva**, and **Aventi** are reusable modules/modes used by Aura to guide the user. They should bend around the user's path rather than behave like isolated apps with hard walls.

## Three-dimensional IOO neural graph principle

The IOO graph is not a flat list of categories. It should behave like a three-dimensional neural graph:

1. **Scale axis** — macro → meso → micro. Macro nodes are high-order states/domains such as enlightenment, fulfilment, vitality, contribution, freedom, love, Aventi/iVive/Eviva-scale life capacities. Micro nodes are the granular real-world actions that make macro states more likely to be experienced. Every node should carry an internal `macro_micro_score` from `0.0` (most granular/micro: exact action, place, link, calendar event) to `1.0` (most macro: ultimate state/domain such as enlightenment or fulfilment). A derived internal letter grade can shorthand this as **A = most micro** through **Z = most macro**. This is primarily graph metadata, not something to show ordinary users.
2. **Domain/contribution axis** — one action can contribute across domains. Example: reading a physics book may be an iVive learning/mental-fitness micro-node, serving an Eviva purpose of becoming capable enough to contribute, which may later unlock income and therefore Aventi possibilities.
3. **Unlock/state-transition axis** — nodes do not only “belong to” domains; they unlock new possibility states. A learned skill can unlock contribution; contribution can unlock money; money can unlock travel/adventure/freedom; all of that can feed higher macro nodes like fulfilment/enlightenment.

Edges should therefore express relations like `contributes_to`, `unlocks_possibility`, `prerequisite_for`, `supports_domain`, `feeds_macro_node`, and `reinforces_state`, not just `leads_to`.

The core life domains should be reciprocal, not siloed:

- **iVive → Aventi + Eviva**: vitality, health, learning, nervous-system capacity, and mental/physical fitness increase the person’s ability to adventure, explore, relate, create, and contribute.
- **Aventi → iVive + Eviva**: experience, travel, relationships, novelty, and real-world exploration can restore vitality and open contribution/service pathways.
- **Eviva → iVive + Aventi**: meaningful contribution, service, income creation, and purpose can unlock better vitality resources and greater freedom/adventure possibilities.

In the Path experience, users should be able to filter/focus the feed through three beautiful top tabs: **iVive** center-left, **Aventi** center, **Eviva** center-right.

A card/micro-node shown to the user should know which macro nodes it contributes to, which domains it crosses, and which future possibilities it may unlock. The user should experience a simple decision/action; Aura should maintain the multi-dimensional graph underneath.

## Background execution principle

Do not send users into other apps or websites unless absolutely necessary. Aura should use external apps, websites, APIs, browser automation, or virtual-machine workers in the background when that is the best way to fulfil the user's desire. The foreground experience should stay focused on the user's path: pull relevant external data/actions back into the current surface and present them as IOO Nodes, pathway sheets, or clear next-step outcomes.

The user should not be managing the system's workflow. Their primary job is to:

1. make decisions;
2. clarify what they want, what is true, and what constraints matter;
3. do the real-world action when Aura has reduced the path to something concrete.

Aura/Connectome should automatically handle planning scaffolding: prerequisite mapping, bridge-node discovery, search/research, option gathering, matching services/tools, scheduling suggestions, reminders, background execution, graph updates, and follow-up routing. If a screen is asking the user to maintain, configure, or sequence the machine's internal work, the UI is probably wrong.

The product should therefore prefer: **decision → clarification → IRL action**, with Aura quietly doing the connective tissue in between.

## Card-as-mini-app / micro-node principle

A card should usually behave like a mini-app for actually achieving the outcome or experience, not like a static content tile. The Path Feed itself should become a neural graph of progression, where feed nodes can move the user through choices, path-building, micro-node confirmation, scheduling/booking/starting, completion, and learning. A card should resolve the user downward through levels of agency:

1. **High-level decision** — what kind of outcome/experience/path does the user want?
2. **Mid-level decision** — which concrete option, provider, class, event, route, tutorial, person, or service is best?
3. **Micro-node confirmation** — the lowest real-world unit Aura can hand to the user.
4. **IRL execution** — the user does the thing, then Aura captures evidence/learning and routes the next step.

A **micro-node** should aim to include, when relevant:

- exact location, venue, URL, route, provider, class, tutorial, event, or booking link;
- exact activity to do, including micro-steps for workouts, learning sessions, practices, or routines;
- time selection or an existing external event time;
- real Calendar event creation when the time is user-selected rather than already fixed;
- friend/invite option when social execution would help;
- budget/funds fit confirmation or a free/low-cost alternative;
- transport/directions, weather/safety constraints, gear/prep checklist, and fallback option when useful;
- completion evidence to capture after action so IOO learns.

The purpose is not app navigation. The purpose is helping people fulfil their desires in a way that supports growth, integration, and ultimately enlightenment.

## Screen Pattern Library principle

Reusable screen patterns should behave like living UI memory, not a pile of templates. Aura can create or reuse a pattern, test small variants, reinforce the winners, and trim patterns that are stale, unused, or low-outcome.

Foundational lifecycle:

- **Create/reuse** patterns for recurring intents or pathway shapes.
- **Test variants** across layout, copy, ordering, and interaction mechanism.
- **Reinforce winners** when users reach clarity, completion, execution, or other positive outcomes.
- **Trim stale/unused/low-outcome patterns** so the library stays sharp and does not keep resurfacing weak experiences.

Pattern metadata should preserve enough lifecycle signal for pruning: `last_used_at`, `usage_count`, `success_score` / `outcome_score`, and deprecated/pruned state. Prefer soft-pruning over deletion so Aura can retain historical learning while avoiding reuse.

Primary feed responses are graph-learning signals:

- **Do Now** — user is ready for execution; strengthen execution/pathway edges and open the relevant action flow.
- **Do Later** — user wants the option but not now; save/schedule/resurface without treating it as rejection.
- **Not Interested** — down-rank or refine similar pathways for this user while preserving the broader graph.

## Current audit summary

### Confusing/broken patterns found

- Auth success and several internal links still used legacy routes (`/feed`, `/home`, `/dao`, `/contribute`) even though the app IA now lives under `/app/*`.
- `/app` had no canonical route; only `/` authenticated rendered the orientation screen.
- New users could finish onboarding on `/onboarding` and be left on an empty shell because the onboarding overlay hid itself without navigating onward.
- Home showed app names and ambient signals, but not the two real first choices: “I know what I want” vs “I need a suggestion.”
- The launcher used internal product labels first, which made it feel like architecture rather than user outcomes.
- CP was explained from feedback, but contribution screens did not surface the same explanation clearly.
- Profile/admin/system surfaces are mixed; they should remain reachable but not become a default path for ordinary users.

## Primary user journeys

### 1. First-time visitor → sign up → onboarding → home/feed

1. Public entry explains Ascension/Connectome/iDo at a high level.
2. User opens app and sees auth page: “iDo — your daily AI life app, guided by Aura.”
3. Registration goes to `/onboarding` when the onboarding experiment asks for it; otherwise it lands at `/app`.
4. Onboarding collects orientation signals.
5. Completion lands at `/app`.
6. `/app` asks the only important first question:
   - “I know what I want to do” → `/app/goals?clarify=1`
   - “I don’t know what I want to do” → `/app/ido`

### 2. Returning user → home → choose goal/discovery → feed/action

1. Login, OAuth callback, `/`, and `/app` land on the Connectome home/orientation screen.
2. If the user has intent, Goals opens focused and invites them to clarify with Aura.
3. If the user lacks intent, iDo opens the one-action feed.
4. Feed cards support save/rate/skip/detail and should embed goal-building or external-app context as IOO Nodes/pathway sheets before routing to another app.

### 3. User wants feedback → CP explainer → feedback submit

1. Global `?` feedback FAB is available in the shell.
2. Feedback modal answers “what do I send?” and “why would I do this?”
3. “What is CP?” opens the CP explainer.
4. Submit sends route, optional screenshot, category, and text; reward feedback is shown in toast.

### 4. User wants to contribute → DAO/contribute/GitHub

1. `/app/dao` explains DAO, CP, governance, proposals, leaderboard, and contribution status.
2. Primary CTA opens `/app/contribute`.
3. `/app/contribute` explains what contribution evidence is needed and links the CP explainer.
4. Code contributions require GitHub connection; GitHub callback returns to `/app/contribute?github=connected`.

### 5. User wants to understand CP/DAO/Ascension/Connectome/Aura/iDo

1. Public site = Ascension/DAO mission.
2. App home = short product hierarchy in the first screen.
3. DAO page = governance and contribution economy.
4. CP explainer = reward/reputation mechanism.
5. Aura overlay = contextual guide, not primary navigation.

## Route map

### Auth and callbacks

- `/` — unauthenticated auth page; authenticated Connectome/iDo home.
- `/auth/callback` — Google OAuth callback; stores auth and redirects to `/app`.
- `/auth/github-callback` — GitHub connection callback; redirects to `/app/contribute?github=connected`.
- `/onboarding` — authenticated Aura onboarding; completion redirects to `/app`.

### Authenticated app

- `/app` — Home/orientation screen.
- `/app/ido` — one-action feed/discovery.
- `/app/goals` — goals and Aura clarification.
- `/app/routines` — routines and habits.
- `/app/dao` — DAO, CP, proposals, governance, contribution overview.
- `/app/contribute` — submit contributions and sync GitHub.
- `/app/profile` — personal profile, settings, admin/system tools when available.
- `/app/services` — Ascension Technologies offerings/admin route, separate from ordinary Aura/iDo consumer flow.
- `/app/ioo` — Path Map user-facing view over the internal IOO graph.
- `/app/ivive` — vitality domain.
- `/app/eviva` — mission/service domain.
- `/surfaces/:surfaceId` — auth-gated generated surface.

### Backward-compatible redirects

- `/home` → `/app`
- `/feed`, `/discover`, `/journal` → `/app/ido`
- `/goals` → `/app/goals`
- `/routines` → `/app/routines`
- `/dao` → `/app/dao`
- `/contribute` → `/app/contribute`
- `/services` → `/app/services`
- `/profile` → `/app/profile`
- `/aura` (legacy `/ora`) → `/app`

## Screen purposes, first 5 seconds, CTAs

| Screen | Purpose | Must answer in 5 seconds | Primary CTA | Secondary CTA |
|---|---|---|---|---|
| Auth | Sign in/up to iDo/Aura | “This is my daily AI life app.” | Continue with Google / Sign in | Register |
| `/app` Home | Orient the user and route intent | “Choose goal clarification or discovery.” | Clarify with Aura | Open iDo feed |
| `/app/ido` | Present one next action | “Here is something I can do now.” | Act/save/rate card | Skip / make it a goal |
| `/app/goals` | Convert intent into structured path | “Tell Aura what you want.” | Start clarification | Pick a starter |
| `/app/dao` | Explain contribution economy/governance | “This is how the ecosystem is governed and rewarded.” | Open Contribute | Browse issues/proposals |
| `/app/contribute` | Submit evidence of work | “Submit concrete work and earn CP.” | Submit contribution | Connect GitHub / What is CP? |
| `/app/profile` | Identity, settings, system/admin | “This is my account and controls.” | Manage profile/settings | Open admin/system sections |
| `/app/services` | Tools and surfaces | “Use or generate Aura-powered tools.” | Open tool/surface | Ask Aura |
| `/app/ioo` | Semantic map | “This is Aura’s life graph.” | Explore map | Return to goals/iDo |
| `/app/ivive` | Vitality domain | “Improve energy/body/mind.” | Start vitality action | Ask Aura |
| `/app/eviva` | Mission/service domain | “Find meaningful contribution.” | Explore missions/services | Contribute |

## Navigation rules

- **Home is the orientation hub**: `/` when authenticated and `/app` both render it.
- **Dock is local navigation**: show the 4–5 most relevant neighbouring actions for the current app. Keep Aura centered/contextual where possible.
- **Launcher is global navigation**: hamburger opens all major surfaces using user-outcome labels, not internal architecture labels.
- **Aura overlay is contextual assistance**: use for questions, clarification, and routing help; do not make it the only way to move between screens.
- **Profile is identity/settings**: admin/dev/system tools may live there for now but should not be primary user navigation.
- **Legacy routes redirect** rather than render duplicate screens.

## Error, empty, and loading states

- **Auth**: show backend error; return to auth page after callback failure.
- **Onboarding**: if already complete, redirect to `/app`; if API fails, avoid trapping user in a blank shell.
- **Home**: static orientation should render without API dependency.
- **Feed**: loading should communicate that Aura is preparing actions; empty should offer goals and feedback.
- **Goals**: skeleton while loading; empty state invites starter or typed goal; failed Aura clarification should show toast.
- **DAO**: empty leaderboard/proposals explain what to do next, not just “none.”
- **Contribute**: unauthenticated submit disabled with sign-in copy; code contribution requires GitHub; success/error messages stay inline.
- **Feedback**: screenshot capture is optional; failed submit shows retryable error.

## First-pass implementation made with this spec

- Added canonical `/app` route.
- Auth login, OAuth callback, and onboarding completion now land on `/app`.
- GitHub callback now returns to `/app/contribute`.
- Cleaned app-internal legacy navigation links to `/app/*`.
- Reworked Home into the two-choice orientation screen.
- Changed launcher copy to user outcomes.
- Added CP explainer access from Contribute.

## Path Feed progression graph v2 — morphable variants

The integral implementation direction is that the Path Feed is not a passive TikTok clone. It is a neural progression graph that moves people from vague possibility into real-world fulfilment.

The graph should morph into tested versions of the same fulfilment loop:

- **baseline** — canonical feed → micro-node → evidence loop.
- **trimmed_decision** — trims friction when the card already has a concrete link or booking action.
- **split_micro_node** — splits the micro-node into clarify → choose concrete option → commit for higher-friction actions.
- **grown_social** — grows the graph with invite/share/follow-up nodes when belonging, contribution, or community matters.

Each variant keeps the same underlying pattern but can grow, split, or trim nodes. Promote variants when they improve Do Now rate, completion/evidence rate, post-action rating, or saved-node follow-through. Prune variants when they increase skips or add clarification friction.

Baseline progression nodes:

1. **Discover** — Aura surfaces a candidate opportunity/action from the graph.
2. **Focus** — user can filter/focus by iVive, Aventi, Eviva, or remain open.
3. **Choose path** — Aura compares possible routes/options and the user chooses the route worth testing.
4. **Confirm micro-node** — Aura collapses the path into a concrete action with time, budget, location, energy, prerequisites, and realistic next step.
5. **Commit** — user schedules, books, invites, opens, or starts; Aura handles scaffolding where possible.
6. **Do + prove** — user does the thing and captures evidence/reflection/completion signal.
7. **Learn / reroute** — Aura updates graph weights, user state, and the next recommendation.

Every feed card should carry `metadata.path_progression` with `ab_test_id`, `variant`, and `mutation` so responses can eventually update not only card ranking, but also the user-specific pathway graph and the winning morphology per domain/card/source.
