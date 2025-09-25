export enum IncomingReviewStatusNames {
  DRAFT = "DRAFT",
  SUBMITTED = "SUBMITTED",
  VERIFIED = "VERIFIED",
  REJECTED = "REJECTED",
}

export enum PlatformNames {
  Yelp = "Yelp",
  Google = "Google",
  TripAdvisor = "TripAdvisor",
}

export enum InvitationStatusNames {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
}

// ALL, SUBMITTED, VERIFIED, REJECTED BY OTHERS / PENDING, ACCEPTED, REJECTED BY YOU
export enum OutgoingReviewStatusNames {
  PENDING = "PENDING",
  REJECTED_BY_YOU = "REJECTED BY YOU",
  //
  SUBMITTED = "SUBMITTED",
  VERIFIED = "VERIFIED",
  REJECTED_BY_OTHER = "REJECTED_BY_OTHER",
}

let id = 1;

export const INVITATION_OUTGOING_REVIEW_STATUSES = [
  {
    id: id++,
    name: OutgoingReviewStatusNames.PENDING,
    description: "",
    referencedStatusName: InvitationStatusNames.PENDING,
  },
  {
    id: id++,
    name: OutgoingReviewStatusNames.REJECTED_BY_YOU,
    description: "",
    referencedStatusName: InvitationStatusNames.REJECTED,
  },
];

export const INCOMING_REVIEW_OUTGOING_REVIEW_STATUSES = [
  {
    id: id++,
    name: OutgoingReviewStatusNames.REJECTED_BY_OTHER,
    description: "",
    referencedStatusName: IncomingReviewStatusNames.REJECTED,
  },
  {
    id: id++,
    name: OutgoingReviewStatusNames.SUBMITTED,
    description: "",
    referencedStatusName: IncomingReviewStatusNames.SUBMITTED,
  },
  {
    id: id++,
    name: OutgoingReviewStatusNames.VERIFIED,
    description: "",
    referencedStatusName: IncomingReviewStatusNames.VERIFIED,
  },
];

export const OUTGOING_REVIEW_STATUSES = [
  ...INVITATION_OUTGOING_REVIEW_STATUSES,
  ...INCOMING_REVIEW_OUTGOING_REVIEW_STATUSES,
];

export const outgoingReviewReferenceStatusNameMap = new Map();
export const outgoingReviewStatusesMap = new Map();

OUTGOING_REVIEW_STATUSES.forEach((item) => {
  outgoingReviewStatusesMap.set(item.name, { ...item });
  outgoingReviewReferenceStatusNameMap.set(item.id, item.referencedStatusName);
});
