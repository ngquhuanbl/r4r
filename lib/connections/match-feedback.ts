import type { MatchSummary } from "@/lib/connections/match-summary";

export type MatchFeedback =
  | {
      kind: "error";
      message: string;
      slotsDelta: 0;
    }
  | {
      kind: "success";
      message: string;
      slotsDelta: number;
    };

export function buildMatchFeedback(summary: MatchSummary): MatchFeedback {
  if (summary.matchedCount <= 0) {
    if (summary.reason === "no_capacity") {
      return {
        kind: "error",
        message: "Your plan is at capacity. Submit an outgoing review first.",
        slotsDelta: 0,
      };
    }

    return {
      kind: "error",
      message: "No eligible partners are available right now. Please try again soon.",
      slotsDelta: 0,
    };
  }

  if (summary.matchedCount === 1) {
    return {
      kind: "success",
      message: "1 match found. Check your Outgoing tab to submit your review.",
      slotsDelta: 1,
    };
  }

  return {
    kind: "success",
    message: `${summary.matchedCount} matches found. Check your Outgoing tab to submit your reviews.`,
    slotsDelta: summary.matchedCount,
  };
}
