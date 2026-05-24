"use client";

import { useRef } from "react";

import { incomingReviewsActions } from "@/lib/redux/slices/incoming-review";
import { metricActions } from "@/lib/redux/slices/metric";
import { myBusinessesActions } from "@/lib/redux/slices/my-business";
import { outgoingReviewsActions } from "@/lib/redux/slices/outgoing-review";
import { reviewRequestsActions } from "@/lib/redux/slices/review-request";
import { useAppDispatch } from "@/lib/redux/hooks";
import type {
  FetchedBusiness,
  FetchedReviewsResponse,
  IncomingReview,
  OutgoingReview,
  ReviewRequest,
} from "@/types/dashboard";
import type { Metrics } from "@/types/metric";

import type { ReactNode } from "react";

export interface WorkspaceInitialData {
  myBusinesses: FetchedBusiness[];
  incomingReviews: FetchedReviewsResponse<IncomingReview>;
  outgoingReviews: FetchedReviewsResponse<OutgoingReview>;
  reviewRequests: ReviewRequest[];
  metrics: Metrics;
}

interface Props {
  readonly data: WorkspaceInitialData;
  readonly children: ReactNode;
}

export function WorkspaceHydrator({ data, children }: Props) {
  const dispatch = useAppDispatch();
  const hydrated = useRef(false);

  if (!hydrated.current) {
    dispatch(myBusinessesActions.loadInitData(data.myBusinesses));
    dispatch(incomingReviewsActions.loadInitData(data.incomingReviews));
    dispatch(outgoingReviewsActions.loadInitData(data.outgoingReviews));
    dispatch(reviewRequestsActions.loadInitData(data.reviewRequests));
    dispatch(metricActions.setMetric(data.metrics));
    hydrated.current = true;
  }

  return children;
}
