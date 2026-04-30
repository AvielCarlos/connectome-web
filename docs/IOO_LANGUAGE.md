# IOO Internal Language

This is Aura/Connectome internal ontology language. It is not ordinary user-facing UI copy unless explicitly translated into simple path/action language.

## Purpose

The IOO graph needs compact words for reasoning about human possibility without forcing users to manage the system's complexity. This language can evolve as the graph learns.

User-facing rule: users mostly clarify, decide, and act in real life. Aura handles the map.

## Core coordinates

### Scale

- `macro_micro_score`: canonical numeric scale from `0.0` to `1.0`.
  - `0.0` = most micro: exact place/link/time/activity/calendar/action.
  - `1.0` = most macro: ultimate state/domain such as enlightenment, fulfilment, vitality, freedom, love, contribution.
- `macro_micro_grade`: compact derived shorthand.
  - `A` = most micro.
  - `Z` = most macro.

Suggested bands:

- `A-D` — micro-node: concrete IRL/digital action.
- `E-H` — action cluster: a small set/session/sequence.
- `I-M` — pathway node: practice/project/learning path.
- `N-S` — domain capacity: vitality, contribution, adventure, relationship, wealth, skill.
- `T-Z` — macro state: fulfilment, freedom, enlightenment, integrated life condition.

## Node words

- **Seed** — a stable existing node in the graph.
- **Signal** — live world input: event, place, article, service, class, opportunity, weather, trend, user note.
- **Screen-card** — a temporary UI artifact that should become/attach to an IOO node.
- **Micro-node** — lowest actionable unit the user can actually do.
- **Bridge node** — a missing prerequisite/action that connects current state to a desired node.
- **Capacity node** — a capability that increases access to future possibilities.
- **Unlock node** — a node whose completion opens a new domain/path/state.
- **Macro node** — high-order state/capacity/domain.
- **Constellation** — a cluster of mutually reinforcing nodes across domains.

## Edge words

Use relation types that preserve meaning, not only `leads_to`:

- `contributes_to` — strengthens another node/domain.
- `unlocks_possibility` — opens access to a future node/domain/state.
- `prerequisite_for` — required before another node is realistic.
- `supports_domain` — improves a broad life domain.
- `feeds_macro_node` — small/meso node nourishes a macro state.
- `reinforces_state` — completion makes a user state more stable.
- `ab_variant_of` — alternative expression of the same underlying possibility.
- `bridge_to` — spans a gap between current user state and desired node.

## Domain reciprocity

- `iVive -> Aventi + Eviva`: vitality/learning/health/capacity enables adventure and contribution.
- `Eviva -> iVive + Aventi`: purpose/service/income/contribution unlocks vitality resources and freedom/adventure.
- `Aventi -> iVive + Eviva`: experience/travel/relationships/novelty restore vitality and open contribution paths.

## Internal naming pattern

A compact internal node descriptor can look like:

`<grade>:<primary-domain>:<node-kind>:<slug>`

Examples:

- `B:iVive:micro:read-physics-chapter-1`
- `J:Eviva:pathway:build-public-physics-explainer`
- `R:Aventi:capacity:location-independent-income`
- `Y:Core:macro:integrated-fulfilment`

Again: this is internal/debug/admin language. User copy should translate it into simple choices and real-world next steps.
