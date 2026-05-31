export type MatchReason =
  | "filled_capacity"
  | "no_capacity"
  | "no_partner"
  | "partial_no_partner"
  | "partial_conflict_exhaustion"
  | "partial_partner_capacity_exhaustion"
  | "internal_error";

type BuildMatchSummaryInput = {
  initialCapacity: number;
  matchedCount: number;
  conflictSkips: number;
  partnerCapacitySkips: number;
  fatalReason?: MatchReason;
};

export type MatchSummary = {
  matchedCount: number;
  remainingCapacity: number;
  reason: MatchReason;
};

export function buildMatchSummary({
  initialCapacity,
  matchedCount,
  conflictSkips,
  partnerCapacitySkips,
  fatalReason,
}: BuildMatchSummaryInput): MatchSummary {
  const remainingCapacity = Math.max(0, initialCapacity - matchedCount);
  if (fatalReason === "internal_error") {
    return { matchedCount, remainingCapacity, reason: "internal_error" };
  }

  if (initialCapacity <= 0) {
    return { matchedCount: 0, remainingCapacity: 0, reason: "no_capacity" };
  }

  if (matchedCount >= initialCapacity) {
    return { matchedCount, remainingCapacity: 0, reason: "filled_capacity" };
  }

  if (matchedCount === 0) {
    if (partnerCapacitySkips > 0) {
      return {
        matchedCount: 0,
        remainingCapacity,
        reason: "partial_partner_capacity_exhaustion",
      };
    }
    if (conflictSkips > 0) {
      return {
        matchedCount: 0,
        remainingCapacity,
        reason: "partial_conflict_exhaustion",
      };
    }
    return { matchedCount: 0, remainingCapacity, reason: "no_partner" };
  }

  if (partnerCapacitySkips > 0) {
    return {
      matchedCount,
      remainingCapacity,
      reason: "partial_partner_capacity_exhaustion",
    };
  }

  if (conflictSkips > 0) {
    return {
      matchedCount,
      remainingCapacity,
      reason: "partial_conflict_exhaustion",
    };
  }

  return { matchedCount, remainingCapacity, reason: "partial_no_partner" };
}
