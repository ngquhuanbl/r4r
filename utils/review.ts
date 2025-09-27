import { ReviewStatusNames } from "@/constants/shared";
import { Tables } from "@/types/database";

export namespace ReviewUtils {
  export function isDraftReviewStatus(
    status: Tables<"review_statuses">["name"]
  ) {
    return status === ReviewStatusNames.DRAFT;
  }
  export function isSubmittedReviewStatus(
    status: Tables<"review_statuses">["name"]
  ) {
    return status === ReviewStatusNames.SUBMITTED;
  }
  export function isVerifiedReviewStatus(
    status: Tables<"review_statuses">["name"]
  ) {
    return status === ReviewStatusNames.VERIFIED;
  }
  export function isRejectedReviewStatus(
    status: Tables<"review_statuses">["name"]
  ) {
    return status === ReviewStatusNames.REJECTED;
  }
}
