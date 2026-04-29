/**
 * IOO Page — IRL Experience Achievement Map (Phase 1)
 *
 * Shows the user's active goals and the next 3 recommended IOO nodes for each.
 * Each node is a card with title, type badge, estimated time/cost, and a Start button.
 */

import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const API = 'https://connectome-api-production.up.railway.app'

const TYPE_COLORS: Record<string, string> = {
  activity:   '#3b82f6',
  experience: '#8b5cf6',
  sub_goal:   '#f59e0b',
  goal:       '#10b981',
}

const TYPE_LABELS: Record<string, string> = {
  activity:   'Activity',
  experience: 'Experience',
  sub_goal:   'Sub-Goal',
  goal:       'Goal',
}

const DOMAIN_COLORS: Record<string, string> = {
  iVive:  '#06b6d4',
  Eviva:  '#f43f5e',
  Animus: '#a855f7',
}

interface IOONode {
  id: string
  type: string
  title: string
  description?: string
  tags?: string[]
  domain?: string
  requires_finances?: number
  requires_time_hours?: number
  requires_fitness_level?: number
  edge_weight?: number
  success_rate?: number
}

interface Goal {
  id: string
  title: string
  description?: string
  status: string
  domain?: string
}

function NodeCard({
  node,
  goalId,
  onStart,
}: {
  node: IOONode
  goalId: string
  onStart: (node: IOONode, goalId: string) => void
}) {
  const typeColor = TYPE_COLORS[node.type] || '#6b7280'
  const domainColor = node.domain ? (DOMAIN_COLORS[node.domain] || '#6b7280') : undefined

  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 16,
      padding: '16px 18px',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      transition: 'border-color 0.15s',
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 5 }}>
            {/* Type badge */}
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
              color: typeColor, background: typeColor + '20',
              padding: '2px 8px', borderRadius: 20,
              textTransform: 'uppercase',
            }}>
              {TYPE_LABELS[node.type] || node.type}
            </span>
            {/* Domain badge */}
            {node.domain && (
              <span style={{
                fontSize: 10, fontWeight: 600,
                color: domainColor, background: (domainColor || '#6b7280') + '20',
                padding: '2px 8px', borderRadius: 20,
              }}>
                {node.domain}
              </span>
            )}
          </div>
          <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.3 }}>
            {node.title}
          </div>
        </div>
      </div>

      {/* Description */}
      {node.description && (
        <div style={{ fontSize: 13, color: 'rgba(248,248,252,0.5)', lineHeight: 1.5 }}>
          {node.description}
        </div>
      )}

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {node.requires_time_hours != null && (
          <div style={{ fontSize: 12, color: 'rgba(248,248,252,0.45)' }}>
            ⏱ {node.requires_time_hours}h
          </div>
        )}
        {node.requires_finances != null && node.requires_finances > 0 && (
          <div style={{ fontSize: 12, color: 'rgba(248,248,252,0.45)' }}>
            💰 ~${node.requires_finances.toFixed(0)}
          </div>
        )}
        {node.requires_fitness_level != null && node.requires_fitness_level > 0 && (
          <div style={{ fontSize: 12, color: 'rgba(248,248,252,0.45)' }}>
            💪 Fitness {node.requires_fitness_level}/10
          </div>
        )}
      </div>

      {/* Tags */}
      {node.tags && node.tags.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {node.tags.slice(0, 4).map(tag => (
            <span key={tag} style={{
              fontSize: 11, color: 'rgba(248,248,252,0.3)',
              background: 'rgba(255,255,255,0.05)',
              padding: '1px 8px', borderRadius: 12,
            }}>#{tag}</span>
          ))}
        </div>
      )}

      {/* CTA */}
      <button
        onClick={() => onStart(node, goalId)}
        style={{
          marginTop: 4,
          background: 'linear-gradient(135deg, rgba(0,212,170,0.15), rgba(0,212,170,0.25))',
          border: '1px solid rgba(0,212,170,0.35)',
          color: '#00d4aa',
          borderRadius: 12,
          padding: '10px 18px',
          fontSize: 13,
          fontWeight: 700,
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'all 0.15s',
          width: '100%',
        }}
      >
        Start →
      </button>
    </div>
  )
}

export default function IOOPage() {
  const { token } = useAuth() as any
  const navigate = useNavigate()

  const [goals, setGoals] = useState<Goal[]>([])
  const [nodesByGoal, setNodesByGoal] = useState<Record<string, IOONode[]>>({})
  const [globalNodes, setGlobalNodes] = useState<IOONode[]>([])
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)
  const [seedDone, setSeedDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [startedNode, setStartedNode] = useState<string | null>(null)

  const authHeaders = { Authorization: `Bearer ${token}` }

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      // Load active goals
      const goalsRes = await fetch(`${API}/api/goals`, { headers: authHeaders })
      const goalsData = await goalsRes.json()
      const activeGoals: Goal[] = (goalsData.goals || []).filter((g: Goal) => g.status === 'active').slice(0, 5)
      setGoals(activeGoals)

      // Load recommendations per goal
      const byGoal: Record<string, IOONode[]> = {}
      for (const goal of activeGoals) {
        try {
          const res = await fetch(`${API}/api/ioo/graph?goal_id=${goal.id}&limit=3`, { headers: authHeaders })
          const data = await res.json()
          byGoal[goal.id] = data.nodes || []
        } catch {
          byGoal[goal.id] = []
        }
      }
      setNodesByGoal(byGoal)

      // Also load global top nodes (no goal filter)
      const globalRes = await fetch(`${API}/api/ioo/graph?limit=5`, { headers: authHeaders })
      const globalData = await globalRes.json()
      setGlobalNodes(globalData.nodes || [])
    } catch (e: any) {
      setError('Failed to load map data. Try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSeed() {
    setSeeding(true)
    try {
      await fetch(`${API}/api/ioo/seed`, { method: 'POST', headers: authHeaders })
      setSeedDone(true)
      await loadData()
    } catch {
      setError('Seed failed')
    } finally {
      setSeeding(false)
    }
  }

  async function handleStart(node: IOONode, goalId: string) {
    setStartedNode(node.id)
    try {
      await fetch(`${API}/api/ioo/progress`, {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          node_id: node.id,
          goal_id: goalId || undefined,
          status: 'started',
          surface_type: 'feed_card',
        }),
      })
      // Check if there's a surface for this node
      const surfRes = await fetch(`${API}/api/ioo/surfaces/${node.id}`, { headers: authHeaders })
      const surfData = await surfRes.json()
      const surface = (surfData.surfaces || [])[0]
      if (surface) {
        navigate(`/surfaces/${surface.id}`)
      } else {
        // Briefly show started state then reload
        setTimeout(() => {
          setStartedNode(null)
          loadData()
        }, 1200)
      }
    } catch {
      setStartedNode(null)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // ── Render ────────────────────────────────────────────────────────────
  const containerStyle: React.CSSProperties = {
    maxWidth: 720,
    margin: '0 auto',
    padding: '80px 20px 120px',
  }

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={{ color: 'rgba(248,248,252,0.4)', fontSize: 14, textAlign: 'center', marginTop: 60 }}>
          Loading your map…
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={containerStyle}>
        <div style={{ color: '#f87171', fontSize: 14, textAlign: 'center', marginTop: 60 }}>
          {error}
          <br />
          <button onClick={loadData} style={{ marginTop: 12, color: '#00d4aa', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}>
            Retry
          </button>
        </div>
      </div>
    )
  }

  const noNodes = globalNodes.length === 0 && Object.values(nodesByGoal).every(n => n.length === 0)

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, letterSpacing: -0.5 }}>
          🗺 Experience Map
        </h1>
        <p style={{ fontSize: 14, color: 'rgba(248,248,252,0.45)', marginTop: 6, marginBottom: 0 }}>
          Real-world steps toward your goals — ranked by what actually works.
        </p>
      </div>

      {/* Seed prompt if empty */}
      {noNodes && (
        <div style={{
          background: 'rgba(0,212,170,0.06)',
          border: '1px dashed rgba(0,212,170,0.25)',
          borderRadius: 16,
          padding: '24px 20px',
          textAlign: 'center',
          marginBottom: 32,
        }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>🌱</div>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>Map is empty</div>
          <div style={{ fontSize: 13, color: 'rgba(248,248,252,0.45)', marginBottom: 16 }}>
            Seed 20 starter nodes across fitness, travel, creativity, community & music.
          </div>
          <button
            onClick={handleSeed}
            disabled={seeding}
            style={{
              background: 'linear-gradient(135deg, rgba(0,212,170,0.2), rgba(0,212,170,0.35))',
              border: '1px solid rgba(0,212,170,0.4)',
              color: '#00d4aa',
              borderRadius: 12,
              padding: '10px 24px',
              fontSize: 14,
              fontWeight: 700,
              cursor: seeding ? 'wait' : 'pointer',
            }}
          >
            {seeding ? 'Seeding…' : '+ Seed Starter Nodes'}
          </button>
          {seedDone && (
            <div style={{ marginTop: 10, fontSize: 12, color: '#00d4aa' }}>✓ Seeded!</div>
          )}
        </div>
      )}

      {/* Goals with recommended nodes */}
      {goals.map(goal => {
        const nodes = nodesByGoal[goal.id] || []
        const domainColor = goal.domain ? (DOMAIN_COLORS[goal.domain] || '#6b7280') : '#6b7280'
        return (
          <div key={goal.id} style={{ marginBottom: 36 }}>
            {/* Goal header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{
                width: 8, height: 8, borderRadius: 4,
                background: domainColor,
                boxShadow: `0 0 8px ${domainColor}60`,
                flexShrink: 0,
              }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{goal.title}</div>
                {goal.domain && (
                  <div style={{ fontSize: 11, color: domainColor, fontWeight: 600, letterSpacing: 0.5 }}>
                    {goal.domain}
                  </div>
                )}
              </div>
            </div>

            {nodes.length === 0 ? (
              <div style={{ fontSize: 13, color: 'rgba(248,248,252,0.3)', paddingLeft: 18 }}>
                No recommended steps yet. Seed the map to get started.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {nodes.map(node => (
                  <NodeCard
                    key={node.id}
                    node={node}
                    goalId={goal.id}
                    onStart={handleStart}
                  />
                ))}
              </div>
            )}
          </div>
        )
      })}

      {/* Global top nodes (when no goals or as supplemental) */}
      {globalNodes.length > 0 && (
        <div style={{ marginTop: goals.length > 0 ? 24 : 0 }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16, color: 'rgba(248,248,252,0.6)' }}>
            {goals.length === 0 ? 'Top Nodes to Explore' : 'Also Worth Exploring'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {globalNodes.map(node => (
              <NodeCard
                key={node.id}
                node={node}
                goalId=""
                onStart={handleStart}
              />
            ))}
          </div>
        </div>
      )}

      {/* Browse all */}
      {!noNodes && (
        <div style={{ marginTop: 36, textAlign: 'center' }}>
          <button
            onClick={() => navigate('/ioo/browse')}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(248,248,252,0.4)',
              borderRadius: 12,
              padding: '10px 24px',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Browse all nodes →
          </button>
        </div>
      )}

      {/* Started overlay */}
      {startedNode && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(10,10,15,0.85)',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🚀</div>
            <div style={{ fontWeight: 800, fontSize: 20, color: '#00d4aa' }}>Started!</div>
            <div style={{ fontSize: 13, color: 'rgba(248,248,252,0.5)', marginTop: 8 }}>
              Ora is tracking your progress.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
