import {
  IncomingReviewStatusNames,
  INVITATION_OUTGOING_REVIEW_STATUSES,
  InvitationStatusNames,
  outgoingReviewStatusesMap,
  OutgoingReviewStatusNames,
} from "@/constants/shared";
import { OutgoingReview } from "@/types/dashboard";
import { Tables } from "@/types/database";

export function getOutgoingReviewStatus(
  data: OutgoingReview
): Tables<"invitation_statuses"> {
  if (data.review.length) {
    const review = data.review[0];
    switch (review.status.name) {
      case IncomingReviewStatusNames.REJECTED:
        return outgoingReviewStatusesMap.get(
          OutgoingReviewStatusNames.REJECTED_BY_OTHER
        );
      case IncomingReviewStatusNames.SUBMITTED:
        return outgoingReviewStatusesMap.get(
          OutgoingReviewStatusNames.SUBMITTED
        );
      case IncomingReviewStatusNames.VERIFIED:
        return outgoingReviewStatusesMap.get(
          OutgoingReviewStatusNames.VERIFIED
        );
      default:
    }
  } else {
    switch (data.status.name) {
      case InvitationStatusNames.PENDING:
        return outgoingReviewStatusesMap.get(OutgoingReviewStatusNames.PENDING);
      case InvitationStatusNames.REJECTED:
        return outgoingReviewStatusesMap.get(
          OutgoingReviewStatusNames.REJECTED_BY_YOU
        );
      default:
    }
  }
  throw new Error("Unexpected outgoing review status");
}

export function isInvitationOutgoingReviewStatus(
  statusId: Tables<"invitation_statuses">["id"]
) {
  if (INVITATION_OUTGOING_REVIEW_STATUSES.some(({ id }) => id === statusId)) {
    return true;
  }
  return false;
}
