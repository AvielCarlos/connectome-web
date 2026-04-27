import React, { useState, useEffect } from 'react';
import { OraClient } from '../lib/OraClient';

const TIER_CONFIG: Record<string, { color: string; label: string }> = {
  observer:   { color: '#6b7280', label: 'Observer' },
  contributor:{ color: '#3b82f6', label: 'Contributor' },
  builder:    { color: '#8b5cf6', label: 'Builder' },
  steward:    { color: '#f4c26b', label: 'Steward' },
};

function TierBadge({ tier, isFoundingSteward }: { tier: string; isFoundingSteward?: boolean }) {
  if (isFoundingSteward) {
    return (
      <span style={{
        border: '1px solid #fbbf24',
        background: 'rgba(251,191,36,0.1)',
        color: '#fbbf24',
        fontSize: 10, fontWeight: 700, letterSpacing: 0.3,
        padding: '2px 7px', borderRadius: 5,
      }}>⚡ Founding Steward</span>
    );
  }
  const cfg = TIER_CONFIG[tier] || TIER_CONFIG.observer;
  return (
    <span style={{
      border: `1px solid ${cfg.color}`,
      color: cfg.color,
      fontSize: 10, fontWeight: 600,
      padding: '2px 7px', borderRadius: 5,
    }}>
      {cfg.label}
    </span>
  );
}

function ContributorRow({ item, rank }: { item: any; rank: number }) {
  const medals: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };
  const medal = medals[rank] || `#${rank}`;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      background: item.is_founding_steward ? 'rgba(251,191,36,0.04)' : '#12121a',
      border: `1px solid ${item.is_founding_steward ? 'rgba(251,191,36,0.3)' : 'rgba(255,255,255,0.07)'}`,
      borderRadius: 12,
      padding: 12,
      marginBottom: 8,
    }}>
      <div style={{ width: 28, textAlign: 'center' as const, fontSize: 18, flexShrink: 0 }}>
        {medal}
      </div>
      {item.github_avatar_url ? (
        <img
          src={item.github_avatar_url}
          alt=""
          style={{ width: 40, height: 40, borderRadius: 20, background: '#1a1a2e', flexShrink: 0 }}
        />
      ) : (
        <div style={{ width: 40, height: 40, borderRadius: 20, background: '#1a1a2e', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
          👤
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' as const, marginBottom: 3 }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>
            {item.display_name || item.github_username}
          </span>
          {item.is_founding_steward && (
            <span style={{ color: '#fbbf24', fontSize: 14 }}>⚡</span>
          )}
          <TierBadge tier={item.tier} isFoundingSteward={item.is_founding_steward} />
        </div>
        {item.recent_contribution_title && (
          <div style={{ fontSize: 12, color: 'rgba(248,248,252,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
            {item.recent_contribution_title}
          </div>
        )}
        {item.cp_this_month > 0 && (
          <div style={{ fontSize: 11, color: '#34d399', marginTop: 2, fontWeight: 500 }}>
            +{item.cp_this_month} CP this month
          </div>
        )}
      </div>
      <div style={{ textAlign: 'right' as const, flexShrink: 0 }}>
        <div style={{ color: '#f4c26b', fontWeight: 700, fontSize: 16 }}>
          {(item.total_cp || 0).toLocaleString()}
        </div>
        <div style={{ fontSize: 10, color: 'rgba(248,248,252,0.35)', letterSpacing: 0.5 }}>CP total</div>
      </div>
    </div>
  );
}

function FoundingStewardCard({ item, number }: { item: any; number: number }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      background: 'rgba(251,191,36,0.05)',
      border: '1px solid rgba(251,191,36,0.2)',
      borderRadius: 12, padding: 12, marginBottom: 8,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 16,
        background: 'rgba(251,191,36,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fbbf24', fontSize: 13, fontWeight: 800, flexShrink: 0,
      }}>
        #{number}
      </div>
      {item.github_avatar_url && (
        <img src={item.github_avatar_url} alt="" style={{ width: 38, height: 38, borderRadius: 19, flexShrink: 0 }} />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14 }}>
          {item.display_name || item.github_username}{' '}
          <span style={{ color: '#fbbf24' }}>⚡</span>
        </div>
        <div style={{ fontSize: 11, color: 'rgba(248,248,252,0.4)' }}>
          @{item.github_username} · {(item.total_cp || 0).toLocaleString()} CP
        </div>
      </div>
    </div>
  );
}

export default function DAOPage() {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [daoStats, setDaoStats] = useState<any>(null);
  const [foundingStewards, setFoundingStewards] = useState<any>(null);
  const [contributions, setContributions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'leaderboard' | 'contributions'>('leaderboard');

  useEffect(() => {
    Promise.all([
      OraClient.getDAOLeaderboard(20).catch(() => null),
      OraClient.getFoundingStewards().catch(() => null),
      OraClient.getDAOContributions(15).catch(() => null),
    ]).then(([lb, fs, contribs]) => {
      if (lb) {
        setLeaderboard(lb.leaderboard || []);
        setDaoStats({ total_contributors: lb.total_contributors, total_cp_awarded: lb.total_cp_awarded });
      }
      if (fs) setFoundingStewards(fs);
      if (contribs) setContributions(contribs.contributions || []);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px 80px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontWeight: 800, fontSize: 24, letterSpacing: -0.5 }}>🏛 Ascension DAO</h1>
        {daoStats && (
          <p style={{ fontSize: 13, color: 'rgba(248,248,252,0.4)', marginTop: 4 }}>
            {daoStats.total_contributors} contributors · {(daoStats.total_cp_awarded || 0).toLocaleString()} CP awarded
          </p>
        )}
      </div>

      {/* Join CTA */}
      <a
        href="https://t.me/ascensiontechai"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, rgba(0,212,170,0.1), rgba(99,102,241,0.1))',
          border: '1px solid rgba(0,212,170,0.25)',
          borderRadius: 14,
          padding: '14px 18px',
          marginBottom: 24,
          textDecoration: 'none',
        }}
      >
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#f8f8fc' }}>Join the DAO</div>
          <div style={{ fontSize: 12, color: 'rgba(248,248,252,0.45)', marginTop: 2 }}>
            Contribute to Connectome · Earn CP · Gain governance rights
          </div>
        </div>
        <span style={{ fontSize: 20 }}>→</span>
      </a>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {([
          { id: 'leaderboard', label: '🏆 Leaderboard' },
          { id: 'contributions', label: '⚡ Contributions' },
        ] as const).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '8px 16px',
              borderRadius: 10,
              fontSize: 13, fontWeight: 600,
              background: tab === t.id ? '#00d4aa' : 'rgba(255,255,255,0.07)',
              color: tab === t.id ? '#0a0a0f' : 'rgba(248,248,252,0.6)',
              border: 'none',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: 'rgba(248,248,252,0.3)' }}>Loading...</div>
      ) : (
        <>
          {tab === 'leaderboard' && (
            <div>
              {/* Tier guide */}
              <div style={{
                background: '#12121a',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 12,
                padding: '12px 16px',
                marginBottom: 20,
              }}>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' as const }}>
                  {Object.entries(TIER_CONFIG).map(([key, cfg]) => (
                    <span key={key} style={{ fontSize: 11, color: cfg.color }}>
                      {cfg.label}
                    </span>
                  ))}
                  <span style={{ fontSize: 11, color: '#fbbf24' }}>⚡ Founding Steward</span>
                </div>
              </div>

              {/* Leaderboard */}
              <div style={{ fontSize: 12, color: 'rgba(248,248,252,0.3)', fontWeight: 700, letterSpacing: 1, marginBottom: 12 }}>
                TOP CONTRIBUTORS
              </div>
              {leaderboard.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'rgba(248,248,252,0.35)' }}>
                  No contributors yet. Be the first!
                </div>
              ) : (
                leaderboard.map((item, i) => (
                  <ContributorRow key={item.id || i} item={item} rank={i + 1} />
                ))
              )}

              {/* Founding stewards */}
              {foundingStewards?.founding_stewards?.length > 0 && (
                <div style={{ marginTop: 28 }}>
                  <div style={{ fontSize: 17, fontWeight: 700, color: '#fbbf24', marginBottom: 8 }}>
                    ⚡ Founding Stewards
                  </div>
                  <p style={{ fontSize: 13, color: 'rgba(248,248,252,0.45)', lineHeight: 1.6, marginBottom: 14 }}>
                    The first 10 people to reach Steward tier are permanently recognized as Founding Stewards.
                    {foundingStewards.slots_remaining > 0
                      ? ` ${foundingStewards.slots_remaining} slots remaining.`
                      : ' All 10 seats filled.'}
                  </p>
                  {foundingStewards.founding_stewards.map((item: any) => (
                    <FoundingStewardCard key={item.id} item={item} number={item.founding_steward_number} />
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'contributions' && (
            <div>
              <div style={{ fontSize: 12, color: 'rgba(248,248,252,0.3)', fontWeight: 700, letterSpacing: 1, marginBottom: 12 }}>
                RECENT CONTRIBUTIONS
              </div>
              {contributions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'rgba(248,248,252,0.35)' }}>
                  No contributions yet.
                </div>
              ) : (
                contributions.map((item: any) => {
                  const typeEmoji: Record<string, string> = {
                    code: '💻', agent: '🧠', design: '🎨', doc: '📝', research: '🔬', feedback: '💬', community: '🌐',
                  };
                  return (
                    <div key={item.id} style={{
                      background: '#12121a',
                      border: '1px solid rgba(255,255,255,0.07)',
                      borderRadius: 12,
                      padding: 14,
                      marginBottom: 8,
                    }}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <span style={{ fontSize: 20, flexShrink: 0 }}>{typeEmoji[item.contribution_type] || '📌'}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.4 }}>{item.title}</div>
                          <div style={{ fontSize: 12, color: 'rgba(248,248,252,0.4)', marginTop: 2 }}>
                            @{item.github_username}
                            {item.tier ? ` · ${TIER_CONFIG[item.tier]?.label || item.tier}` : ''}
                            {item.is_founding_steward ? ' ⚡' : ''}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' as const, flexShrink: 0 }}>
                          <div style={{ color: '#f4c26b', fontWeight: 700 }}>{item.final_cp}</div>
                          <div style={{ fontSize: 10, color: 'rgba(248,248,252,0.35)' }}>CP</div>
                        </div>
                      </div>
                      {item.ora_evaluation && (
                        <div style={{
                          marginTop: 10,
                          background: 'rgba(99,102,241,0.08)',
                          borderLeft: '2px solid #6366f1',
                          borderRadius: '0 8px 8px 0',
                          padding: '8px 12px',
                        }}>
                          <div style={{ fontSize: 9, color: '#6366f1', fontWeight: 700, letterSpacing: 0.5, marginBottom: 3 }}>ORA'S TAKE</div>
                          <div style={{ fontSize: 12, color: 'rgba(248,248,252,0.55)', fontStyle: 'italic', lineHeight: 1.5 }}>
                            {item.ora_evaluation}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              {/* CP guide */}
              <div style={{
                marginTop: 20,
                background: '#12121a',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 14,
                padding: 16,
              }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>CP Guide</div>
                {[
                  { type: 'Code / Feature', range: '100–500 CP' },
                  { type: 'Agent Improvement', range: '200–800 CP' },
                  { type: 'Design', range: '50–300 CP' },
                  { type: 'Documentation', range: '25–150 CP' },
                  { type: 'Community', range: '50–200 CP' },
                ].map((row) => (
                  <div key={row.type} style={{
                    display: 'flex', justifyContent: 'space-between',
                    padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.06)',
                    fontSize: 13,
                  }}>
                    <span>{row.type}</span>
                    <span style={{ color: '#f4c26b', fontWeight: 600 }}>{row.range}</span>
                  </div>
                ))}
                <p style={{ fontSize: 11, color: 'rgba(248,248,252,0.35)', marginTop: 10, lineHeight: 1.6 }}>
                  Contributions that keep generating value keep earning CP monthly via LTV scoring.
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
