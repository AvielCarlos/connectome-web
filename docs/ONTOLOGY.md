# Connectome Ontology (v0.1 draft)

> Canonical, single source of truth for what each thing **is**, what it **isn't**,
> and how everything relates. Living document — changes go through review.
>
> Last updated: 2026-04-29

---

## 0. Why this exists

Connectome must remain coherent as it scales across apps, agents, surfaces, and contributors.
Without a shared ontology, the same word starts to mean different things in different files,
and the system drifts. This document anchors the language.

Three rules:

1. Every concept here has one meaning. If you need a new concept, add it; do not overload an existing one.
2. Boundaries matter. iDo is not Connectome. DAO is not iDo. Ora is not the OS.
3. Whenever something visible to users changes, ask: *what entity, relationship, layer, app, agent, permission, and feedback signal does this touch?*

---

## 1. Top-level layers

### Ascension Technologies — DAO / Governance / Community
- The people, the legal/structural shell, the ownership.
- Holds the mission, the DAO, CP/XP economics, and Eviva Universal (non-profit).
- Not a product. Not an app. The custodian.

### Connectome — AIOS infrastructure
- The nervous system: identity, memory, IOO Graph, agent runtime, attention engine, permissions, app SDK.
- Mostly invisible to end users.
- Backend: Railway / FastAPI / Postgres / vector store.
- Frontend: AIOS shell (web today; mobile/native later).

### Ora — Intelligence
- The agentic mind that runs through Connectome.
- Reasons across goals, constraints, memory, IOO Graph, signals.
- Surfaces: chat overlay, recommendations, attention layer, generated tools, agents.
- Not the OS. Lives inside the OS.

### IOO Graph — Map of human possibility
- Semantic graph of goals, needs, constraints, opportunities, skills, routines, missions, transformation paths.
- The "file system" of Connectome.
- Used by Ora to decide *what should this person do next*.

### Apps — Surfaces
- iDo, iVive, Eviva, Aventi, DAO, plus shared surfaces (Goals, Routines, Services, IOO Map, Profile).
- An app is a curated surface over the same identity, memory, graph, intelligence, and permissions.
- Apps do not own user data. Connectome does.

### Users — Humans
- One identity across the ecosystem.
- Have goals, constraints, history, social graph, contribution profile, vitality state.
- Sovereign over their data and permissions.

### Agents — Background processes
- Ora-spawned or scheduled processes that act on entities.
- Examples: outreach, growth, enrichment, executive council, IOO graph builder, experiment generator.
- Bound by permissions, safety levels, and the DAO governance layer.

---

## 2. Entity classes

Each entity has: name · purpose · key fields · lifecycle · who can create/read/update.

- **Person** — a human user. fields: id, identity, profile, preferences, privacy tier, permissions.
- **Goal** — a desired outcome. fields: title, domain (iVive | Eviva | Aventi), constraints, status, priority, parent_goal.
- **Need** — an underlying motivation behind a goal. fields: kind (vitality, meaning, belonging, mastery, etc.), salience.
- **Constraint** — anything blocking action. fields: kind (energy, money, time, location, skill, courage), severity.
- **Opportunity** — a real-world action a person could take now-ish. fields: domain, location, time, cost, fit_score, source.
- **Feed** — hybrid attention surface. Domain feeds can exist per app; iDo renders the blended daily meta-feed. fields: owner (domain | iDo), ranking_strategy, items, feedback.
- **Routine** — a small repeatable loop that supports a goal. fields: trigger, steps, cadence, supports_goals.
- **Event** — a real-world adventure/social moment. fields: time, place, social context, source (Aventi).
- **Mission** — meaningful Eviva work (volunteer, project, role, contribution). fields: org, scope, CP_reward, alignment.
- **Service / Product** — best-of recommendations curated by Eviva Discover. fields: category, source_quality, fit_score.
- **Skill** — capability tied to goals/missions. fields: level, evidence, transferable_to.
- **Role** — DAO/community role(s) a person holds. fields: title, scope, granted_by.
- **Community** — group context (DAO, guild, circle). fields: kind, scope, membership policy.
- **DAO Task** — a contributable unit of work in Ascension. fields: kind (code, content, ops, outreach, governance), CP_reward, gating.
- **Health Signal** — vitality/biometric/state input. fields: source, kind, value, time, confidence.
- **Memory** — user-visible learning/recall record. Framing is A/B tested as “Ora remembers...” vs “saved to your profile/OS memory.” fields: kind (fact, preference, story, lesson), salience, privacy_tier.
- **Agent** — background process. fields: id, role, schedule, scope, permissions, fitness, lineage.
- **App** — a visible surface inside the AIOS. fields: id, domain, dock, permissions, manifest.
- **Permission** — granted access to a domain. fields: domain (memory/calendar/location/health/social/dao/files/notifications), scope, expires_at.
- **Feedback Event** — anything users do that updates models. fields: kind (view, save, skip, complete, rate, abandon, react), target, value, context.
- **Experiment** — a live test. fields: name, variants, allocation, fitness_function, lineage, status.
- **Recommendation** — Ora's surfaced suggestion. fields: target_entity, reason, confidence, expires_at.
- **Notification** — attention-layer message. fields: trigger, app, urgency, channel, time_window.
- **Achievement / Milestone** — meaningful progress markers. fields: kind, evidence, awarded_at.

---

## 3. Relationships

Examples (canonical predicates):

- Person **has_goal** Goal
- Goal **expresses** Need
- Goal **blocked_by** Constraint
- Goal **requires_skill** Skill
- Goal **supported_by** Routine
- Goal **belongs_to_domain** {iVive | Eviva | Aventi}
- Opportunity **serves_need** Need
- Mission **earns_CP** DAO
- Event **fits** Goal | Need | Person
- App **renders_domain** Layer
- Agent **operates_on** Entity (with Permission)
- Feedback Event **updates_profile** Person
- Experiment **tests_variant** Surface | Recommendation
- iVive **unlocks_readiness_for** Eviva (prerequisite gating)
- DAO **governs** Connectome
- Connectome **hosts** App
- Ora **recommends** Goal | Routine | Mission | Event | Service | Action
- Feed **renders** Opportunity | Event | Mission | Routine | Service
- iDo Feed **blends** iVive Feed | Eviva Feed | Aventi Feed | DAO/Contribute Signals

---

## 4. Domains (the three pillars of fulfilment)

- **iVive 🌱** — Maintenance and growth of self: body, mind, soul, creativity, finances, habits.
- **Eviva 🌊** — Contributing to and receiving from the collective: work, missions, services, products, civic life.
- **Aventi 🚀** — What makes life feel alive: adventures, events, dating, friendships, spontaneity.

Rest is an **aspect of iVive**, not a separate domain. It surfaces through recovery/sleep optimization, biometrics-driven rest nudges, nervous-system regulation, and practical tools like Pomodoro/rest timers — all inside iVive.

iVive ↔ Eviva gating: Eviva opportunities can require iVive readiness; Ora spawns the bridge nodes.

---

## 5. Apps and their role

### Daily life cluster
- **iDo** — daily life surface. Feed, goals, routines, and the core decision mentality: **delegate it, plan it, or ditch it**.
- **Goals** and **Routines** — primarily iDo features. They also generate shared datapoints for other apps/interfaces.
- **Journal is scrapped as a primary app/surface.** Reflection may still exist as background memory capture or an Ora conversation mode, but the product mentality is action-oriented: delegate it, plan it, or ditch it.

### Domain apps
- **iVive** — vitality OS, including sleep, recovery, and rest as first-class aspects.
- **Eviva** — civilization-serving (Serve + Discover).
- **Aventi** — a domain of human activity and an external app we are developing. It lives at `aventi.app` now and eventually merges into the AIOS.

### System apps
- **DAO** — governance, contribution, CP/XP economics.
- **Services** — tools, integrations, Ora-generated surfaces.
- **IOO Map** — explorable view of the graph.
- **Profile** — single identity/permissions/sovereignty/stats app opened from the top-right corner across the AIOS.

### Boundaries
- iDo is **not** Connectome. iDo is the daily app rendered by Connectome.
- DAO is **not** part of iDo. DAO is its own app and lives in the launcher.
- Aventi exists at the app layer; experiences/events are entities Connectome owns regardless of which surface renders them.
- Goals/Routines are primarily iDo features but produce shared datapoints for other apps.
- Journal is not a core app. Do not add it to nav unless explicitly reintroduced.

---

## 6. Permissions

Domains:
- memory, calendar, location, health, social, dao, files, notifications.

Each permission is:
- granted explicitly by the user (Profile),
- scoped (which apps/agents can use it, and for what),
- revocable at any time,
- mapped to a privacy tier (standard / sensitive / minimal).

Every action by an app or agent must declare which permission domain it uses.

---

## 7. Evolution and feedback

Connectome is a living system:

- **Per-user adaptation**: Person profile updates from Feedback Events.
- **Product evolution**: Experiments score variants; safe ones auto-roll, bigger ones become tasks.
- **Agent evolution**: agents have fitness, lineage, partition/merge/spawn/retire policies.
- **Ontology evolution**: new entity classes, relationships, or domains require an `ONTOLOGY.md` update + review.

Safe-auto vs human-approved is defined per change kind (copy, weights, ranking → safe; new pages, payments, permissions, domain shifts → review).

---

## 8. Visible vs invisible language

- **User-facing**: Ora, iDo, iVive, Eviva, Aventi, DAO, Goals, Routines, Profile.
- **Architectural / internal / mission**: Connectome, IOO Graph, Agents, AIOS. Use Connectome silently for the most part; name it only when required to make the system make sense.
- **DAO / community-facing**: Ascension Technologies, CP, XP, Eviva Universal.

When in doubt: foreground purpose, hide infrastructure.

---

## 9. Feature gate

Every new feature must answer:

1. What entity does this create/read/update?
2. What relationship does it affect?
3. Which app(s) render it?
4. Which agent(s) can act on it?
5. Which permission domain(s) does it require?
6. Which feedback signal improves it?

If any answer is missing, the feature is not ready.

---

## 10. Decisions and remaining clarifications

### A. Aventi placement — DECIDED
Aventi is a domain of human activity and an external app we are developing. It remains external for v1, with deep links/shared identity over time, and eventually merges into the AIOS.

### B. iDo / Goals / Routines / Journal — DECIDED
Journal is scrapped as a primary app. The iDo mentality is **delegate it, plan it, or ditch it**. Goals and Routines are primarily iDo features, but they provide shared datapoints for other interfaces/apps.

### C. Feed ownership — DECIDED
The feed uses a **hybrid model**. Each domain can mature into its own feed/surface (iVive, Eviva, Aventi), while iDo renders the blended “What should I do next?” meta-feed. Ontologically: the attention engine belongs to Ora/Connectome infrastructure; the visible daily feed belongs to iDo.

### D. DAO / Contribute / Eviva overlap — DECIDED
Keep **DAO**, **Contribute**, and **Eviva** separate:

- **DAO** = governance, ownership, CP/XP, proposals, voting, contributor identity.
- **Contribute** = concrete workbench for ecosystem tasks people can claim/do.
- **Eviva** = world-facing meaningful work, missions, services, and products beyond the internal DAO.

DAO governs and rewards. Contribute routes internal ecosystem work. Eviva serves the broader world.

### E. Profile / Identity — DECIDED
Single Profile app/tab opened from the top-right corner across every app. It contains identity, permissions, sovereignty, stats, and eventually connected accounts.

### F. Connectome visibility — DECIDED
Keep Connectome silent for the most part. Use it only when required to make the architecture make sense (architecture docs, investor/partner language, deep product explanation, API/infrastructure contexts). Avoid it in ordinary app chrome/auth/user flows.

### G. Rest as an iVive aspect — DECIDED
Rest belongs inside iVive as a first-class aspect, not as a fourth domain. It surfaces through sleep/recovery optimization, biometric nudges, Pomodoro/rest timers, nervous-system regulation, and readiness checks.

### H. Memory framing — DECIDED AS EXPERIMENT
A/B test memory framing:
- “Ora remembers...”
- “Saved to your profile / OS memory...”
Use different framing by context and measure trust/resonance.

### I. Person vs Group — DECIDED FOR V1
Model individual people first. Future linking supports partners, family, friends, LinkedIn/Facebook connections, WhatsApp invites/messages, and shared goals/routines.


## 11. How to evolve this document

- Treat `ONTOLOGY.md` like a constitution. Don't edit casually.
- Open questions get **decisions**, not silent implementations.
- New entities: add a section in §2 plus relationships in §3 plus permission mapping in §6.
- Code references: any change here is mirrored in `src/runtime/ontology.ts` and backend schema notes.


## 2026-04-30 Alignment Update

- Public/user-facing intelligence brand: **Aura**. Legacy `Ora` can remain in code/API/storage compatibility surfaces until intentionally migrated.
- Main ordinary-user brand: **Aura**. **Connectome** may be visible, but should not dominate ordinary app chrome; it is primarily the orchestration AIOS underneath.
- **iDo** currently names the Path Feed, but can evolve into a broader fulfilment interface set or full life AIOS if that tests/systematizes best.
- **IOO** is internal language. Users see Path Maps / Life Maps / tested front-end language.
- **Rest** folds under **iVive** as a first-class aspect/mode, never a fourth top-level domain.
- **Nea services** are separate Ascension Technologies offerings, not part of ordinary Aura/Connectome/iDo consumer UX.
- Path top-domain filter direction: iVive center-left, Aventi center, Eviva center-right.
- Bottom nav baseline direction: Path, Goals, AURA, Routines, Profile; continuously test variants and retain only what drives return/use or is required for system functionality.
