"use client";
import { useEffect, useRef } from "react";
import { Provider } from "react-redux";

import { authActions } from "@/lib/redux/slices/auth";
import { incomingReviewsActions } from "@/lib/redux/slices/incoming-review";
import { metricActions } from "@/lib/redux/slices/metric";
import { myBusinessesActions } from "@/lib/redux/slices/my-business";
import { outgoingReviewsActions } from "@/lib/redux/slices/outgoing-review";
import { platformsActions } from "@/lib/redux/slices/platform";
import { reviewRequestsActions } from "@/lib/redux/slices/review-request";
import { reviewStatusesActions } from "@/lib/redux/slices/review-status";
import { AppStore, makeStore } from "@/lib/redux/store";
import {
  FetchedBusiness,
  FetchedReviewsResponse,
  IncomingReview,
  OutgoingReview,
  ReviewRequest,
} from "@/types/dashboard";
import { Tables } from "@/types/database";
import { Metrics } from "@/types/metric";
import { setupListeners } from "@reduxjs/toolkit/query";

import type { ReactNode } from "react";
import type { User } from "@supabase/supabase-js";

interface Props {
  readonly children: ReactNode;

  readonly initialData: {
    user: User;
    incomingReviews: FetchedReviewsResponse<IncomingReview>;
    outgoingReviews: FetchedReviewsResponse<OutgoingReview>;
    reviewRequests: ReviewRequest[];
    myBusinesses: FetchedBusiness[];
    reviewStatuses: Tables<"review_statuses">[];
    platforms: Tables<"platforms">[];
    metrics: Metrics;
  };
}

export const StoreProvider = ({ initialData, children }: Props) => {
  const storeRef = useRef<AppStore | null>(null);

  if (!storeRef.current) {
    // Create the store instance the first time this renders
    const store = makeStore();

    store.dispatch(authActions.setCredentials(initialData.user));
    store.dispatch(
      incomingReviewsActions.loadInitData(initialData.incomingReviews)
    );
    store.dispatch(
      outgoingReviewsActions.loadInitData(initialData.outgoingReviews)
    );
    store.dispatch(
      reviewRequestsActions.loadInitData(initialData.reviewRequests)
    );
    store.dispatch(myBusinessesActions.loadInitData(initialData.myBusinesses));
    store.dispatch(
      reviewStatusesActions.loadInitData(initialData.reviewStatuses)
    );
    store.dispatch(platformsActions.loadInitData(initialData.platforms));
    store.dispatch(metricActions.setMetric(initialData.metrics));

    storeRef.current = store;
  }

  useEffect(() => {
    if (storeRef.current != null) {
      // configure listeners using the provided defaults
      // optional, but required for `refetchOnFocus`/`refetchOnReconnect` behaviors
      const unsubscribe = setupListeners(storeRef.current.dispatch);
      return unsubscribe;
    }
  }, []);

  return <Provider store={storeRef.current}>{children}</Provider>;
};
