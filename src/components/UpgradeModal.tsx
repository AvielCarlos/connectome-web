/**
 * UpgradeModal — shown when a user hits a tier limit (402 response).
 *
 * Displays Ora's warm upgrade message, a tier comparison table,
 * and routes to Stripe Checkout on click.
 */

import React, { useEffect, useState } from 'react';
import { OraClient, OrasTier, TiersResponse } from '../lib/OraClient';

const ora = OraClient;

// ─── Types ────────────────────────────────────────────────────────────────────

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Ora's warm message for the specific limit hit */
  upgradeMessage?: string;
  /** Which resource triggered the limit (e.g. "daily_screens") */
  resource?: string;
  /** User's current tier */
  currentTier?: string;
}

type BillingCycle = 'monthly' | 'yearly';

// ─── Tier Colors & Icons ──────────────────────────────────────────────────────

const TIER_STYLES: Record<string, { bg: string; border: string; badge: string; icon: string }> = {
  free: {
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    badge: 'bg-gray-100 text-gray-600',
    icon: '✦',
  },
  explorer: {
    bg: 'bg-indigo-50',
    border: 'border-indigo-300',
    badge: 'bg-indigo-600 text-white',
    icon: '🧭',
  },
  sovereign: {
    bg: 'bg-purple-50',
    border: 'border-purple-400',
    badge: 'bg-purple-700 text-white',
    icon: '👑',
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  upgradeMessage,
  resource,
  currentTier = 'free',
}) => {
  const [tiers, setTiers] = useState<TiersResponse | null>(null);
  const [billing, setBilling] = useState<BillingCycle>('monthly');
  const [loading, setLoading] = useState(false);
  const [checkoutTier, setCheckoutTier] = useState<'explorer' | 'sovereign' | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load tier definitions when modal opens
  useEffect(() => {
    if (isOpen && !tiers) {
      ora.getTiers().then(setTiers).catch(console.error);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleUpgrade = async (tier: 'explorer' | 'sovereign') => {
    setLoading(true);
    setCheckoutTier(tier);
    setError(null);
    try {
      const session = await ora.createCheckout(
        tier,
        billing,
        `${window.location.origin}/upgrade/success`,
        `${window.location.origin}/upgrade`,
      );
      window.location.href = session.checkout_url;
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ||
        'Could not start checkout. Please try again.';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
      setLoading(false);
      setCheckoutTier(null);
    }
  };

  const paidTiers = tiers
    ? (['explorer', 'sovereign'] as const).filter((k) => k in tiers.tiers)
    : [];

  const defaultMessage =
    "You've reached your plan limit ✦\n\nExplorer unlocks the full Ora experience — " +
    'unlimited discovery, goals, and coaching. $12.99/mo.';

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Modal */}
      <div className="relative mx-4 w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white text-xl font-light"
            aria-label="Close"
          >
            ✕
          </button>
          <h2 className="text-white text-xl font-semibold">Unlock More with Ora ✦</h2>
          <p className="text-indigo-100 text-sm mt-1">
            {resource === 'daily_screens'
              ? "You've explored today's cards — come back tomorrow or unlock unlimited."
              : "You've reached your plan limit."}
          </p>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* Ora's message */}
          {(upgradeMessage || defaultMessage) && (
            <div className="rounded-xl bg-indigo-50 border border-indigo-100 px-4 py-3">
              <p className="text-indigo-800 text-sm leading-relaxed whitespace-pre-line">
                {upgradeMessage || defaultMessage}
              </p>
            </div>
          )}

          {/* Billing toggle */}
          <div className="flex justify-center gap-2">
            <button
              onClick={() => setBilling('monthly')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                billing === 'monthly'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling('yearly')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                billing === 'yearly'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Yearly
              <span className="ml-1.5 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                Save ~35%
              </span>
            </button>
          </div>

          {/* Tier cards */}
          {!tiers ? (
            <div className="text-center py-8 text-gray-400 text-sm">Loading plans…</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {paidTiers.map((tierKey) => {
                const tier = tiers.tiers[tierKey] as OrasTier;
                const style = TIER_STYLES[tierKey] || TIER_STYLES.explorer;
                const price =
                  billing === 'monthly' ? tier.price_monthly : tier.price_yearly;
                const perMonth =
                  billing === 'yearly' ? (tier.price_yearly / 12).toFixed(2) : null;
                const isCurrent = tierKey === currentTier;
                const isLoading = loading && checkoutTier === tierKey;

                return (
                  <div
                    key={tierKey}
                    className={`relative rounded-xl border-2 ${style.bg} ${style.border} p-4 flex flex-col gap-3`}
                  >
                    {/* Tier badge */}
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{style.icon}</span>
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${style.badge}`}
                      >
                        {tier.name}
                      </span>
                      {isCurrent && (
                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                          Current
                        </span>
                      )}
                    </div>

                    {/* Price */}
                    <div>
                      <span className="text-2xl font-bold text-gray-900">
                        ${billing === 'yearly' ? tier.price_yearly : price}
                      </span>
                      <span className="text-gray-500 text-sm">
                        /{billing === 'yearly' ? 'yr' : 'mo'}
                      </span>
                      {perMonth && (
                        <p className="text-green-600 text-xs mt-0.5">
                          ≈ ${perMonth}/mo — billed yearly
                        </p>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-gray-600 text-xs">{tier.description}</p>

                    {/* Features */}
                    <ul className="space-y-1 flex-1">
                      {tier.features.slice(0, 5).map((f, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs text-gray-700">
                          <span className="text-indigo-500 mt-0.5">✓</span>
                          {f}
                        </li>
                      ))}
                      {tier.features.length > 5 && (
                        <li className="text-xs text-gray-400">
                          +{tier.features.length - 5} more…
                        </li>
                      )}
                    </ul>

                    {/* CTA */}
                    <button
                      onClick={() => handleUpgrade(tierKey)}
                      disabled={loading || isCurrent}
                      className={`w-full py-2 rounded-lg text-sm font-semibold transition-all ${
                        isCurrent
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : tierKey === 'sovereign'
                          ? 'bg-purple-700 hover:bg-purple-800 text-white'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      } disabled:opacity-60`}
                    >
                      {isLoading
                        ? 'Starting checkout…'
                        : isCurrent
                        ? 'Your current plan'
                        : `Upgrade to ${tier.name}`}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Footer */}
          <p className="text-center text-xs text-gray-400">
            Secure checkout via Stripe · Cancel anytime · No hidden fees
          </p>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;
