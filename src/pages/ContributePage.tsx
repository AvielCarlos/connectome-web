import React, { useEffect, useMemo, useState } from 'react';
import { AuraClient, authStorage } from '../lib/AuraClient';
import CPExplainerModal from '../components/CPExplainerModal';
import { PageHero, PrimaryCTA, SectionCard } from '../components/design';
import { trackDeveloperOnboardingEvent } from '../lib/developerOnboardingAnalytics';

const ACCENT = '#00d4aa';

type Contribution = {
  id: string;
  contribution_type: string;
  title: string;
  status: string;
  cp_awarded?: number;
};

type GitHubStatus = {
  connected: boolean;
  github_username: string | null;
  github_avatar_url: string | null;
};

const contributionTypes = [
  { value: 'code', label: 'Code', icon: '💻' },
  { value: 'design', label: 'Design', icon: '🎨' },
  { value: 'research', label: 'Research', icon: '🔬' },
  { value: 'content', label: 'Content', icon: '✍' },
  { value: 'community', label: 'Community', icon: '🤝' },
  { value: 'idea', label: 'Idea', icon: '💡' },
];

const statusStyles: Record<string, { bg: string; color: string; border: string }> = {
  pending: { bg: 'rgba(244,194,107,0.13)', color: '#f4c26b', border: 'rgba(244,194,107,0.35)' },
  approved: { bg: 'rgba(80,220,150,0.13)', color: '#6ff0ad', border: 'rgba(80,220,150,0.32)' },
  accepted: { bg: 'rgba(80,220,150,0.13)', color: '#6ff0ad', border: 'rgba(80,220,150,0.32)' },
  rejected: { bg: 'rgba(255,102,102,0.13)', color: '#ff7b7b', border: 'rgba(255,102,102,0.35)' },
};

export default function ContributePage() {
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loadingMine, setLoadingMine] = useState(false);
  const [type, setType] = useState('code');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [link, setLink] = useState('');
  const [evidence, setEvidence] = useState('');
  const [attachmentUrls, setAttachmentUrls] = useState(['', '', '']);
  const [submitting, setSubmitting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [githubStatus, setGithubStatus] = useState<GitHubStatus>({ connected: false, github_username: null, github_avatar_url: null });
  const [cpExplainerOpen, setCpExplainerOpen] = useState(false);

  const isAuthed = useMemo(() => authStorage.isAuthenticated(), []);

  const loadMine = async () => {
    if (!authStorage.isAuthenticated()) return;
    setLoadingMine(true);
    try {
      const rows = await AuraClient.getMyContributions();
      setContributions(rows || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMine(false);
    }
  };

  useEffect(() => {
    trackDeveloperOnboardingEvent('contribute_page_viewed');
    loadMine();
    AuraClient.getGitHubStatus().then(setGithubStatus);
  }, []);

  const syncGitHub = async () => {
    setMessage(null);
    setError(null);
    trackDeveloperOnboardingEvent('github_sync_clicked');
    setSyncing(true);
    try {
      const res = await AuraClient.syncGitHubContributions();
      const count = Number(res?.synced || 0);
      setMessage(count > 0 ? `Synced ${count} merged PR${count === 1 ? '' : 's'} from GitHub.` : 'No new merged PRs found on GitHub.');
      await loadMine();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Could not sync GitHub contributions.');
    } finally {
      setSyncing(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    if (!title.trim() || !description.trim()) {
      setError('Title and description are required.');
      return;
    }

    if (type === 'code' && !githubStatus.connected) {
      setError('Connect GitHub before submitting code contributions.');
      return;
    }

    trackDeveloperOnboardingEvent('contribution_submit_started');
    setSubmitting(true);
    try {
      const trimmedLink = link.trim();
      await AuraClient.submitContribution({
        contribution_type: type,
        title: title.trim(),
        description: description.trim(),
        github_pr_url: type === 'code' && trimmedLink ? trimmedLink : undefined,
        external_link: type !== 'code' && trimmedLink ? trimmedLink : undefined,
        evidence_text: evidence.trim() || undefined,
        attachment_urls: attachmentUrls.map((url) => url.trim()).filter(Boolean),
      });
      trackDeveloperOnboardingEvent('contribution_submit_succeeded');
      setMessage('Contribution submitted! Aura will review within 24h.');
      setTitle('');
      setDescription('');
      setLink('');
      setEvidence('');
      setAttachmentUrls(['', '', '']);
      await loadMine();
    } catch (err: any) {
      trackDeveloperOnboardingEvent('contribution_submit_failed');
      const detail = err?.response?.data?.detail;
      setError(detail || 'Could not submit contribution. Please sign in and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main style={{ minHeight: 'var(--visual-viewport-height, 100dvh)', background: 'radial-gradient(circle at 50% 0%, rgba(0,212,170,0.12), transparent 36%), #0a0a0f', color: '#f8f8fc', padding: '46px 18px 110px' }}>
      <style>{`
        .contribute-page input, .contribute-page textarea { width: 100%; box-sizing: border-box; background: rgba(255,255,255,0.045); border: 1px solid rgba(255,255,255,0.1); color: #f8f8fc; border-radius: 14px; padding: 14px 15px; font: inherit; outline: none; }
        .contribute-page input:focus, .contribute-page textarea:focus { border-color: rgba(0,212,170,0.62); box-shadow: 0 0 0 3px rgba(0,212,170,0.10); }
        .contribute-page label { display: block; color: rgba(248,248,252,0.78); font-size: 13px; font-weight: 800; margin-bottom: 8px; }
        .contribute-page a { color: ${ACCENT}; text-decoration: none; }
        .contribute-page a:hover { text-decoration: underline; }
      `}</style>

      <div className="contribute-page" style={{ maxWidth: 980, margin: '0 auto' }}>
        <PageHero eyebrow="Aligned developer workbench" title="Build Aura. Earn CP. Help shape AI for human flourishing.">
          <p style={{ margin: 0 }}>Contribute is the workbench for developers, designers, writers, and operators aligned with the mission: concrete tasks, evidence, review, shipping, and transparent CP recognition.</p>
          <button type="button" onClick={() => { trackDeveloperOnboardingEvent('cp_explainer_opened'); setCpExplainerOpen(true); }} style={{ marginTop: 14, color: ACCENT, fontWeight: 900, textDecoration: 'none' }}>What is CP?</button>
        </PageHero>

        {/* GitHub connect banner — shown near top if not connected */}
        {isAuthed && !githubStatus.connected && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap',
            background: 'rgba(36,41,46,0.7)', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 16, padding: '14px 18px', marginBottom: 20,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 22 }}>🔗</span>
              <div>
                <div style={{ fontWeight: 800, fontSize: 14, color: '#f8f8fc' }}>Connect GitHub to earn CP faster</div>
                <div style={{ fontSize: 12, color: 'rgba(248,248,252,0.45)', marginTop: 2 }}>Required for code contributions. Also enables auto-sync of merged PRs.</div>
              </div>
            </div>
            <a
              href={AuraClient.getGitHubLoginUrl()}
              onClick={() => trackDeveloperOnboardingEvent('github_connect_clicked')}
              style={{
                background: '#24292e', color: '#fff', padding: '9px 18px',
                borderRadius: 12, textDecoration: 'none', fontWeight: 800, fontSize: 13,
                whiteSpace: 'nowrap', flexShrink: 0,
              }}
            >
              Connect GitHub →
            </a>
          </div>
        )}

        <SectionCard accent style={{ marginBottom: 22 }}>
          <div style={{ color: ACCENT, fontSize: 12, fontWeight: 900, letterSpacing: 1.1, textTransform: 'uppercase', marginBottom: 8 }}>Who we're looking for now</div>
          <h2 style={{ margin: '0 0 12px', fontSize: 28, letterSpacing: -0.8 }}>Developers who care about agency, consciousness, and useful AI.</h2>
          <p style={{ margin: '0 0 16px', color: 'rgba(248,248,252,0.64)', lineHeight: 1.65 }}>
            Aura needs builders who can turn the IOO graph into real user outcomes: live research, local opportunity intelligence, goal/path infrastructure, graph embeddings, agent reliability, and beautiful React surfaces.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 10, marginBottom: 16 }}>
            {[
              ['Agent / search engineers', 'Execution agents, web/provider research, safe action handoffs.'],
              ['Graph / ML engineers', 'IOO embeddings, prerequisites, ranking, vector search.'],
              ['Full-stack product builders', 'FastAPI, Postgres, React, Stripe, OAuth, mobile-grade UX.'],
              ['Local intelligence builders', 'Events, places, services, APIs, structured public data.'],
            ].map(([title, body]) => (
              <div key={title} style={{ background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.075)', borderRadius: 16, padding: 14 }}>
                <div style={{ fontWeight: 900, marginBottom: 6 }}>{title}</div>
                <div style={{ color: 'rgba(248,248,252,0.56)', fontSize: 13, lineHeight: 1.5 }}>{body}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <PrimaryCTA href="https://github.com/AvielCarlos/connectome-backend/issues" target="_blank" rel="noreferrer" onClick={() => trackDeveloperOnboardingEvent('cp_issue_list_clicked')}>Browse CP issues →</PrimaryCTA>
            <PrimaryCTA href="https://github.com/AvielCarlos/connectome-backend" target="_blank" rel="noreferrer" variant="secondary" onClick={() => trackDeveloperOnboardingEvent('backend_repo_clicked')}>View backend repo</PrimaryCTA>
            <PrimaryCTA href="https://github.com/AvielCarlos/connectome-web" target="_blank" rel="noreferrer" variant="secondary" onClick={() => trackDeveloperOnboardingEvent('web_repo_clicked')}>View web repo</PrimaryCTA>
            <PrimaryCTA href="https://t.me/ascensiontechai" target="_blank" rel="noreferrer" variant="secondary" onClick={() => trackDeveloperOnboardingEvent('community_clicked')}>Join community</PrimaryCTA>
          </div>
        </SectionCard>

        <SectionCard style={{ marginBottom: 22 }}>
          <div style={{ marginBottom: 18 }}><div style={{ color: ACCENT, fontSize: 12, fontWeight: 900, letterSpacing: 1.1, textTransform: 'uppercase' }}>Submit a Contribution</div><h2 style={{ margin: '5px 0 0', fontSize: 30, letterSpacing: -0.8 }}>Tell reviewers what you built or moved forward.</h2></div>
          {githubStatus.connected && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 20, padding: '4px 12px', marginBottom: 16 }}>
              {githubStatus.github_avatar_url && <img src={githubStatus.github_avatar_url} style={{ width: 20, height: 20, borderRadius: 10 }} />}
              <span style={{ fontSize: 13, color: '#34d399', fontWeight: 600 }}>@{githubStatus.github_username}</span>
              <span style={{ fontSize: 12, color: 'rgba(248,248,252,0.4)' }}>GitHub connected</span>
            </div>
          )}
          <form onSubmit={submit} style={{ display: 'grid', gap: 16 }}>
            <div><label>Contribution type</label><div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>{contributionTypes.map((item) => { const active = type === item.value; return <button key={item.value} type="button" onClick={() => { trackDeveloperOnboardingEvent('contribution_type_selected'); setType(item.value); }} style={{ border: active ? '1px solid rgba(0,212,170,0.72)' : '1px solid rgba(255,255,255,0.1)', background: active ? 'rgba(0,212,170,0.14)' : 'rgba(255,255,255,0.04)', color: active ? ACCENT : '#f8f8fc', borderRadius: 999, padding: '10px 13px', fontWeight: 850, cursor: 'pointer' }}>{item.icon} {item.label}</button>; })}</div></div>
            {type === 'code' && !githubStatus.connected && (
              <div style={{ background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.3)', borderRadius: 16, padding: '20px 24px', marginBottom: 20 }}>
                <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>Connect GitHub first</div>
                <div style={{ fontSize: 14, color: 'rgba(248,248,252,0.6)', marginBottom: 16 }}>
                  For code contributions, we verify your GitHub account to automatically track your merged PRs and award CP accurately.
                </div>
                <a href={AuraClient.getGitHubLoginUrl()} onClick={() => trackDeveloperOnboardingEvent('github_connect_clicked')} style={{ display: 'inline-block', background: '#24292e', color: '#fff', padding: '10px 20px', borderRadius: 24, textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>
                  Connect GitHub →
                </a>
              </div>
            )}
            <div><label htmlFor="contribution-title">Title</label><input id="contribution-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Short, clear name for your contribution" /></div>
            <div><label htmlFor="contribution-description">Description *</label><textarea id="contribution-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={6} required placeholder="What did you do? Be specific — reviewers need to understand your contribution." /></div>
            <div><label htmlFor="contribution-link">Link (optional)</label><input id="contribution-link" value={link} onChange={(e) => setLink(e.target.value)} placeholder="GitHub PR, Figma link, Google Doc, YouTube, etc." /></div>
            <div><label htmlFor="contribution-evidence">Evidence / context (optional)</label><textarea id="contribution-evidence" value={evidence} onChange={(e) => setEvidence(e.target.value)} rows={4} placeholder="Any additional context, screenshots description, or proof of work." /></div>
            <div><label>Attachment URLs (optional)</label><div style={{ display: 'grid', gap: 10 }}>{attachmentUrls.map((url, i) => <input key={i} value={url} onChange={(e) => { const next = [...attachmentUrls]; next[i] = e.target.value; setAttachmentUrls(next); }} placeholder={`Screenshot, Drive, Figma, Loom, or proof URL ${i + 1}`} />)}</div></div>
            {!githubStatus.connected && type !== 'code' && (
              <div style={{ fontSize: 13, color: 'rgba(248,248,252,0.4)', marginTop: 8, textAlign: 'center' }}>
                <a href={AuraClient.getGitHubLoginUrl()} onClick={() => trackDeveloperOnboardingEvent('github_connect_clicked')} style={{ color: '#00d4aa', textDecoration: 'none' }}>
                  Connect GitHub
                </a>{' '}to link your profile and get more accurate CP attribution.
              </div>
            )}
            {message && <div style={{ color: '#6ff0ad', background: 'rgba(80,220,150,0.1)', border: '1px solid rgba(80,220,150,0.25)', borderRadius: 14, padding: 12 }}>{message}</div>}
            {error && <div style={{ color: '#ff8d8d', background: 'rgba(255,102,102,0.1)', border: '1px solid rgba(255,102,102,0.25)', borderRadius: 14, padding: 12 }}>{error}</div>}
            <button type="submit" disabled={submitting || !isAuthed || (type === 'code' && !githubStatus.connected)} style={{ justifySelf: 'start', minWidth: 210, padding: '14px 18px', borderRadius: 14, border: 'none', background: isAuthed && !(type === 'code' && !githubStatus.connected) ? `linear-gradient(135deg, ${ACCENT}, #00b896)` : 'rgba(255,255,255,0.12)', color: isAuthed && !(type === 'code' && !githubStatus.connected) ? '#06100e' : 'rgba(248,248,252,0.55)', fontWeight: 950, cursor: isAuthed && !(type === 'code' && !githubStatus.connected) ? 'pointer' : 'not-allowed', boxShadow: isAuthed && !(type === 'code' && !githubStatus.connected) ? '0 12px 34px rgba(0,212,170,0.20)' : 'none' }}>{submitting ? 'Submitting…' : isAuthed ? 'Submit Contribution' : 'Sign in to submit'}</button>
          </form>
        </SectionCard>

        <SectionCard padding={22} style={{ marginBottom: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
            <div><div style={{ color: ACCENT, fontSize: 12, fontWeight: 900, letterSpacing: 1.1, textTransform: 'uppercase' }}>My Contributions</div><h2 style={{ margin: '5px 0 0', fontSize: 26, letterSpacing: -0.6 }}>Your submitted work</h2></div>
            {githubStatus.connected ? <button type="button" onClick={syncGitHub} disabled={syncing} style={{ border: 'none', background: syncing ? 'rgba(255,255,255,0.12)' : `linear-gradient(135deg, ${ACCENT}, #00b896)`, color: syncing ? 'rgba(248,248,252,0.55)' : '#06100e', borderRadius: 12, padding: '10px 13px', fontWeight: 900, cursor: syncing ? 'not-allowed' : 'pointer' }}>{syncing ? 'Syncing…' : 'Sync GitHub PRs'}</button> : loadingMine && <span style={{ color: 'rgba(248,248,252,0.52)' }}>Loading…</span>}
          </div>

          {!isAuthed ? <p style={{ margin: 0, color: 'rgba(248,248,252,0.62)' }}>Sign in to submit contributions and track CP awards.</p> : contributions.length === 0 ? <p style={{ margin: 0, color: 'rgba(248,248,252,0.62)' }}>No submissions yet. Your next contribution can start below.</p> : (
            <div style={{ display: 'grid', gap: 10 }}>
              {contributions.map((item) => {
                const status = statusStyles[item.status] || statusStyles.pending;
                const typeMeta = contributionTypes.find((t) => t.value === item.contribution_type);
                const cp = Number(item.cp_awarded || 0);
                return (
                  <article key={item.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'center', background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '14px 15px', flexWrap: 'wrap' }}>
                    <div><div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 6, flexWrap: 'wrap' }}><span style={{ color: ACCENT, fontSize: 12, fontWeight: 900, textTransform: 'uppercase' }}>{typeMeta?.icon} {typeMeta?.label || item.contribution_type}</span><span style={{ background: status.bg, color: status.color, border: `1px solid ${status.border}`, borderRadius: 999, padding: '4px 9px', fontSize: 12, fontWeight: 900 }}>{item.status}</span></div><strong style={{ fontSize: 16 }}>{item.title}</strong></div>
                    {cp > 0 && <div style={{ color: '#f4c26b', fontWeight: 950 }}>{cp} CP</div>}
                  </article>
                );
              })}
            </div>
          )}
        </SectionCard>

        <SectionCard as="div" padding={20}>
        <details>
          <summary style={{ cursor: 'pointer', color: ACCENT, fontWeight: 950, fontSize: 16 }}>How contributions are evaluated</summary>
          <ul style={{ margin: '16px 0 0', paddingLeft: 20, color: 'rgba(248,248,252,0.66)', lineHeight: 1.75 }}><li>Quality over quantity.</li><li>Must be implemented or documented evidence of real work.</li><li>Aura reviews every submission within 24h.</li><li>CP awarded based on impact and complexity.</li></ul>
        </details>
        </SectionCard>
      </div>
      <CPExplainerModal open={cpExplainerOpen} onClose={() => setCpExplainerOpen(false)} />
    </main>
  );
}
