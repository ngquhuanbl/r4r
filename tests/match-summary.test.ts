import { describe, expect, it } from "vitest";

import { buildMatchSummary } from "@/lib/connections/match-summary";

describe("buildMatchSummary", () => {
  it("returns no_capacity when there is no available capacity", () => {
    const summary = buildMatchSummary({
      initialCapacity: 0,
      matchedCount: 0,
      conflictSkips: 0,
      partnerCapacitySkips: 0,
    });
    expect(summary).toEqual({
      matchedCount: 0,
      remainingCapacity: 0,
      reason: "no_capacity",
    });
  });

  it("returns filled_capacity when all capacity is matched", () => {
    const summary = buildMatchSummary({
      initialCapacity: 3,
      matchedCount: 3,
      conflictSkips: 0,
      partnerCapacitySkips: 0,
    });
    expect(summary).toEqual({
      matchedCount: 3,
      remainingCapacity: 0,
      reason: "filled_capacity",
    });
  });

  it("returns partial_conflict_exhaustion when conflicts block progress", () => {
    const summary = buildMatchSummary({
      initialCapacity: 3,
      matchedCount: 1,
      conflictSkips: 2,
      partnerCapacitySkips: 0,
    });
    expect(summary).toEqual({
      matchedCount: 1,
      remainingCapacity: 2,
      reason: "partial_conflict_exhaustion",
    });
  });

  it("returns partial_partner_capacity_exhaustion when partners are full", () => {
    const summary = buildMatchSummary({
      initialCapacity: 4,
      matchedCount: 1,
      conflictSkips: 0,
      partnerCapacitySkips: 2,
    });
    expect(summary).toEqual({
      matchedCount: 1,
      remainingCapacity: 3,
      reason: "partial_partner_capacity_exhaustion",
    });
  });

  it("returns no_partner when no candidates are eligible", () => {
    const summary = buildMatchSummary({
      initialCapacity: 2,
      matchedCount: 0,
      conflictSkips: 0,
      partnerCapacitySkips: 0,
    });
    expect(summary).toEqual({
      matchedCount: 0,
      remainingCapacity: 2,
      reason: "no_partner",
    });
  });

  it("returns internal_error even after partial success", () => {
    const summary = buildMatchSummary({
      initialCapacity: 5,
      matchedCount: 2,
      conflictSkips: 1,
      partnerCapacitySkips: 0,
      fatalReason: "internal_error",
    });
    expect(summary).toEqual({
      matchedCount: 2,
      remainingCapacity: 3,
      reason: "internal_error",
    });
  });
});
