import { afterEach, describe, expect, it, vi } from "vitest";

import {
  TIER_MOMENTUM,
  TIER_VELOCITY,
  tierFromStripePriceId,
} from "@/lib/billing/tiers";

describe("tierFromStripePriceId", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("maps configured Stripe price ids", () => {
    vi.stubEnv("STRIPE_PRICE_VELOCITY", "price_vel");
    vi.stubEnv("STRIPE_PRICE_MOMENTUM", "price_mom");
    expect(tierFromStripePriceId("price_vel")).toBe(TIER_VELOCITY);
    expect(tierFromStripePriceId("price_mom")).toBe(TIER_MOMENTUM);
  });

  it("returns null for unknown ids", () => {
    vi.stubEnv("STRIPE_PRICE_VELOCITY", "price_vel");
    expect(tierFromStripePriceId("price_other")).toBe(null);
    expect(tierFromStripePriceId(undefined)).toBe(null);
  });
});
