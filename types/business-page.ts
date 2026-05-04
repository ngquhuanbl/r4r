/** Per-business review snapshot for the Business Page V2 chart (left panel). */
export type BusinessReviewSnapshot = {
  /** Incoming reviews to this business (inviter = user): verified vs rejected vs other */
  received: {
    accepted: number;
    rejected: number;
    other: number;
  };
  /** Outgoing reviews authored from this business (`invitee_business_id = businessId`): verified vs rejected vs other */
  given: {
    accepted: number;
    rejected: number;
    other: number;
  };
};
