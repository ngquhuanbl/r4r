/** Spec 7: Starter (0), Velocity (1), Momentum (2). */

export const TIER_STARTER = 0;
export const TIER_VELOCITY = 1;
export const TIER_MOMENTUM = 2;

export type BillingTier = typeof TIER_STARTER | typeof TIER_VELOCITY | typeof TIER_MOMENTUM;

export const TIER_ORDER: BillingTier[] = [
  TIER_STARTER,
  TIER_VELOCITY,
  TIER_MOMENTUM,
];

export const TIER_LABELS: Record<BillingTier, string> = {
  [TIER_STARTER]: "Starter",
  [TIER_VELOCITY]: "Velocity",
  [TIER_MOMENTUM]: "Momentum",
};

/** Monthly display prices (USD) for UI when Stripe not loaded. */
export const TIER_MONTHLY_USD: Record<BillingTier, number> = {
  [TIER_STARTER]: 0,
  [TIER_VELOCITY]: 5,
  [TIER_MOMENTUM]: 12,
};

export const TIER_SLOT_LIMIT: Record<BillingTier, number> = {
  [TIER_STARTER]: 1,
  [TIER_VELOCITY]: 5,
  [TIER_MOMENTUM]: 15,
};

export const TIER_TAGLINE: Record<BillingTier, string> = {
  [TIER_STARTER]: "Testing the water.",
  [TIER_VELOCITY]: "Individual shop owners.",
  [TIER_MOMENTUM]: "High-traffic locations.",
};

export const TIER_FEATURES: Record<BillingTier, string[]> = {
  [TIER_STARTER]: ["1 active connection slot"],
  [TIER_VELOCITY]: [
    "5 active connection slots",
    "Priority matching speed.",
  ],
  [TIER_MOMENTUM]: [
    "15 active connection slots",
    "Instant matching & dedicated support.",
  ],
};

export function tierFromStripePriceId(priceId: string | undefined): BillingTier | null {
  if (!priceId) return null;
  const v = process.env.STRIPE_PRICE_VELOCITY;
  const m = process.env.STRIPE_PRICE_MOMENTUM;
  if (v && priceId === v) return TIER_VELOCITY;
  if (m && priceId === m) return TIER_MOMENTUM;
  return null;
}

export function getPriceIdForTier(tier: BillingTier): string | null {
  if (tier === TIER_STARTER) return null;
  if (tier === TIER_VELOCITY) return process.env.STRIPE_PRICE_VELOCITY ?? null;
  if (tier === TIER_MOMENTUM) return process.env.STRIPE_PRICE_MOMENTUM ?? null;
  return null;
}
