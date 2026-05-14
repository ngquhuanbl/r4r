import { describe, expect, it } from "vitest";

import { isTerminalReview } from "@/lib/connections/complete-connection";
import { ReviewStatusNames } from "@/constants/shared";

describe("isTerminalReview", () => {
  it("returns true for verified and rejected", () => {
    expect(isTerminalReview(ReviewStatusNames.VERIFIED)).toBe(true);
    expect(isTerminalReview(ReviewStatusNames.REJECTED)).toBe(true);
  });

  it("returns false for draft and submitted", () => {
    expect(isTerminalReview(ReviewStatusNames.DRAFT)).toBe(false);
    expect(isTerminalReview(ReviewStatusNames.SUBMITTED)).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isTerminalReview(undefined)).toBe(false);
  });
});
