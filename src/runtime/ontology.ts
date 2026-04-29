/**
 * Connectome Ontology (frontend runtime model — v0.1)
 *
 * Mirrors /Users/avielcarlos/.openclaw/workspace/ONTOLOGY.md
 *
 * This is the typed contract for everything we render and reason about
 * inside the AIOS shell. If you find yourself adding a new concept, update
 * ONTOLOGY.md first, then mirror it here.
 */

// ─── Domains ──────────────────────────────────────────────────────────────────
export type LifeDomain = 'iVive' | 'Eviva' | 'Aventi';

export const LIFE_DOMAINS: LifeDomain[] = ['iVive', 'Eviva', 'Aventi'];

// ─── Permissions ──────────────────────────────────────────────────────────────
export type PermissionDomain =
  | 'memory'
  | 'calendar'
  | 'location'
  | 'health'
  | 'social'
  | 'dao'
  | 'files'
  | 'notifications';

export type PrivacyTier = 'standard' | 'sensitive' | 'minimal';

export interface PermissionGrant {
  domain: PermissionDomain;
  scope: string[]; // e.g. ['ido', 'ora']
  privacyTier: PrivacyTier;
  expiresAt?: string;
}

// ─── Apps ────────────────────────────────────────────────────────────────────
export type AppId =
  | 'home'
  | 'ido'
  | 'goals'
  | 'routines'
  | 'ivive'
  | 'eviva'
  | 'aventi'
  | 'dao'
  | 'contribute'
  | 'services'
  | 'ioo'
  | 'profile';

export type AppCategory = 'daily' | 'domain' | 'system' | 'governance';
export type FeedOwner = 'ido_meta_feed' | 'ivive_domain_feed' | 'eviva_domain_feed' | 'aventi_domain_feed' | 'dao_signal_feed';

export interface AppManifestEntry {
  id: AppId;
  name: string;
  icon: string;
  path: string;
  category: AppCategory;
  domain?: LifeDomain;
  visibleToUser: boolean;
  external?: boolean;
  permissions: PermissionDomain[];
  description: string;
  purpose: string;
}

// ─── Core entity classes ──────────────────────────────────────────────────────
export interface Person {
  id: string;
  displayName?: string;
  email?: string;
  privacyTier: PrivacyTier;
  permissions: PermissionGrant[];
  domainsActive: LifeDomain[];
  linkedPeople?: LinkedPerson[]; // future: partners, family, friends, LinkedIn/Facebook/WA graph
}

export interface LinkedPerson {
  id: string;
  source: 'manual' | 'contacts' | 'whatsapp' | 'linkedin' | 'facebook';
  relationship?: 'partner' | 'family' | 'friend' | 'colleague' | 'connection';
  inviteStatus?: 'not_invited' | 'invited' | 'accepted';
}

export type ConstraintKind = 'energy' | 'money' | 'time' | 'location' | 'skill' | 'courage';

export interface Constraint {
  id: string;
  kind: ConstraintKind;
  severity: 'low' | 'medium' | 'high';
  notes?: string;
}

export type NeedKind =
  | 'vitality'
  | 'rest'
  | 'recovery'
  | 'meaning'
  | 'belonging'
  | 'mastery'
  | 'safety'
  | 'play'
  | 'recognition'
  | 'autonomy';

export interface Need {
  id: string;
  kind: NeedKind;
  salience: number; // 0–1
}

export interface Goal {
  id: string;
  title: string;
  domain: LifeDomain;
  parentGoalId?: string;
  status: 'open' | 'active' | 'paused' | 'done' | 'dropped';
  priority: number;
  expressesNeeds: string[]; // Need.id[]
  blockedBy: string[]; // Constraint.id[]
  requiresSkills: string[]; // Skill.id[]
  supportedByRoutines: string[]; // Routine.id[]
}

export interface Routine {
  id: string;
  title: string;
  description: string;
  trigger: string;
  cadence?: 'daily' | 'weekly' | 'on_signal' | 'as_needed';
  steps: string[];
  supportsGoals: string[]; // Goal.id[]
  permissions: PermissionDomain[];
}

export interface ActionDecision {
  id: string;
  targetEntity: { kind: string; id: string };
  decision: 'delegate' | 'plan' | 'ditch';
  delegatedTo?: 'ora' | 'agent' | 'person';
  planId?: string;
  reason?: string;
}

export interface Opportunity {
  id: string;
  title: string;
  domain: LifeDomain;
  location?: string;
  timeWindow?: { start: string; end?: string };
  cost?: { amount: number; currency: string };
  servesNeeds: string[]; // Need.id[]
  fitScore?: number; // 0–1
  source?: 'ido_feed' | 'domain_feed' | 'aventi' | 'eviva' | 'ivive' | 'dao' | 'ora' | 'partner';
}

export interface FeedSurface {
  id: string;
  owner: FeedOwner;
  visibleInApp: AppId;
  rankingStrategy: 'what_should_i_do_next' | 'domain_readiness' | 'mission_fit' | 'experience_fit' | 'governance_signal';
  blendsOwners?: FeedOwner[];
  itemKinds: Array<'Opportunity' | 'Event' | 'Mission' | 'Routine' | 'Service' | 'DaoTask'>;
}

export interface Event {
  id: string;
  title: string;
  start: string;
  end?: string;
  place?: string;
  social?: { withPersonIds?: string[]; openToFriends?: boolean };
  fitsGoals?: string[];
}

export interface Mission {
  id: string;
  title: string;
  org?: string;
  scope?: string;
  cpReward?: number;
  alignmentNotes?: string;
}

export interface Skill {
  id: string;
  name: string;
  level: 'novice' | 'developing' | 'proficient' | 'expert';
  evidence?: string[];
}

export interface Role {
  id: string;
  title: string;
  scope: 'community' | 'dao' | 'project' | 'org';
  grantedBy?: string;
}

export interface Community {
  id: string;
  name: string;
  kind: 'dao' | 'guild' | 'circle' | 'group';
  membershipPolicy?: 'open' | 'invite' | 'application' | 'role-gated';
}

export interface DaoTask {
  id: string;
  kind: 'code' | 'content' | 'ops' | 'outreach' | 'governance' | 'design' | 'research';
  title: string;
  cpReward: number;
  gating?: string[];
}

export interface HealthSignal {
  id: string;
  source: 'manual' | 'wearable' | 'inferred' | 'ora';
  kind: 'energy' | 'sleep' | 'mood' | 'recovery' | 'focus' | 'rest' | 'pomodoro' | 'biomarker';
  value: number;
  unit?: string;
  recordedAt: string;
  confidence?: number;
}

export type MemoryKind = 'fact' | 'preference' | 'story' | 'lesson' | 'commitment';
export type MemoryFraming = 'ora_remembers' | 'profile_memory';

export interface MemoryRecord {
  id: string;
  kind: MemoryKind;
  text: string;
  framing?: MemoryFraming; // A/B: 'Ora remembers...' vs profile/OS memory framing
  salience: number;
  privacyTier: PrivacyTier;
  recordedAt: string;
}

export interface AgentDescriptor {
  id: string;
  name: string;
  role: string;
  schedule?: string; // cron-style or human-readable
  scope: string[]; // entity kinds it can act on
  permissions: PermissionDomain[];
  fitness?: number;
  lineage?: { parent?: string; generation?: number };
}

export type FeedbackKind =
  | 'delegate'
  | 'plan'
  | 'ditch'
  | 'view'
  | 'save'
  | 'skip'
  | 'complete'
  | 'rate'
  | 'abandon'
  | 'react'
  | 'comment'
  | 'share'
  | 'invite';

export interface FeedbackEvent {
  id: string;
  kind: FeedbackKind;
  targetEntity: { kind: string; id: string };
  value?: number;
  context?: Record<string, unknown>;
  recordedAt: string;
}

export interface Experiment {
  id: string;
  name: string;
  variants: string[];
  allocation: Record<string, number>; // variant -> 0..1
  fitnessFunction: string;
  parentExperiment?: string;
  generation?: number;
  status: 'draft' | 'live' | 'paused' | 'won' | 'lost' | 'retired';
}

export interface Recommendation {
  id: string;
  targetEntity: { kind: string; id: string };
  reason: string;
  confidence: number;
  expiresAt?: string;
}

export interface NotificationItem {
  id: string;
  appId: AppId;
  trigger: string;
  urgency: 'now' | 'today' | 'soon' | 'ambient';
  channel: 'in-app' | 'push' | 'email' | 'voice';
  windowStart?: string;
  windowEnd?: string;
}

// ─── Relationships (canonical predicates) ─────────────────────────────────────
export type RelationshipKind =
  | 'has_goal'
  | 'expresses'
  | 'blocked_by'
  | 'requires_skill'
  | 'supported_by'
  | 'belongs_to_domain'
  | 'serves_need'
  | 'earns_cp'
  | 'fits'
  | 'renders_domain'
  | 'operates_on'
  | 'updates_profile'
  | 'tests_variant'
  | 'unlocks_readiness_for'
  | 'governs'
  | 'hosts'
  | 'recommends'
  | 'renders'
  | 'blends';

export interface OntologyRelationship {
  kind: RelationshipKind;
  fromKind: string;
  toKind: string;
  description: string;
}

export const ONTOLOGY_RELATIONSHIPS: OntologyRelationship[] = [
  { kind: 'has_goal', fromKind: 'Person', toKind: 'Goal', description: 'A person owns one or more goals.' },
  { kind: 'expresses', fromKind: 'Goal', toKind: 'Need', description: 'A goal expresses one or more underlying needs.' },
  { kind: 'blocked_by', fromKind: 'Goal', toKind: 'Constraint', description: 'A goal can be blocked by constraints.' },
  { kind: 'requires_skill', fromKind: 'Goal', toKind: 'Skill', description: 'A goal can require specific skills.' },
  { kind: 'supported_by', fromKind: 'Goal', toKind: 'Routine', description: 'Routines support goals.' },
  { kind: 'belongs_to_domain', fromKind: 'Goal', toKind: 'LifeDomain', description: 'A goal belongs to a life domain.' },
  { kind: 'serves_need', fromKind: 'Opportunity', toKind: 'Need', description: 'Opportunities serve user needs.' },
  { kind: 'earns_cp', fromKind: 'Mission', toKind: 'Dao', description: 'Missions earn CP in the DAO.' },
  { kind: 'fits', fromKind: 'Event', toKind: 'Goal', description: 'An event can fit a goal/need/person.' },
  { kind: 'renders_domain', fromKind: 'App', toKind: 'LifeDomain', description: 'Apps render life domains.' },
  { kind: 'operates_on', fromKind: 'Agent', toKind: 'Entity', description: 'Agents operate on entities under permission.' },
  { kind: 'updates_profile', fromKind: 'FeedbackEvent', toKind: 'Person', description: 'Feedback updates the user profile.' },
  { kind: 'tests_variant', fromKind: 'Experiment', toKind: 'Surface', description: 'Experiments test variants of surfaces or recommendations.' },
  { kind: 'unlocks_readiness_for', fromKind: 'iVive', toKind: 'Eviva', description: 'iVive readiness unlocks Eviva opportunities.' },
  { kind: 'governs', fromKind: 'Dao', toKind: 'Connectome', description: 'The DAO governs Connectome.' },
  { kind: 'hosts', fromKind: 'Connectome', toKind: 'App', description: 'Connectome hosts apps.' },
  { kind: 'recommends', fromKind: 'Ora', toKind: 'Entity', description: 'Ora recommends entities to a person.' },
  { kind: 'renders', fromKind: 'FeedSurface', toKind: 'Entity', description: 'A feed renders opportunities, events, missions, routines, services, and DAO signals.' },
  { kind: 'blends', fromKind: 'iDoFeed', toKind: 'DomainFeed', description: 'iDo blends domain feeds into the daily what-should-I-do-next meta-feed.' },
];

export const FEED_SURFACES: FeedSurface[] = [
  {
    id: 'ido-meta-feed',
    owner: 'ido_meta_feed',
    visibleInApp: 'ido',
    rankingStrategy: 'what_should_i_do_next',
    blendsOwners: ['ivive_domain_feed', 'eviva_domain_feed', 'aventi_domain_feed', 'dao_signal_feed'],
    itemKinds: ['Opportunity', 'Event', 'Mission', 'Routine', 'Service', 'DaoTask'],
  },
  { id: 'ivive-feed', owner: 'ivive_domain_feed', visibleInApp: 'ivive', rankingStrategy: 'domain_readiness', itemKinds: ['Routine', 'Opportunity'] },
  { id: 'eviva-feed', owner: 'eviva_domain_feed', visibleInApp: 'eviva', rankingStrategy: 'mission_fit', itemKinds: ['Mission', 'Service', 'Opportunity'] },
  { id: 'aventi-feed', owner: 'aventi_domain_feed', visibleInApp: 'aventi', rankingStrategy: 'experience_fit', itemKinds: ['Event', 'Opportunity'] },
  { id: 'dao-signal-feed', owner: 'dao_signal_feed', visibleInApp: 'dao', rankingStrategy: 'governance_signal', itemKinds: ['DaoTask', 'Mission'] },
];

// ─── App manifest (visible/invisible boundaries) ──────────────────────────────
export const APP_MANIFEST: AppManifestEntry[] = [
  {
    id: 'ido',
    name: 'iDo',
    icon: '🚀',
    path: '/app/ido',
    category: 'daily',
    visibleToUser: true,
    permissions: ['memory', 'notifications', 'social', 'calendar', 'location'],
    description: 'Daily life surface: feed, goals, routines, social signal, and delegate/plan/ditch decisions.',
    purpose: 'Renders the next best life action in a swipeable, doable daily form; helps the user delegate it, plan it, or ditch it.',
  },
  {
    id: 'ivive',
    name: 'iVive',
    icon: '🌱',
    path: '/app/ivive',
    category: 'domain',
    domain: 'iVive',
    visibleToUser: true,
    permissions: ['health', 'memory', 'notifications'],
    description: 'Vitality OS: body, mind, soul, creativity, finances, habits, sleep, rest, and recovery.',
    purpose: 'Maintains and grows the human substrate, including recovery/readiness tools like sleep optimization and Pomodoro-style rest loops.',
  },
  {
    id: 'eviva',
    name: 'Eviva',
    icon: '🌊',
    path: '/app/eviva',
    category: 'domain',
    domain: 'Eviva',
    visibleToUser: true,
    permissions: ['memory', 'dao', 'notifications'],
    description: 'Civilization-serving: missions, services, products, civic life.',
    purpose: 'Connects people to world-facing meaningful work, missions, products, and services beyond the internal DAO.',
  },
  {
    id: 'aventi',
    name: 'Aventi',
    icon: '🎉',
    path: 'https://aventi.app',
    category: 'domain',
    domain: 'Aventi',
    visibleToUser: true,
    external: true,
    permissions: ['location', 'social', 'calendar'],
    description: 'Adventures, events, dating, friendships, spontaneity.',
    purpose: 'External domain app for what makes life feel alive; eventually merges into the AIOS while sharing identity/IOO data over time.',
  },
  {
    id: 'goals',
    name: 'Goals',
    icon: '🎯',
    path: '/app/goals',
    category: 'daily',
    visibleToUser: true,
    permissions: ['memory', 'notifications'],
    description: 'Primarily iDo feature: living quests across all three domains, also producing shared datapoints for other apps.',
    purpose: 'Turns desires into structured goals with constraints, paths, and routines for the delegate/plan/ditch loop.',
  },
  {
    id: 'routines',
    name: 'Routines',
    icon: '⚙️',
    path: '/app/routines',
    category: 'daily',
    visibleToUser: true,
    permissions: ['memory', 'calendar', 'health', 'notifications'],
    description: 'Primarily iDo feature: goal-achievement subroutines that other apps can read as shared datapoints.',
    purpose: 'Makes becoming automatic by running small, repeatable loops across domains.',
  },
  {
    id: 'dao',
    name: 'DAO',
    icon: '🏛️',
    path: '/app/dao',
    category: 'governance',
    visibleToUser: true,
    permissions: ['dao', 'social', 'notifications'],
    description: 'Governance, ownership, CP/XP, proposals, voting, and contributor identity.',
    purpose: 'Governs the ecosystem and rewards contribution without becoming the workbench itself.',
  },
  {
    id: 'contribute',
    name: 'Contribute',
    icon: '🤝',
    path: '/app/contribute',
    category: 'governance',
    visibleToUser: true,
    permissions: ['dao', 'files', 'notifications'],
    description: 'Internal ecosystem workbench: build, improve, review, earn CP.',
    purpose: 'Routes concrete ecosystem tasks to people who can do them; DAO governs and rewards the work.',
  },
  {
    id: 'services',
    name: 'Services',
    icon: '🛠️',
    path: '/app/services',
    category: 'system',
    visibleToUser: true,
    permissions: ['files', 'memory'],
    description: 'Tools, integrations, Ora-generated surfaces.',
    purpose: 'Lets Ora create or connect tools around the user’s current path.',
  },
  {
    id: 'ioo',
    name: 'IOO Map',
    icon: '🧬',
    path: '/app/ioo',
    category: 'system',
    visibleToUser: true,
    permissions: ['memory', 'dao'],
    description: 'Explorable view of the IOO Graph.',
    purpose: 'Exposes the semantic graph Ora uses to decide what matters next.',
  },
  {
    id: 'profile',
    name: 'Profile',
    icon: '👤',
    path: '/app/profile',
    category: 'system',
    visibleToUser: true,
    permissions: ['memory', 'notifications'],
    description: 'Single top-right identity, permissions, sovereignty, stats, and connected accounts surface.',
    purpose: 'Gives the user control over who Ora thinks they are and what the OS may access.',
  },
];

export function appById(id: AppId): AppManifestEntry | undefined {
  return APP_MANIFEST.find((a) => a.id === id);
}
