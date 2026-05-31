import { describe, expect, it } from "vitest";

import { buildMatchFeedback } from "@/lib/connections/match-feedback";

describe("buildMatchFeedback", () => {
  it("returns capacity message when no_capacity", () => {
    const feedback = buildMatchFeedback({
      matchedCount: 0,
      remainingCapacity: 0,
      reason: "no_capacity",
    });
    expect(feedback).toEqual({
      kind: "error",
      message: "Your plan is at capacity. Submit an outgoing review first.",
      slotsDelta: 0,
    });
  });

  it("returns no-partner message for zero matches", () => {
    const feedback = buildMatchFeedback({
      matchedCount: 0,
      remainingCapacity: 2,
      reason: "partial_conflict_exhaustion",
    });
    expect(feedback).toEqual({
      kind: "error",
      message: "No eligible partners are available right now. Please try again soon.",
      slotsDelta: 0,
    });
  });

  it("returns singular success copy for one match", () => {
    const feedback = buildMatchFeedback({
      matchedCount: 1,
      remainingCapacity: 2,
      reason: "partial_no_partner",
    });
    expect(feedback).toEqual({
      kind: "success",
      message: "1 match found. Check your Outgoing tab to submit your review.",
      slotsDelta: 1,
    });
  });

  it("returns plural success copy and slots delta for many matches", () => {
    const feedback = buildMatchFeedback({
      matchedCount: 3,
      remainingCapacity: 0,
      reason: "filled_capacity",
    });
    expect(feedback).toEqual({
      kind: "success",
      message: "3 matches found. Check your Outgoing tab to submit your reviews.",
      slotsDelta: 3,
    });
  });
});
