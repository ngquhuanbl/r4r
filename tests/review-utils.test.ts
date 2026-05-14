import { describe, expect, it } from "vitest";

import { ReviewUtils } from "@/utils/review";
import { ReviewStatusNames } from "@/constants/shared";

describe("ReviewUtils", () => {
  it("detects draft vs submitted", () => {
    expect(ReviewUtils.isDraftReviewStatus(ReviewStatusNames.DRAFT)).toBe(true);
    expect(
      ReviewUtils.isSubmittedReviewStatus(ReviewStatusNames.SUBMITTED),
    ).toBe(true);
  });
});
