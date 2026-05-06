import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AuraClient, Goal } from '../lib/AuraClient';
import { useToast } from '../components/Toast';
import { useExperiment } from '../lib/useExperiment';
import GoalClarifyModal from '../components/GoalClarifyModal';
import { PathLimitSheet } from '../components/PathLimitSheet';

type Lens = 'active' | 'paths' | 'saved' | 'done' | 'all';

const DOMAIN_CONFIG: Record<string, { emoji: string; color: string; label: string }> = {
  iVive: { emoji: '🌱', color: '#10b981', label: 'Self / capacity' },
  Eviva: { emoji: '🌊', color: '#6366f1', label: 'Contribution' },
  Aventi: { emoji: '🚀', color: '#f59e0b', label: 'Experience' },
};

const STARTERS = [
  { title: 'Build the body and energy I need', tag: 'capacity', domain: 'iVive' },
  { title: 'Find meaningful work or contribution', tag: 'mission', domain: 'Eviva' },
  { title: 'Make life feel more alive', tag: 'experience', domain: 'Aventi' },
  { title: 'Turn a vague desire into a real path', tag: 'clarify', domain: 'iVive' },
];

function domainConfig(domain?: string) {
  const normalized = domain === 'Rest' ? 'iVive' : domain; // legacy Rest maps into iVive; Rest is an iVive aspect.
  return DOMAIN_CONFIG[normalized || ''] || { emoji: '◈', color: '#00d4aa', label: 'Path' };
}

function progressFor(goal: Goal) {
  const steps = goal.steps || [];
  if (!steps.length) return goal.progress || 0;
  return steps.filter((s) => s.completed).length / steps.length;
}

function nextStep(goal: Goal) {
  return (goal.steps || []).find((s) => !s.completed) || goal.steps?.[0] || null;
}

function stateFor(goal: Goal) {
  if (goal.status === 'completed' || progressFor(goal) >= 1) return 'integrated';
  if (!goal.steps?.length) return 'seed';
  if (progressFor(goal) > 0) return 'moving';
  return 'mapped';
}

function stateCopy(state: string) {
  if (state === 'seed') return 'Intention spark';
  if (state === 'mapped') return 'Measurable goal';
  if (state === 'moving') return 'Steps underway';
  return 'Achieved';
}

function goalCurrentState(goal: Goal) {
  return goal.graph_metadata?.current_state || goal.graph_metadata?.current_state_text || 'Where you are now';
}

function goalDesiredState(goal: Goal) {
  return goal.graph_metadata?.desired_state || goal.graph_metadata?.desired_state_text || goal.measurable_outcome || goal.title;
}

function DesiredStateCompass({ goals }: { goals: Goal[] }) {
  const active = goals.filter((g) => g.status === 'active');
  const primary = active[0];
  const mapped = active.filter((g) => g.measurable_outcome || g.graph_metadata?.desired_state).length;
  const moving = active.filter((g) => progressFor(g) > 0).length;
  const cfg = domainConfig(primary?.domain);
  return (
    <div style={{ border: '1px solid rgba(0,212,170,0.18)', background: 'linear-gradient(135deg, rgba(0,212,170,0.08), rgba(99,102,241,0.06))', borderRadius: 26, padding: 16, margin: '0 0 16px' }}>
      <div style={{ color: '#00d4aa', fontSize: 11, fontWeight: 950, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Desired-state vector</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 10, alignItems: 'center' }}>
        <div style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.18)', borderRadius: 18, padding: 12 }}>
          <div style={{ color: 'rgba(248,248,252,0.38)', fontSize: 10, fontWeight: 900, textTransform: 'uppercase' }}>Current state</div>
          <div style={{ color: '#f8f8fc', fontSize: 13, lineHeight: 1.45, marginTop: 5 }}>{primary ? goalCurrentState(primary) : 'No active state captured yet'}</div>
        </div>
        <div style={{ color: cfg.color, fontSize: 22, fontWeight: 950 }}>→</div>
        <div style={{ border: `1px solid ${cfg.color}28`, background: `${cfg.color}10`, borderRadius: 18, padding: 12 }}>
          <div style={{ color: cfg.color, fontSize: 10, fontWeight: 900, textTransform: 'uppercase' }}>Desired state</div>
          <div style={{ color: '#f8f8fc', fontSize: 13, lineHeight: 1.45, marginTop: 5 }}>{primary ? goalDesiredState(primary) : 'Capture a spark to define the destination'}</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
        <span style={{ color: 'rgba(248,248,252,0.48)', fontSize: 11, fontWeight: 800 }}>{active.length} active intention{active.length === 1 ? '' : 's'}</span>
        <span style={{ color: 'rgba(248,248,252,0.48)', fontSize: 11, fontWeight: 800 }}>{mapped} desired-state vector{mapped === 1 ? '' : 's'} mapped</span>
        <span style={{ color: 'rgba(248,248,252,0.48)', fontSize: 11, fontWeight: 800 }}>{moving} already moving</span>
      </div>
    </div>
  );
}

function WeeklyRecapCard() {
  const [recap, setRecap] = useState<any>(null);
  useEffect(() => {
    AuraClient.getWeeklyRecap().then(setRecap).catch(() => setRecap(null));
  }, []);
  if (!recap) return null;
  const stats = [
    { label: 'XP', value: recap.total_xp },
    { label: 'Goals done', value: recap.goals_completed },
    { label: 'Journal', value: recap.journal_entries },
    { label: 'Saved nodes', value: recap.saved_nodes },
  ];
  return (
    <section style={{ border: '1px solid rgba(0,212,170,0.2)', background: 'linear-gradient(135deg, rgba(0,212,170,0.09), rgba(255,255,255,0.035))', borderRadius: 26, padding: 16, margin: '0 0 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
        <div>
          <div style={{ color: '#00d4aa', fontSize: 11, fontWeight: 950, letterSpacing: 1, textTransform: 'uppercase' }}>Weekly progress recap</div>
          <div style={{ color: '#f8f8fc', fontSize: 18, fontWeight: 950, marginTop: 5 }}>Your graph moved this week</div>
        </div>
        {!!recap.current_streak && <div style={{ color: '#00d4aa', fontWeight: 950, background: 'rgba(0,212,170,0.12)', borderRadius: 999, padding: '7px 10px', fontSize: 12 }}>🔥 {recap.current_streak}d</div>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 12 }}>
        {stats.map((s) => <div key={s.label} style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.18)', borderRadius: 16, padding: 10 }}><div style={{ color: '#f8f8fc', fontWeight: 950 }}>{s.value}</div><div style={{ color: 'rgba(248,248,252,0.42)', fontSize: 10, fontWeight: 850, textTransform: 'uppercase' }}>{s.label}</div></div>)}
      </div>
      <ul style={{ margin: '12px 0 0', paddingLeft: 18, color: 'rgba(248,248,252,0.68)', fontSize: 13, lineHeight: 1.55 }}>
        {(recap.highlights || []).slice(0, 3).map((h: string) => <li key={h}>{h}</li>)}
      </ul>
      <div style={{ marginTop: 10, color: 'rgba(0,212,170,0.78)', fontSize: 12, fontWeight: 800 }}>{recap.next_prompt}</div>
    </section>
  );
}

function isAuraManagedNode(node: any) {
  const haystack = [node.owner, node.node_type, node.step_type, node.title, node.description]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return node.owner === 'aura'
    || haystack.includes('aura')
    || haystack.includes('aura')
    || haystack.includes('map prerequisite')
    || haystack.includes('bridge node')
    || haystack.includes('find real options')
    || haystack.includes('search for concrete')
    || haystack.includes('set the attainable target');
}

function userActionNodes(path: any[]) {
  const nodes = (path || []).filter((node) => !isAuraManagedNode(node));
  return nodes.length ? nodes : (path || []).filter((node) => node.user_action || node.owner !== 'aura');
}

function UserStateStrip({ goals }: { goals: Goal[] }) {
  const active = goals.filter((g) => g.status === 'active');
  const mapped = active.filter((g) => g.steps?.length).length;
  const moving = active.filter((g) => progressFor(g) > 0 && progressFor(g) < 1).length;
  const done = goals.filter((g) => g.status === 'completed').length;
  const strongest = active[0]?.domain || 'IOO';
  const cfg = domainConfig(strongest);

  const cells = [
    ['Intention sparks', active.length],
    ['Measurable goals', mapped],
    ['Steps underway', moving],
    ['Achieved', done],
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 8, margin: '16px 0 18px' }}>
      {cells.map(([label, value]) => (
        <div key={label} style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.035)', borderRadius: 18, padding: '12px 10px' }}>
          <div style={{ color: '#f8f8fc', fontWeight: 950, fontSize: 18 }}>{value}</div>
          <div style={{ color: 'rgba(248,248,252,0.42)', fontWeight: 750, fontSize: 10, lineHeight: 1.2 }}>{label}</div>
        </div>
      ))}
      <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 9, color: 'rgba(248,248,252,0.52)', fontSize: 12, padding: '0 2px' }}>
        <span style={{ color: cfg.color }}>{cfg.emoji}</span>
        Intentions are the spark and fuel. Aura turns them into specific, measurable, attainable goals — then maps the system work in the background and shows the steps you can actually do.
      </div>
    </div>
  );
}

function CaptureBar({ onClarify }: { onClarify: (title: string) => void }) {
  const [title, setTitle] = useState('');
  const [focused, setFocused] = useState(false);
  const [searchParams] = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);
  const handledDeepLinkRef = useRef('');
  const { variant, trackEvent } = useExperiment('goals_input_placeholder');
  const placeholders: Record<string, string> = {
    A: 'Add an intention — Aura will make it measurable…',
    B: 'What spark should become a real goal?',
    C: 'Capture a desire to turn into steps…',
    D: 'Tell Aura the direction — she will make it achievable',
  };

  useEffect(() => {
    const deepLinkedTitle = (searchParams.get('intent') || searchParams.get('goal') || searchParams.get('title') || '').trim().slice(0, 180);
    const shouldClarify = searchParams.get('clarify') === '1';

    if (deepLinkedTitle) {
      if (shouldClarify && handledDeepLinkRef.current !== deepLinkedTitle) {
        handledDeepLinkRef.current = deepLinkedTitle;
        onClarify(deepLinkedTitle);
        setTitle('');
        setFocused(false);
        return;
      }
      setTitle((current) => current || deepLinkedTitle);
    }

    if (searchParams.get('focus') === 'true' || shouldClarify) {
      setTimeout(() => { inputRef.current?.focus(); setFocused(true); }, 150);
    }
  }, [searchParams, onClarify]);

  const submit = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    trackEvent('goal_collection_capture_started', 1);
    onClarify(trimmed);
    setTitle('');
    setFocused(false);
  };

  return (
    <div style={{ borderRadius: 24, padding: 3, background: focused ? 'linear-gradient(135deg, rgba(0,212,170,0.42), rgba(99,102,241,0.28))' : 'rgba(255,255,255,0.08)', marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', borderRadius: 21, background: 'rgba(10,10,18,0.94)', border: '1px solid rgba(255,255,255,0.05)' }}>
        <span style={{ color: '#00d4aa', fontSize: 18 }}>＋</span>
        <input
          ref={inputRef}
          value={title}
          onFocus={() => setFocused(true)}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') { setTitle(''); setFocused(false); } }}
          placeholder={placeholders[variant] || placeholders.A}
          style={{ flex: 1, background: 'transparent', border: 0, outline: 0, color: '#f8f8fc', fontSize: 15, minWidth: 0 }}
        />
        <button onClick={submit} disabled={!title.trim()} style={{ border: 0, borderRadius: 999, minWidth: 42, height: 34, background: title.trim() ? '#00d4aa' : 'rgba(255,255,255,0.08)', color: title.trim() ? '#06110f' : 'rgba(248,248,252,0.28)', fontWeight: 950 }}>→</button>
      </div>
    </div>
  );
}

function StarterRail({ onClarify }: { onClarify: (title: string) => void }) {
  return (
    <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6, marginBottom: 14 }}>
      {STARTERS.map((starter) => {
        const cfg = domainConfig(starter.domain);
        return (
          <button key={starter.title} onClick={() => onClarify(starter.title)} style={{ flex: '0 0 210px', textAlign: 'left', border: `1px solid ${cfg.color}24`, borderRadius: 20, padding: 14, background: 'rgba(255,255,255,0.035)', color: '#f8f8fc' }}>
            <div style={{ color: cfg.color, fontWeight: 900, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>{cfg.emoji} {starter.tag}</div>
            <div style={{ fontWeight: 850, fontSize: 14, lineHeight: 1.35 }}>{starter.title}</div>
          </button>
        );
      })}
    </div>
  );
}

function LensTabs({ lens, setLens, counts }: { lens: Lens; setLens: (l: Lens) => void; counts: Record<Lens, number> }) {
  const tabs: Array<[Lens, string]> = [['active', 'Sparks'], ['paths', 'Goals'], ['saved', 'Unmapped'], ['done', 'Achieved'], ['all', 'All']];
  return (
    <div style={{ display: 'flex', gap: 8, overflowX: 'auto', margin: '8px 0 16px', paddingBottom: 4 }}>
      {tabs.map(([id, label]) => (
        <button key={id} onClick={() => setLens(id)} style={{ flex: '0 0 auto', border: lens === id ? '1px solid rgba(0,212,170,0.58)' : '1px solid rgba(255,255,255,0.08)', background: lens === id ? 'rgba(0,212,170,0.13)' : 'rgba(255,255,255,0.035)', color: lens === id ? '#dffcf6' : 'rgba(248,248,252,0.56)', borderRadius: 999, padding: '9px 13px', fontSize: 12, fontWeight: 850 }}>
          {label} <span style={{ opacity: 0.55 }}>{counts[id]}</span>
        </button>
      ))}
    </div>
  );
}

function GoalCard({ goal, onUpdate, onDelete, onOpenFeed }: { goal: Goal; onUpdate: (g: Goal) => void; onDelete: (id: string) => void; onOpenFeed: (goal: Goal) => void }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [auraReply, setAuraReply] = useState('');
  const [currentState, setCurrentState] = useState(goalCurrentState(goal));
  const [desiredState, setDesiredState] = useState(goalDesiredState(goal));
  const { show } = useToast();
  const cfg = domainConfig(goal.domain);
  const progress = progressFor(goal);
  const step = nextStep(goal);
  const state = stateFor(goal);
  const intention = goal.intention_text || goal.graph_metadata?.intention_text;
  const measurable = goal.measurable_outcome || goal.graph_metadata?.measurable_outcome || goal.title;
  const metricLine = [goal.success_metric, goal.target_value, goal.target_date].filter(Boolean).join(' • ');
  const auraManagedCount = goal.graph_metadata?.aura_managed_nodes?.length || goal.graph_metadata?.aura_nodes?.length || 0;

  const breakdown = async () => {
    setBusy('breakdown');
    try {
      const updated = await AuraClient.breakdownGoal(goal.id);
      onUpdate(updated);
      setOpen(true);
      show('Aura made this measurable and mapped steps.', 'success');
    } finally { setBusy(null); }
  };

  const toggleStep = async (index: number) => {
    const steps = (goal.steps || []).map((s, i) => i === index ? { ...s, completed: !s.completed } : s);
    const updated = await AuraClient.updateGoal(goal.id, { steps });
    onUpdate(updated);
  };

  const setStatus = async (status: string) => {
    setBusy(status);
    try {
      if (status === 'completed') {
        await AuraClient.completeGoal(goal.id);
        onUpdate({ ...goal, status: 'completed', progress: 1 });
        show('Achieved and added to your state.', 'success');
      } else {
        const updated = await AuraClient.updateGoal(goal.id, { status });
        onUpdate(updated);
      }
    } finally { setBusy(null); }
  };

  const askAura = async () => {
    if (!step) return;
    setBusy('aura');
    try {
      const res = await AuraClient.chat(`This intention has become a specific goal in my living collection: "${goal.title}". Current step: "${step.text}". Help me refine the smallest measurable next move, in 2-3 sentences.`, []);
      setAuraReply(res.reply);
      setOpen(true);
    } finally { setBusy(null); }
  };

  const remove = async () => {
    if (!confirm('Remove this from your collection?')) return;
    await AuraClient.deleteGoal(goal.id);
    onDelete(goal.id);
  };

  const saveStateVector = async () => {
    setBusy('state-vector');
    try {
      const nextMetadata = {
        ...(goal.graph_metadata || {}),
        current_state: currentState.trim() || 'current state unclear',
        desired_state: desiredState.trim() || goal.measurable_outcome || goal.title,
        gap_summary: `Move from ${currentState.trim() || 'current state unclear'} toward ${desiredState.trim() || goal.measurable_outcome || goal.title}`,
        vector_source: 'goals_state_gap_editor',
      };
      const updated = await AuraClient.updateGoal(goal.id, { graph_metadata: nextMetadata });
      onUpdate(updated);
      show('Goal vector updated for Aura and iDo.', 'success');
    } finally { setBusy(null); }
  };

  return (
    <article className="fade-in" style={{ position: 'relative', overflow: 'hidden', borderRadius: 26, border: `1px solid ${cfg.color}22`, background: 'linear-gradient(180deg, rgba(255,255,255,0.055), rgba(255,255,255,0.025))', marginBottom: 12 }}>
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 12% 0%, ${cfg.color}24, transparent 38%)`, pointerEvents: 'none' }} />
      <div style={{ position: 'relative', padding: 18 }}>
        <button onClick={() => setOpen(!open)} style={{ display: 'block', width: '100%', textAlign: 'left', color: 'inherit' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
                <span style={{ color: cfg.color, background: cfg.color + '16', border: `1px solid ${cfg.color}33`, borderRadius: 999, padding: '4px 9px', fontSize: 11, fontWeight: 900 }}>{cfg.emoji} {goal.domain || 'IOO'}</span>
                <span style={{ color: 'rgba(248,248,252,0.42)', fontSize: 11, fontWeight: 800 }}>{stateCopy(state)}</span>
              </div>
              <h2 style={{ fontSize: 18, lineHeight: 1.22, letterSpacing: -0.35, fontWeight: 950, margin: 0 }}>{goal.title}</h2>
            </div>
            <div style={{ width: 48, height: 48, borderRadius: 24, flexShrink: 0, display: 'grid', placeItems: 'center', background: `conic-gradient(${cfg.color} ${Math.round(progress * 360)}deg, rgba(255,255,255,0.08) 0deg)` }}>
              <div style={{ width: 36, height: 36, borderRadius: 18, display: 'grid', placeItems: 'center', background: '#10101a', color: cfg.color, fontSize: 10, fontWeight: 950 }}>{Math.round(progress * 100)}%</div>
            </div>
          </div>
          {goal.description && <p style={{ color: 'rgba(248,248,252,0.52)', fontSize: 13, lineHeight: 1.55, margin: '11px 0 0', whiteSpace: 'pre-line' }}>{goal.description.split('\n').slice(0, 2).join(' • ')}</p>}
          {auraManagedCount > 0 && (
            <div style={{ marginTop: 10, color: 'rgba(0,212,170,0.74)', fontSize: 11, fontWeight: 850 }}>
              Aura is automatically handling {auraManagedCount} background mapping/research step{auraManagedCount === 1 ? '' : 's'}.
            </div>
          )}
          {(intention || measurable || metricLine) && (
            <div style={{ display: 'grid', gap: 7, marginTop: 12, padding: 12, borderRadius: 16, background: 'rgba(0,0,0,0.18)', border: '1px solid rgba(255,255,255,0.06)' }}>
              {intention && <div style={{ fontSize: 12, color: 'rgba(248,248,252,0.48)', lineHeight: 1.45 }}><b style={{ color: cfg.color }}>Spark:</b> {intention}</div>}
              <div style={{ fontSize: 12, color: 'rgba(248,248,252,0.72)', lineHeight: 1.45 }}><b style={{ color: '#00d4aa' }}>Goal:</b> {measurable}</div>
              {metricLine && <div style={{ fontSize: 11, color: 'rgba(248,248,252,0.42)' }}><b>Measure:</b> {metricLine}</div>}
            </div>
          )}
          <div style={{ height: 5, borderRadius: 999, background: 'rgba(255,255,255,0.07)', overflow: 'hidden', marginTop: 14 }}>
            <div style={{ width: `${Math.max(progress * 100, goal.steps?.length ? 8 : 0)}%`, height: '100%', background: `linear-gradient(90deg, ${cfg.color}, #00d4aa)`, borderRadius: 999 }} />
          </div>
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 10, alignItems: 'center', marginTop: 14 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: 'rgba(248,248,252,0.34)', fontSize: 10, fontWeight: 900, letterSpacing: 0.8, textTransform: 'uppercase' }}>Next measurable step</div>
            <div style={{ color: step ? 'rgba(248,248,252,0.78)' : 'rgba(248,248,252,0.42)', fontSize: 13, lineHeight: 1.35, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{step?.text || 'Needs Aura to turn the spark into a measurable goal'}</div>
          </div>
          <button onClick={step ? askAura : breakdown} disabled={!!busy} style={{ border: '1px solid rgba(0,212,170,0.35)', background: 'rgba(0,212,170,0.12)', color: '#00d4aa', borderRadius: 999, padding: '9px 12px', fontSize: 12, fontWeight: 900 }}>{busy ? '◈…' : step ? 'Refine' : 'Make measurable'}</button>
          <button onClick={() => onOpenFeed(goal)} style={{ border: '1px solid rgba(139,92,246,0.35)', background: 'rgba(139,92,246,0.12)', color: '#c4b5fd', borderRadius: 999, padding: '9px 12px', fontSize: 12, fontWeight: 900 }}>Goal path</button>
        </div>

        {open && (
          <div className="fade-in" style={{ borderTop: '1px solid rgba(255,255,255,0.07)', marginTop: 16, paddingTop: 14 }}>
            {auraReply && <div style={{ border: '1px solid rgba(0,212,170,0.22)', background: 'rgba(0,212,170,0.08)', color: 'rgba(248,248,252,0.78)', borderRadius: 16, padding: 13, fontSize: 13, lineHeight: 1.55, marginBottom: 12 }}><b style={{ color: '#00d4aa' }}>Aura: </b>{auraReply}</div>}
            <div style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.18)', borderRadius: 18, padding: 13, marginBottom: 12 }}>
              <div style={{ color: cfg.color, fontSize: 11, fontWeight: 950, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 9 }}>Current → desired state</div>
              <label style={{ display: 'grid', gap: 5, marginBottom: 9 }}>
                <span style={{ color: 'rgba(248,248,252,0.44)', fontSize: 11, fontWeight: 850 }}>Where are you now?</span>
                <textarea value={currentState} onChange={(e) => setCurrentState(e.target.value)} rows={2} style={{ resize: 'vertical', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 13, background: 'rgba(255,255,255,0.04)', color: '#f8f8fc', padding: 10, fontSize: 13, lineHeight: 1.4 }} />
              </label>
              <label style={{ display: 'grid', gap: 5 }}>
                <span style={{ color: 'rgba(248,248,252,0.44)', fontSize: 11, fontWeight: 850 }}>What state are you moving toward?</span>
                <textarea value={desiredState} onChange={(e) => setDesiredState(e.target.value)} rows={2} style={{ resize: 'vertical', border: `1px solid ${cfg.color}22`, borderRadius: 13, background: `${cfg.color}08`, color: '#f8f8fc', padding: 10, fontSize: 13, lineHeight: 1.4 }} />
              </label>
              <button onClick={saveStateVector} disabled={busy === 'state-vector'} style={{ marginTop: 10, width: '100%', border: '1px solid rgba(0,212,170,0.3)', background: 'rgba(0,212,170,0.12)', color: '#00d4aa', borderRadius: 999, padding: '10px 12px', fontSize: 12, fontWeight: 900 }}>{busy === 'state-vector' ? 'Updating vector…' : 'Update Aura/iDo vector'}</button>
            </div>
            {goal.steps?.length ? (
              <div style={{ display: 'grid', gap: 8 }}>
                {goal.steps.map((s, i) => (
                  <button key={s.id || i} onClick={() => toggleStep(i)} style={{ display: 'flex', gap: 11, textAlign: 'left', alignItems: 'flex-start', border: '1px solid rgba(255,255,255,0.065)', background: s.completed ? 'rgba(0,212,170,0.055)' : 'rgba(255,255,255,0.035)', borderRadius: 15, padding: 12, color: '#f8f8fc' }}>
                    <span style={{ width: 22, height: 22, borderRadius: 11, display: 'grid', placeItems: 'center', flexShrink: 0, background: s.completed ? '#00d4aa' : 'rgba(255,255,255,0.06)', color: s.completed ? '#06110f' : 'rgba(248,248,252,0.38)', fontSize: 12, fontWeight: 950 }}>{s.completed ? '✓' : i + 1}</span>
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: 13, lineHeight: 1.45, color: s.completed ? 'rgba(248,248,252,0.38)' : '#f8f8fc', textDecoration: s.completed ? 'line-through' : 'none' }}>{s.text}</span>
                      {s.detail && <span style={{ display: 'block', color: 'rgba(248,248,252,0.42)', fontSize: 12, lineHeight: 1.45, marginTop: 3 }}>{s.detail}</span>}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <button onClick={breakdown} disabled={busy === 'breakdown'} style={{ width: '100%', border: '1px solid rgba(0,212,170,0.25)', background: 'rgba(0,212,170,0.09)', color: '#00d4aa', borderRadius: 16, padding: 13, fontWeight: 900 }}>Ask Aura to make this specific, measurable, and actionable</button>
            )}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 13 }}>
              {goal.status !== 'completed' && <button onClick={() => setStatus('completed')} style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.24)', color: '#34d399', borderRadius: 999, padding: '9px 12px', fontSize: 12, fontWeight: 850 }}>Achieved</button>}
              {goal.status === 'active' && <button onClick={() => setStatus('paused')} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(248,248,252,0.55)', borderRadius: 999, padding: '9px 12px', fontSize: 12, fontWeight: 850 }}>Pause</button>}
              {goal.status !== 'active' && goal.status !== 'completed' && <button onClick={() => setStatus('active')} style={{ background: 'rgba(0,212,170,0.1)', border: '1px solid rgba(0,212,170,0.24)', color: '#00d4aa', borderRadius: 999, padding: '9px 12px', fontSize: 12, fontWeight: 850 }}>Reactivate</button>}
              <button onClick={remove} style={{ marginLeft: 'auto', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', borderRadius: 999, padding: '9px 12px', fontSize: 12, fontWeight: 850 }}>Remove</button>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

function EmptyState({ onClarify }: { onClarify: (title: string) => void }) {
  return (
    <div style={{ textAlign: 'center', padding: '42px 18px', borderRadius: 28, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
      <div className="brain-float" style={{ fontSize: 48, color: '#00d4aa', marginBottom: 14 }}>◎</div>
      <div style={{ fontWeight: 950, fontSize: 20, marginBottom: 8 }}>Start with a spark</div>
      <div style={{ color: 'rgba(248,248,252,0.48)', fontSize: 14, lineHeight: 1.65, maxWidth: 320, margin: '0 auto 18px' }}>Capture an intention. Aura will refine it into a specific measurable goal, then break it into achievable steps.</div>
      <button onClick={() => onClarify('I want to create a clearer direction for my life')} style={{ border: 0, borderRadius: 999, padding: '12px 16px', background: '#00d4aa', color: '#06110f', fontWeight: 950 }}>Clarify with Aura</button>
    </div>
  );
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [lens, setLens] = useState<Lens>('active');
  const [clarifyingGoal, setClarifyingGoal] = useState<string | null>(null);
  const [pathLimitInfo, setPathLimitInfo] = useState<{ activePaths: number; pathLimit: number; pathCredits?: number } | null>(null);
  const { show } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    AuraClient.listGoals('all').then(setGoals).catch(console.error).finally(() => setLoading(false));
  }, []);

  const counts = useMemo<Record<Lens, number>>(() => ({
    active: goals.filter((g) => g.status === 'active').length,
    paths: goals.filter((g) => g.steps?.length && g.status !== 'completed').length,
    saved: goals.filter((g) => !g.steps?.length && g.status !== 'completed').length,
    done: goals.filter((g) => g.status === 'completed').length,
    all: goals.length,
  }), [goals]);

  const visibleGoals = useMemo(() => goals.filter((g) => {
    if (lens === 'active') return g.status === 'active';
    if (lens === 'paths') return !!g.steps?.length && g.status !== 'completed';
    if (lens === 'saved') return !g.steps?.length && g.status !== 'completed';
    if (lens === 'done') return g.status === 'completed';
    return true;
  }), [goals, lens]);

  const handleUpdate = (updated: Goal) => setGoals((prev) => prev.map((g) => g.id === updated.id ? updated : g));
  const handleDelete = (id: string) => setGoals((prev) => prev.filter((g) => g.id !== id));

  const handleClarifiedGoal = async (structuredGoal: any, iooPath: any[]) => {
    const title = structuredGoal?.title || clarifyingGoal || 'New intention';
    const descriptionParts = [
      structuredGoal?.why ? `Why: ${structuredGoal.why}` : null,
      structuredGoal?.specifics ? `Shape: ${structuredGoal.specifics}` : null,
      structuredGoal?.timeline ? `Timeline: ${structuredGoal.timeline}` : null,
      structuredGoal?.constraints ? `Constraints: ${structuredGoal.constraints}` : null,
    ].filter(Boolean);
    const actionablePath = userActionNodes(iooPath).slice(0, 6);
    const steps = actionablePath.map((node, i) => ({
      id: node.id || `${Date.now()}-${i}`,
      text: node.title || `Step ${i + 1}`,
      detail: [
        node.description,
        node.user_action ? `You: ${node.user_action}` : null,
        node.aura_action ? `Aura: ${node.aura_action}` : null,
        node.requires_payment ? `Unlock: ${node.service_id || 'Aura service'}${node.price_usd ? ` • $${node.price_usd}` : ''}` : null,
      ].filter(Boolean).join('\n'),
      resources: [],
      completed: false,
      order: i,
      aura_note: [
        node.domain ? `Path map • ${node.domain}` : 'Path map',
        node.owner ? `Owner: ${node.owner}` : null,
        node.node_type || node.step_type || null,
      ].filter(Boolean).join(' • '),
    }));
    // Check path limit before creating
    let pathStatus: { active_paths: number; path_limit: number; path_credits: number; at_limit: boolean } | null = null;
    try {
      pathStatus = await AuraClient['client'].get('/api/goals/path-status').then((r: any) => r.data);
    } catch {}
    if (pathStatus?.at_limit) {
      setPathLimitInfo({ activePaths: pathStatus.active_paths, pathLimit: pathStatus.path_limit, pathCredits: pathStatus.path_credits });
      return;
    }
    const goal = await AuraClient.createGoal(title, descriptionParts.join('\n') || undefined, undefined, steps.length ? steps : undefined, {
      intention_text: clarifyingGoal || title,
      measurable_outcome: structuredGoal?.measurable_outcome || structuredGoal?.specifics || structuredGoal?.title || title,
      success_metric: structuredGoal?.success_metric || structuredGoal?.metric || structuredGoal?.specifics || undefined,
      target_value: structuredGoal?.target_value || undefined,
      target_date: structuredGoal?.timeline || undefined,
      graph_metadata: {
        state_model: 'intention_to_measurable_goal_to_steps',
        current_state: structuredGoal?.current_state || structuredGoal?.starting_point || 'current state unclear',
        desired_state: structuredGoal?.desired_state || structuredGoal?.measurable_outcome || structuredGoal?.specifics || structuredGoal?.title || title,
        gap_summary: `Move from ${structuredGoal?.current_state || structuredGoal?.starting_point || 'current state unclear'} toward ${structuredGoal?.desired_state || structuredGoal?.measurable_outcome || structuredGoal?.specifics || structuredGoal?.title || title}`,
        intention_text: clarifyingGoal || title,
        measurable_outcome: structuredGoal?.measurable_outcome || structuredGoal?.specifics || structuredGoal?.title || title,
        suggested_ioo_path: iooPath,
        aura_managed_nodes: iooPath.filter(isAuraManagedNode),
        user_nodes: iooPath.filter((node) => node.owner !== 'aura'),
        aura_nodes: iooPath.filter((node) => node.owner === 'aura'),
        paid_aura_nodes: iooPath.filter((node) => node.requires_payment),
        source: 'goals_collection',
      },
    });
    setGoals((prev) => [goal, ...prev]);
    setClarifyingGoal(null);
    setLens('active');
    show('Spark refined into a measurable goal.', 'success');
  };

  return (
    <>
    {pathLimitInfo && (
      <PathLimitSheet
        activePaths={pathLimitInfo.activePaths}
        pathLimit={pathLimitInfo.pathLimit}
        pathCredits={pathLimitInfo.pathCredits}
        onClose={() => setPathLimitInfo(null)}
        onArchive={() => { setPathLimitInfo(null); setLens('active'); }}
      />
    )}
    <div className="page-content" style={{ maxWidth: 720, margin: '0 auto' }}>
      <header style={{ paddingTop: 6, marginBottom: 16 }}>
        <div style={{ color: '#00d4aa', fontSize: 12, fontWeight: 950, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8 }}>Intentions → goals → steps</div>
        <h1 style={{ fontWeight: 950, fontSize: 'clamp(30px, 8vw, 48px)', letterSpacing: -1.4, lineHeight: 0.98, margin: 0 }}>Sparks become achievable goals.</h1>
        <p style={{ color: 'rgba(248,248,252,0.54)', fontSize: 14, lineHeight: 1.65, marginTop: 12, maxWidth: 560 }}>
          Intentions are the spark and fuel. Aura refines them into specific, measurable, attainable goals, then turns them into real steps you can complete.
        </p>
      </header>

      <UserStateStrip goals={goals} />
      <DesiredStateCompass goals={goals} />
      <WeeklyRecapCard />
      <CaptureBar onClarify={setClarifyingGoal} />
      <StarterRail onClarify={setClarifyingGoal} />
      <LensTabs lens={lens} setLens={setLens} counts={counts} />

      {loading ? (
        <div style={{ display: 'grid', gap: 12 }}>{[0, 1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 132, borderRadius: 26 }} />)}</div>
      ) : visibleGoals.length ? (
        <div>{visibleGoals.map((goal) => <GoalCard key={goal.id} goal={goal} onUpdate={handleUpdate} onDelete={handleDelete} onOpenFeed={(g) => navigate(`/app/ido?goal=${encodeURIComponent(g.id)}`)} />)}</div>
      ) : goals.length ? (
        <div style={{ color: 'rgba(248,248,252,0.46)', textAlign: 'center', padding: 28 }}>Nothing in this lens yet.</div>
      ) : <EmptyState onClarify={setClarifyingGoal} />}

      <button onClick={() => navigate('/app/ido')} style={{ width: '100%', marginTop: 16, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.035)', color: 'rgba(248,248,252,0.64)', borderRadius: 18, padding: 14, fontWeight: 850 }}>
        Let Aura recommend from these goals →
      </button>

      {clarifyingGoal && <GoalClarifyModal goalTitle={clarifyingGoal} onClose={() => setClarifyingGoal(null)} onComplete={handleClarifiedGoal} />}
    </div>
    </>  
  );
}
