import React, { useState, useEffect } from 'react';
import { AuraClient } from '../lib/AuraClient';
import { authStorage } from '../lib/AuraClient';
import type { ServiceAttribution } from '../lib/AuraClient';
import { AURA_CONTACT_EMAIL, auraMailto } from '../lib/contact';

interface Service {
  id: string;
  name: string;
  description: string;
  price_usd: number | null;
  delivery_hours: number | null;
  agent: string;
  icon: string;
}

interface Order {
  id: string;
  service_id: string;
  service_name: string;
  service_icon: string;
  description: string;
  status: string;
  created_at: string;
  delivered_at: string | null;
  result?: string;
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  pending_payment: { color: '#9ca3af', bg: 'rgba(107,114,128,0.15)', label: '⏳ Pending Payment' },
  in_progress:     { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  label: '🔄 In Progress' },
  delivered:       { color: '#34d399', bg: 'rgba(52,211,153,0.12)',  label: '✅ Delivered' },
  failed:          { color: '#f87171', bg: 'rgba(248,113,113,0.1)',  label: '❌ Failed' },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending_payment;
  return (
    <span style={{
      background: cfg.bg, color: cfg.color,
      fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 6,
    }}>{cfg.label}</span>
  );
}

const isAiOsSetup = (service: Service) => service.id.startsWith('aura-ai-os-setup');

function getServiceAttribution(): ServiceAttribution {
  const params = new URLSearchParams(window.location.search);
  return {
    source: params.get('utm_source') || params.get('source') || undefined,
    campaign: params.get('utm_campaign') || params.get('campaign') || undefined,
    medium: params.get('utm_medium') || params.get('medium') || undefined,
    content: params.get('utm_content') || params.get('content') || undefined,
    term: params.get('utm_term') || params.get('term') || undefined,
    referrer: document.referrer || undefined,
  };
}

function formatDelivery(hours: number | null) {
  if (!hours) return '';
  if (hours % 24 === 0) return `${hours / 24} days`;
  return `${hours}h`;
}

// ─── Order Modal ────────────────────────────────────────────────────────────
function OrderModal({
  service,
  onClose,
  onOrder,
}: {
  service: Service;
  onClose: () => void;
  onOrder: (serviceId: string, description: string) => Promise<void>;
}) {
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!description.trim()) return;
    setLoading(true);
    await onOrder(service.id, description);
    setLoading(false);
  };

  if (service.id === 'custom') {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }} onClick={onClose}>
        <div
          style={{
            background: '#13131e', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '20px 20px 0 0', padding: 24, width: '100%', maxWidth: 540,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ fontSize: 32, marginBottom: 8 }}>{service.icon}</div>
          <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 6 }}>Custom Request</div>
          <div style={{ fontSize: 14, color: 'rgba(248,248,252,0.55)', marginBottom: 20, lineHeight: 1.6 }}>
            Email <a href={auraMailto('Custom Service Request')} style={{ color: '#00d4aa', textDecoration: 'none' }}>{AURA_CONTACT_EMAIL}</a> with your request.
            Nea will respond within 24 hours with a quote and timeline.
          </div>
          <a
            href={auraMailto('Custom Service Request')}
            style={{
              display: 'block', textAlign: 'center' as const,
              background: 'linear-gradient(135deg, #00d4aa, #6366f1)',
              color: '#0a0a0f', fontSize: 15, fontWeight: 700,
              padding: '14px 0', borderRadius: 12, textDecoration: 'none',
              marginBottom: 12,
            }}
          >📧 Email Nea</a>
          <button onClick={onClose} style={{ width: '100%', background: 'transparent', color: 'rgba(248,248,252,0.35)', fontSize: 14, padding: '10px 0', border: 'none', cursor: 'pointer' }}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }} onClick={onClose}>
      <div
        style={{
          background: '#13131e', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '20px 20px 0 0', padding: 24, width: '100%', maxWidth: 540,
          maxHeight: '90vh', overflowY: 'auto' as const,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ fontSize: 32, marginBottom: 8 }}>{service.icon}</div>
        <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 4 }}>{service.name}</div>
        <div style={{ fontSize: 13, color: 'rgba(248,248,252,0.45)', marginBottom: 16, lineHeight: 1.6 }}>
          {service.description}
        </div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <div style={{
            flex: 1, background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.2)',
            borderRadius: 10, padding: '10px 14px', textAlign: 'center' as const,
          }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#00d4aa' }}>${service.price_usd}</div>
            <div style={{ fontSize: 11, color: 'rgba(248,248,252,0.4)' }}>one-time</div>
          </div>
          <div style={{
            flex: 1, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: 10, padding: '10px 14px', textAlign: 'center' as const,
          }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#818cf8' }}>{formatDelivery(service.delivery_hours)}</div>
            <div style={{ fontSize: 11, color: 'rgba(248,248,252,0.4)' }}>delivery</div>
          </div>
        </div>

        <label style={{ fontSize: 12, color: 'rgba(248,248,252,0.5)', fontWeight: 600, display: 'block', marginBottom: 6 }}>
          Describe what you need *
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={`Tell Nea exactly what you need for your ${service.name.toLowerCase()}...`}
          rows={4}
          style={{
            width: '100%', background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 10, padding: '12px 14px', color: '#f8f8fc', fontSize: 14,
            marginBottom: 20, resize: 'vertical' as const, boxSizing: 'border-box' as const,
          }}
        />
        <button
          onClick={handleSubmit}
          disabled={!description.trim() || loading}
          style={{
            width: '100%',
            background: description.trim() ? 'linear-gradient(135deg, #00d4aa, #6366f1)' : 'rgba(255,255,255,0.08)',
            color: description.trim() ? '#0a0a0f' : 'rgba(248,248,252,0.3)',
            fontSize: 15, fontWeight: 700, padding: '14px 0', borderRadius: 12, border: 'none',
            cursor: description.trim() ? 'pointer' : 'not-allowed',
            marginBottom: 12,
          }}
        >
          {loading ? 'Redirecting to payment...' : `Proceed to Payment · $${service.price_usd}`}
        </button>
        <button onClick={onClose} style={{ width: '100%', background: 'transparent', color: 'rgba(248,248,252,0.35)', fontSize: 14, padding: '10px 0', border: 'none', cursor: 'pointer' }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Service Card ───────────────────────────────────────────────────────────
function ServiceCard({ service, onOrder }: { service: Service; onOrder: (s: Service) => void }) {
  const featured = isAiOsSetup(service);
  return (
    <div style={{
      background: featured
        ? 'linear-gradient(135deg, rgba(0,212,170,0.10), rgba(99,102,241,0.10))'
        : '#12121a',
      border: featured ? '1px solid rgba(0,212,170,0.35)' : '1px solid rgba(255,255,255,0.08)',
      borderRadius: 16, padding: 18,
      display: 'flex', flexDirection: 'column' as const, gap: 10,
      transition: 'border-color 0.15s',
      boxShadow: featured ? '0 12px 40px rgba(0,212,170,0.08)' : 'none',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontSize: 32 }}>{service.icon}</span>
        {service.price_usd ? (
          <div style={{
            background: 'rgba(0,212,170,0.12)', border: '1px solid rgba(0,212,170,0.3)',
            color: '#00d4aa', fontSize: 16, fontWeight: 800, padding: '4px 12px', borderRadius: 10,
          }}>${service.price_usd}</div>
        ) : (
          <div style={{
            background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)',
            color: '#fbbf24', fontSize: 13, fontWeight: 700, padding: '4px 12px', borderRadius: 10,
          }}>Custom</div>
        )}
      </div>
      <div style={{ fontWeight: 700, fontSize: 16 }}>{service.name}</div>
      {featured && (
        <div style={{
          alignSelf: 'flex-start', background: 'rgba(0,212,170,0.12)', color: '#00d4aa',
          border: '1px solid rgba(0,212,170,0.25)', borderRadius: 999,
          padding: '3px 10px', fontSize: 11, fontWeight: 800, letterSpacing: 0.4,
        }}>FOUNDER-LED SETUP</div>
      )}
      <div style={{ fontSize: 13, color: 'rgba(248,248,252,0.5)', lineHeight: 1.6, flex: 1 }}>
        {service.description}
      </div>
      {service.delivery_hours && (
        <div style={{ fontSize: 12, color: 'rgba(248,248,252,0.3)' }}>
          ⏱ Delivery in {formatDelivery(service.delivery_hours)}
        </div>
      )}
      <button
        onClick={() => onOrder(service)}
        style={{
          background: service.id === 'custom'
            ? 'rgba(251,191,36,0.12)'
            : 'linear-gradient(135deg, rgba(0,212,170,0.15), rgba(99,102,241,0.15))',
          border: service.id === 'custom'
            ? '1px solid rgba(251,191,36,0.3)'
            : '1px solid rgba(0,212,170,0.3)',
          color: service.id === 'custom' ? '#fbbf24' : '#00d4aa',
          fontSize: 14, fontWeight: 700,
          padding: '11px 0', borderRadius: 12,
          cursor: 'pointer',
          marginTop: 4,
        }}
      >
        {service.id === 'custom' ? 'Contact Nea →' : featured ? 'Reserve Setup →' : 'Order Now →'}
      </button>
    </div>
  );
}

// ─── Main Services Page ─────────────────────────────────────────────────────
export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [toast, setToast] = useState('');
  const isLoggedIn = authStorage.isAuthenticated();
  const sortedServices = [...services].sort((a, b) => Number(isAiOsSetup(b)) - Number(isAiOsSetup(a)));

  useEffect(() => {
    Promise.all([
      AuraClient.getServicesCatalog().catch(() => null),
      isLoggedIn ? AuraClient.getMyServiceOrders().catch(() => null) : Promise.resolve(null),
    ]).then(([catalog, myOrders]) => {
      if (catalog) setServices(catalog.services || []);
      if (myOrders) setOrders(myOrders.orders || []);
    }).finally(() => setLoading(false));
  }, [isLoggedIn]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 5000);
  };

  const handleOrder = async (serviceId: string, description: string) => {
    try {
      const res = await AuraClient.createServiceOrder(serviceId, description, undefined, getServiceAttribution());
      setSelectedService(null);
      if (res.custom) {
        window.location.href = res.checkout_url;
        return;
      }
      if (res.checkout_url) {
        window.location.href = res.checkout_url;
      } else {
        showToast('Order created! Check your email for updates.');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Failed to create order. Please try again.';
      showToast(msg);
    }
  };

  return (
    <div className="page-content" style={{ maxWidth: 640, margin: '0 auto' }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
          background: '#1a1a2e', border: '1px solid rgba(0,212,170,0.3)',
          color: '#f8f8fc', padding: '12px 20px', borderRadius: 12,
          fontSize: 14, fontWeight: 600, zIndex: 2000, maxWidth: 340,
          boxShadow: '0 4px 24px rgba(0,0,0,0.4)', textAlign: 'center' as const,
        }}>{toast}</div>
      )}

      {/* Order modal */}
      {selectedService && (
        <OrderModal
          service={selectedService}
          onClose={() => setSelectedService(null)}
          onOrder={handleOrder}
        />
      )}

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontWeight: 800, fontSize: 24, letterSpacing: -0.5 }}>⚡ Work with Nea</h1>
        <p style={{ fontSize: 14, color: 'rgba(248,248,252,0.45)', marginTop: 6, lineHeight: 1.6 }}>
          Founder-led AI OS setup plus AI-powered digital services.
          <br />Secure Stripe checkout. Delivery to your inbox.
        </p>
      </div>

      {/* Featured revenue sprint */}
      <div style={{
        background: 'radial-gradient(circle at top left, rgba(0,212,170,0.22), transparent 45%), linear-gradient(135deg, rgba(99,102,241,0.16), rgba(0,212,170,0.08))',
        border: '1px solid rgba(0,212,170,0.28)',
        borderRadius: 18, padding: 20, marginBottom: 24,
      }}>
        <div style={{ fontSize: 12, color: '#00d4aa', fontWeight: 800, letterSpacing: 1, marginBottom: 8 }}>
          FOUNDER BETA · 3 PRIVATE BUILDS
        </div>
        <div style={{ fontWeight: 850, fontSize: 22, letterSpacing: -0.5, marginBottom: 8 }}>
          Aura Personal AI OS Setup
        </div>
        <div style={{ fontSize: 14, color: 'rgba(248,248,252,0.62)', lineHeight: 1.65, marginBottom: 14 }}>
          Avi turns your goals, knowledge, work, and habits into a practical AI-powered operating system — with a custom Aura persona, workflow map, and 30-day implementation path.
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' as const, marginBottom: 16 }}>
          {['Founder-led setup', '7-day beta from $1,500', 'Standard 14-day build'].map((text) => (
            <span key={text} style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 999, padding: '6px 10px', fontSize: 12, color: 'rgba(248,248,252,0.68)',
            }}>{text}</span>
          ))}
        </div>
        <button
          onClick={() => {
            const beta = services.find((s) => s.id === 'aura-ai-os-setup-beta') || services.find(isAiOsSetup);
            if (beta) setSelectedService(beta);
          }}
          disabled={!services.some(isAiOsSetup)}
          style={{
            width: '100%', background: 'linear-gradient(135deg, #00d4aa, #6366f1)',
            color: '#0a0a0f', fontSize: 15, fontWeight: 800, padding: '13px 0',
            borderRadius: 12, border: 'none', cursor: services.some(isAiOsSetup) ? 'pointer' : 'not-allowed',
          }}
        >Reserve Founder Beta →</button>
      </div>

      {/* Trust bar */}
      <div style={{
        display: 'flex', gap: 16, marginBottom: 28,
        padding: '12px 16px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 12, flexWrap: 'wrap' as const,
      }}>
        {[
          { icon: '🤖', text: 'Powered by Aura AI' },
          { icon: '⚡', text: 'Fast delivery' },
          { icon: '🔒', text: 'Secure payment' },
          { icon: '✉️', text: 'Delivered to inbox' },
        ].map((item) => (
          <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 14 }}>{item.icon}</span>
            <span style={{ fontSize: 12, color: 'rgba(248,248,252,0.4)' }}>{item.text}</span>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: 'rgba(248,248,252,0.3)' }}>Loading services...</div>
      ) : (
        <>
          {/* Service cards grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14, marginBottom: 32 }}>
            {sortedServices.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onOrder={setSelectedService}
              />
            ))}
          </div>

          {/* Custom request CTA */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(251,191,36,0.06), rgba(99,102,241,0.06))',
            border: '1px solid rgba(251,191,36,0.2)',
            borderRadius: 14, padding: 18, marginBottom: 32,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Have a custom request?</div>
              <div style={{ fontSize: 13, color: 'rgba(248,248,252,0.45)', marginTop: 4 }}>
                Nea handles anything. Email for a quote.
              </div>
            </div>
            <a
              href={auraMailto('Custom Service Request')}
              style={{
                background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)',
                color: '#fbbf24', fontSize: 13, fontWeight: 700,
                padding: '10px 16px', borderRadius: 10, textDecoration: 'none', flexShrink: 0,
              }}
            >Email Nea →</a>
          </div>

          {/* My Orders section */}
          {isLoggedIn && (
            <div>
              <div style={{ fontSize: 12, color: 'rgba(248,248,252,0.3)', fontWeight: 700, letterSpacing: 1, marginBottom: 14 }}>
                MY ORDERS
              </div>
              {orders.length === 0 ? (
                <div style={{
                  background: '#12121a', border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 12, padding: '24px 16px', textAlign: 'center' as const,
                  color: 'rgba(248,248,252,0.3)', fontSize: 14,
                }}>
                  No orders yet. Place your first order above!
                </div>
              ) : (
                orders.map((order) => (
                  <div key={order.id} style={{
                    background: '#12121a', border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 12, padding: 14, marginBottom: 10,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <span style={{ fontSize: 22, flexShrink: 0 }}>{order.service_icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{order.service_name}</div>
                        <div style={{ fontSize: 12, color: 'rgba(248,248,252,0.4)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                          {order.description}
                        </div>
                        <div style={{ fontSize: 11, color: 'rgba(248,248,252,0.25)', marginTop: 4 }}>
                          {new Date(order.created_at).toLocaleDateString()}
                          {order.delivered_at ? ` · Delivered ${new Date(order.delivered_at).toLocaleDateString()}` : ''}
                        </div>
                      </div>
                      <StatusBadge status={order.status} />
                    </div>
                    {order.result && order.status === 'delivered' && (
                      <div style={{
                        marginTop: 10, background: 'rgba(52,211,153,0.05)',
                        border: '1px solid rgba(52,211,153,0.15)',
                        borderRadius: 8, padding: '8px 12px',
                      }}>
                        <div style={{ fontSize: 10, color: '#34d399', fontWeight: 700, marginBottom: 4 }}>RESULT PREVIEW</div>
                        <div style={{
                          fontSize: 12, color: 'rgba(248,248,252,0.5)', lineHeight: 1.5,
                          overflow: 'hidden', display: '-webkit-box',
                          WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' as const,
                        }}>
                          {order.result}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
