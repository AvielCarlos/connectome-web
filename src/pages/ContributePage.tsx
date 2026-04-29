import React, { useEffect, useMemo, useState } from 'react';
import { OraClient } from '../lib/OraClient';

const ACCENT = '#00d4aa';

const TYPES = [
  { id: 'code', label: 'Code', icon: '💻', range: '500–1000 CP' },
  { id: 'design', label: 'Design', icon: '🎨', range: '300–600 CP' },
  { id: 'research', label: 'Research', icon: '🔬', range: '200–500 CP' },
  { id: 'content', label: 'Content', icon: '✍️', range: '100–300 CP' },
  { id: 'community', label: 'Community', icon: '🤝', range: '100–400 CP' },
  { id: 'idea', label: 'Idea', icon: '💡', range: '50–200 CP' },
];

const card: React.CSSProperties = {
  background: 'linear-gradient(180deg, rgba(18,18,28,0.96), rgba(11,11,17,0.96))',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 18,
  padding: 18,
  boxShadow: '0 18px 60px rgba(0,0,0,0.22)',
};

function StatusBadge({ status }: { status: string }) {
  const s = String(status || 'pending').toLowerCase();
  const color = s === 'approved' || s === 'accepted' ? '#34d399' : s === 'rejected' ? '#f87171' : '#f4c26b';
  return <span style={{ color, border: `1px solid ${color}55`, background: `${color}14`, padding: '3px 8px', borderRadius: 999, fontSize: 11, fontWeight: 800 }}>{s}</span>;
}

export default function ContributePage() {
  const [tab, setTab] = useState<'mine' | 'submit' | 'github'>('mine');
  const [mine, setMine] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [form, setForm] = useState({ contribution_type: 'code', title: '', description: '', external_link: '', attachment_urls: ['', '', ''] });

  const selectedType = useMemo(() => TYPES.find((t) => t.id === form.contribution_type) || TYPES[0], [form.contribution_type]);

  const load = async () => {
    setLoading(true);
    try {
      const [contribs, contributionStats] = await Promise.all([
        OraClient.getMyContributions().catch(() => []),
        OraClient.getContributionStats().catch(() => null),
      ]);
      setMine(contribs || []);
      setStats(contributionStats);
      if (contributionStats?.github_connected) setTab('mine');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const show = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  const syncGitHub = async () => {
    setSyncing(true);
    try {
      const res = await OraClient.syncGitHubContributions();
      show(res.synced ? `Synced ${res.synced} merged PR${res.synced === 1 ? '' : 's'} ✨` : 'No new merged PRs found');
      await load();
    } catch (e: any) {
      show(e?.response?.data?.detail || 'GitHub sync failed');
    }
    setSyncing(false);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) return show('Title and description are required');
    if (form.description.trim().split(/[.!?]+/).filter(Boolean).length < 3) return show('Please add a little more detail — 3+ sentences helps reviewers.');
    setSaving(true);
    try {
      await OraClient.submitContribution({
        contribution_type: form.contribution_type,
        title: form.title.trim(),
        description: form.description.trim(),
        external_link: form.external_link.trim() || undefined,
        github_pr_url: form.contribution_type === 'code' ? form.external_link.trim() || undefined : undefined,
        attachment_urls: form.attachment_urls.map((u) => u.trim()).filter(Boolean).slice(0, 3),
      });
      setForm({ contribution_type: form.contribution_type, title: '', description: '', external_link: '', attachment_urls: ['', '', ''] });
      setTab('mine');
      show('Contribution submitted — Ora will review within 24 hours.');
      await load();
    } catch (e: any) {
      show(e?.response?.data?.detail || 'Submission failed');
    }
    setSaving(false);
  };

  return (
    <main style={{ minHeight: '100vh', background: 'radial-gradient(circle at 50% 0%, rgba(0,212,170,0.11), transparent 34%), #0a0a0f', color: '#f8f8fc', padding: '42px 16px 110px' }}>
      {toast && <div style={{ position: 'fixed', top: 18, left: '50%', transform: 'translateX(-50%)', background: '#12121a', border: '1px solid rgba(0,212,170,0.3)', borderRadius: 12, padding: '10px 14px', zIndex: 10, fontSize: 13 }}>{toast}</div>}
      <div style={{ maxWidth: 920, margin: '0 auto' }}>
        <section style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ display: 'inline-flex', border: '1px solid rgba(0,212,170,0.28)', background: 'rgba(0,212,170,0.08)', color: ACCENT, borderRadius: 999, padding: '7px 12px', fontSize: 12, fontWeight: 900, letterSpacing: 0.8, marginBottom: 16 }}>◈ ORA CONTRIBUTOR SYSTEM</div>
          <h1 style={{ fontSize: 'clamp(36px, 8vw, 68px)', lineHeight: 0.98, letterSpacing: -2.2, margin: '0 0 14px', fontWeight: 950 }}>Contribute value. Earn CP. Shape Ora.</h1>
          <p style={{ margin: '0 auto', maxWidth: 680, color: 'rgba(248,248,252,0.62)', fontSize: 16, lineHeight: 1.6 }}>Submit code, design, research, content, community work, or ideas. Code PRs can be synced automatically when GitHub is connected.</p>
        </section>

        <div style={{ display: 'flex', gap: 8, marginBottom: 18, justifyContent: 'center', flexWrap: 'wrap' }}>
          {[
            ['mine', 'My Contributions'], ['submit', 'Submit'], ['github', stats?.github_connected ? 'GitHub Connected' : 'Connect GitHub'],
          ].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id as any)} style={{ border: 'none', borderRadius: 12, padding: '10px 14px', fontWeight: 850, cursor: 'pointer', background: tab === id ? ACCENT : 'rgba(255,255,255,0.07)', color: tab === id ? '#06100e' : 'rgba(248,248,252,0.72)' }}>{label}</button>
          ))}
        </div>

        {tab === 'mine' && <section style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 16 }}>
            <div><h2 style={{ margin: 0, fontSize: 22 }}>My Contributions</h2><div style={{ color: 'rgba(248,248,252,0.45)', fontSize: 13 }}>{stats?.total_cp || 0} CP · {stats?.contributions_approved || 0} approved</div></div>
            {stats?.github_connected && <button onClick={syncGitHub} disabled={syncing} style={{ background: ACCENT, color: '#06100e', border: 'none', borderRadius: 12, padding: '10px 12px', fontWeight: 900 }}>{syncing ? 'Syncing…' : 'Sync GitHub PRs'}</button>}
          </div>
          {loading ? <div style={{ color: 'rgba(248,248,252,0.42)' }}>Loading…</div> : mine.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 32, color: 'rgba(248,248,252,0.48)' }}>You haven’t contributed yet — start below!<br /><button onClick={() => setTab('submit')} style={{ marginTop: 14, background: ACCENT, color: '#06100e', border: 'none', borderRadius: 12, padding: '11px 14px', fontWeight: 900 }}>Submit your first contribution</button></div>
          ) : mine.map((c) => <div key={c.id} style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '14px 0', display: 'flex', gap: 12, justifyContent: 'space-between' }}><div><div style={{ fontWeight: 850 }}>{c.title}</div><div style={{ fontSize: 12, color: 'rgba(248,248,252,0.45)', marginTop: 4 }}>{c.contribution_type} · {c.source === 'github' ? 'synced from GitHub' : 'manual submission'}</div></div><div style={{ textAlign: 'right' }}><StatusBadge status={c.status} /><div style={{ color: '#f4c26b', fontSize: 12, marginTop: 6 }}>{c.cp_awarded || 0} CP</div></div></div>)}
        </section>}

        {tab === 'submit' && <form onSubmit={submit} style={{ ...card, display: 'grid', gap: 16 }}>
          <div><h2 style={{ margin: '0 0 6px', fontSize: 22 }}>Submit a Contribution</h2><p style={{ margin: 0, color: 'rgba(248,248,252,0.48)', fontSize: 13 }}>Be specific. Reviewers reward clear evidence of shipped value.</p></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(125px, 1fr))', gap: 8 }}>{TYPES.map((t) => <button type="button" key={t.id} onClick={() => setForm({ ...form, contribution_type: t.id })} style={{ border: `1px solid ${form.contribution_type === t.id ? ACCENT : 'rgba(255,255,255,0.08)'}`, background: form.contribution_type === t.id ? 'rgba(0,212,170,0.12)' : '#101018', color: '#f8f8fc', borderRadius: 13, padding: 12, cursor: 'pointer', fontWeight: 800 }}>{t.icon} {t.label}</button>)}</div>
          <input required placeholder="What did you build/create/do?" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={inputStyle} />
          <textarea required rows={6} placeholder="Be specific — what exactly did you contribute? What problem does it solve? Why does it matter?" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={inputStyle} />
          <input placeholder="Link: GitHub PR, Figma, Google Doc, YouTube, Notion, etc." value={form.external_link} onChange={(e) => setForm({ ...form, external_link: e.target.value })} style={inputStyle} />
          {form.attachment_urls.map((url, i) => <input key={i} placeholder={`Attachment URL ${i + 1} — Imgur, Drive, Dropbox, screenshot, mockup…`} value={url} onChange={(e) => { const next = [...form.attachment_urls]; next[i] = e.target.value; setForm({ ...form, attachment_urls: next }); }} style={inputStyle} />)}
          <div style={{ background: 'rgba(244,194,107,0.08)', border: '1px solid rgba(244,194,107,0.22)', borderRadius: 12, padding: 12, color: '#f4c26b', fontSize: 13, fontWeight: 800 }}>{selectedType.label} contributions typically earn {selectedType.range}</div>
          <button disabled={saving} style={{ background: ACCENT, color: '#06100e', border: 'none', borderRadius: 14, padding: '14px 16px', fontWeight: 950, cursor: 'pointer' }}>{saving ? 'Submitting…' : 'Submit — Ora reviews within 24 hours'}</button>
        </form>}

        {tab === 'github' && <section style={{ ...card, textAlign: 'center' }}>
          {stats?.github_connected ? <>
            {stats.github_avatar_url && <img src={stats.github_avatar_url} alt="" style={{ width: 72, height: 72, borderRadius: 36, marginBottom: 12 }} />}
            <h2 style={{ margin: '0 0 6px' }}>GitHub connected</h2>
            <p style={{ color: 'rgba(248,248,252,0.55)' }}>@{stats.github_username} · merged PRs can be synced automatically.</p>
            <button onClick={syncGitHub} disabled={syncing} style={{ background: ACCENT, color: '#06100e', border: 'none', borderRadius: 13, padding: '12px 16px', fontWeight: 900 }}>{syncing ? 'Syncing…' : 'Sync now'}</button>
          </> : <>
            <h2 style={{ margin: '0 0 8px' }}>Connect GitHub to automatically track merged PRs</h2>
            <p style={{ maxWidth: 520, margin: '0 auto 18px', color: 'rgba(248,248,252,0.55)', lineHeight: 1.55 }}>When a PR is merged in connectome-backend or connectome-web, Ora can pull it into your contribution list for review — no duplicate manual form needed.</p>
            <a href={OraClient.getGitHubConnectUrl()} style={{ display: 'inline-flex', background: ACCENT, color: '#06100e', borderRadius: 13, padding: '13px 18px', fontWeight: 950, textDecoration: 'none' }}>Connect GitHub</a>
          </>}
        </section>}
      </div>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', background: '#101018', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 13, color: '#f8f8fc', padding: '13px 14px', fontSize: 14, outline: 'none',
};
