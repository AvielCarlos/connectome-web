/**
 * CollectionPicker — Pinterest/Airbnb-style save sheet.
 *
 * Shows a bottom sheet with user's collections.
 * Allows saving to an existing collection or creating a new one.
 * Fires on-save callback with collection name for toast feedback.
 */
import React, { useEffect, useState, useRef } from 'react';
import { AuraClient } from '../lib/AuraClient';

interface Collection {
  id: string;
  name: string;
  emoji: string;
  color: string;
  item_count: number;
}

interface Props {
  card: {
    screen_spec_id: string;
    card_title?: string;
    card_body?: string;
    card_domain?: string;
    card_color?: string;
  };
  onClose: () => void;
  onSaved: (collectionName: string) => void;
}

const PRESET_EMOJIS = ['✦', '🌟', '🎯', '🌊', '🏔', '🌸', '💫', '🔥', '🎨', '🧭'];
const PRESET_COLORS = ['#00d4aa', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6', '#10b981', '#3b82f6', '#ec4899'];

export function CollectionPicker({ card, onClose, onSaved }: Props) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState('✦');
  const [newColor, setNewColor] = useState('#00d4aa');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadCollections();
  }, []);

  useEffect(() => {
    if (creatingNew) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [creatingNew]);

  const loadCollections = async () => {
    try {
      const data = await AuraClient.get<Collection[]>('/api/gamification/collections');
      setCollections(data);
    } catch {
      setCollections([]);
    } finally {
      setLoading(false);
    }
  };

  const saveToCollection = async (collId: string, collName: string) => {
    setSaving(collId);
    try {
      await AuraClient.post(`/api/gamification/collections/${collId}/items`, {
        screen_spec_id: card.screen_spec_id,
        card_title: card.card_title,
        card_body: card.card_body,
        card_domain: card.card_domain,
        card_color: card.card_color,
      });
      onSaved(collName);
      onClose();
    } catch {
      onSaved('Saved'); // Optimistic
      onClose();
    } finally {
      setSaving(null);
    }
  };

  const quickSave = async () => {
    setSaving('quick');
    try {
      await AuraClient.post('/api/gamification/save', {
        screen_spec_id: card.screen_spec_id,
        card_title: card.card_title,
        card_body: card.card_body,
        card_domain: card.card_domain,
        card_color: card.card_color,
      });
      onSaved('Saved');
      onClose();
    } catch {
      onSaved('Saved');
      onClose();
    } finally {
      setSaving(null);
    }
  };

  const createAndSave = async () => {
    const name = newName.trim();
    if (!name) return;
    setSaving('new');
    try {
      const newColl = await AuraClient.post<Collection>('/api/gamification/collections', {
        name,
        emoji: newEmoji,
        color: newColor,
      });
      await saveToCollection(newColl.id, newColl.name);
    } catch {
      onSaved(name);
      onClose();
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(10px)',
        display: 'flex', alignItems: 'flex-end',
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxHeight: '80vh',
          background: '#13131f',
          borderRadius: '28px 28px 0 0',
          border: '1px solid rgba(255,255,255,0.1)',
          borderBottom: 'none',
          overflowY: 'auto',
          animation: 'slideUpSheet 0.3s cubic-bezier(.25,.8,.25,1)',
        }}
      >
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '14px 0 4px' }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)' }} />
        </div>

        <div style={{ padding: '8px 20px 40px' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#f8f8fc' }}>Save to collection</div>
              <div style={{ fontSize: 12, color: 'rgba(248,248,252,0.35)', marginTop: 2 }}>
                {card.card_title ? `"${card.card_title.slice(0, 40)}…"` : 'Save this card'}
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                width: 34, height: 34, borderRadius: 17,
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(248,248,252,0.5)', fontSize: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >✕</button>
          </div>

          {/* Quick save button */}
          <button
            onClick={quickSave}
            disabled={saving === 'quick'}
            className="save-flash"
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, rgba(0,212,170,0.15), rgba(0,212,170,0.25))',
              border: '1.5px solid rgba(0,212,170,0.4)',
              borderRadius: 16, padding: '14px 18px',
              display: 'flex', alignItems: 'center', gap: 12,
              marginBottom: 16, transition: 'all 0.15s',
            }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'rgba(0,212,170,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, color: '#00d4aa',
            }}>✦</div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#00d4aa' }}>Save</div>
              <div style={{ fontSize: 11, color: 'rgba(0,212,170,0.6)', marginTop: 2 }}>Add to your Saved collection</div>
            </div>
            {saving === 'quick' && <div style={{ marginLeft: 'auto', fontSize: 18 }}>◈</div>}
          </button>

          {/* Existing collections */}
          {loading ? (
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton" style={{ flex: 1, height: 72, borderRadius: 14 }} />
              ))}
            </div>
          ) : collections.length > 0 ? (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(248,248,252,0.3)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>
                Your collections
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {collections.map((col) => (
                  <button
                    key={col.id}
                    onClick={() => saveToCollection(col.id, col.name)}
                    disabled={!!saving}
                    style={{
                      background: saving === col.id ? col.color + '20' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${saving === col.id ? col.color + '55' : 'rgba(255,255,255,0.08)'}`,
                      borderRadius: 14, padding: '12px 16px',
                      display: 'flex', alignItems: 'center', gap: 12,
                      transition: 'all 0.15s', textAlign: 'left',
                    }}
                  >
                    <div style={{
                      width: 40, height: 40, borderRadius: 12,
                      background: col.color + '18',
                      border: `1px solid ${col.color}33`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 18,
                    }}>{col.emoji}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#f8f8fc' }}>{col.name}</div>
                      <div style={{ fontSize: 11, color: 'rgba(248,248,252,0.35)', marginTop: 2 }}>
                        {col.item_count} {col.item_count === 1 ? 'item' : 'items'}
                      </div>
                    </div>
                    {saving === col.id ? (
                      <div style={{ fontSize: 18, color: col.color }}>◈</div>
                    ) : (
                      <div style={{ fontSize: 18, color: 'rgba(248,248,252,0.2)' }}>›</div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {/* Create new */}
          {!creatingNew ? (
            <button
              onClick={() => setCreatingNew(true)}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.04)',
                border: '1px dashed rgba(255,255,255,0.15)',
                borderRadius: 14, padding: '14px',
                fontSize: 14, color: 'rgba(248,248,252,0.5)', fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              <span style={{ fontSize: 18 }}>+</span> New collection
            </button>
          ) : (
            <div style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 16, padding: '16px',
              animation: 'fadeIn 0.2s ease-out',
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(248,248,252,0.4)', marginBottom: 12, letterSpacing: 0.5 }}>
                NEW COLLECTION
              </div>

              {/* Name input */}
              <input
                ref={inputRef}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && newName.trim() && createAndSave()}
                placeholder="Collection name"
                style={{
                  width: '100%', background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
                  padding: '11px 14px', fontSize: 15, color: '#f8f8fc', outline: 'none',
                  marginBottom: 12, boxSizing: 'border-box',
                }}
              />

              {/* Emoji picker */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                {PRESET_EMOJIS.map((e) => (
                  <button
                    key={e}
                    onClick={() => setNewEmoji(e)}
                    style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: newEmoji === e ? 'rgba(0,212,170,0.15)' : 'rgba(255,255,255,0.06)',
                      border: `1px solid ${newEmoji === e ? 'rgba(0,212,170,0.4)' : 'rgba(255,255,255,0.08)'}`,
                      fontSize: 18,
                    }}
                  >{e}</button>
                ))}
              </div>

              {/* Color picker */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setNewColor(c)}
                    style={{
                      width: 26, height: 26, borderRadius: 13,
                      background: c,
                      border: `2px solid ${newColor === c ? '#fff' : 'transparent'}`,
                      outline: newColor === c ? `2px solid ${c}` : 'none',
                      outlineOffset: 2,
                      transition: 'transform 0.1s',
                      transform: newColor === c ? 'scale(1.15)' : 'scale(1)',
                    }}
                  />
                ))}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setCreatingNew(false)}
                  style={{
                    flex: 1, padding: '12px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12, color: 'rgba(248,248,252,0.5)', fontSize: 14,
                  }}
                >Cancel</button>
                <button
                  onClick={createAndSave}
                  disabled={!newName.trim() || saving === 'new'}
                  style={{
                    flex: 2, padding: '12px',
                    background: newName.trim() ? newColor : 'rgba(255,255,255,0.1)',
                    border: 'none', borderRadius: 12,
                    color: '#0a0a0f', fontSize: 14, fontWeight: 700,
                    opacity: newName.trim() ? 1 : 0.4,
                    transition: 'all 0.15s',
                  }}
                >
                  {saving === 'new' ? 'Creating…' : `${newEmoji} Create & Save`}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideUpSheet {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
