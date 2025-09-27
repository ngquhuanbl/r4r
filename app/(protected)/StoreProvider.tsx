"use client";
import { useEffect, useRef } from "react";
import { Provider } from "react-redux";

import { incomingReviewsActions } from "@/lib/redux/slices/incoming-review";
import { myBusinessesActions } from "@/lib/redux/slices/my-business";
import { outgoingReviewsActions } from "@/lib/redux/slices/outgoing-review";
import { reviewRequestsActions } from "@/lib/redux/slices/review-request";
import { reviewStatusesActions } from "@/lib/redux/slices/review-status";
import { AppStore, makeStore } from "@/lib/redux/store";
import { FetchedReviewsResponse, ReviewRequest } from "@/types/dashboard";
import { Tables } from "@/types/database";
import { setupListeners } from "@reduxjs/toolkit/query";

import type { ReactNode } from "react";
interface Props {
  readonly children: ReactNode;

  readonly initialData: {
    incomingReviews: FetchedReviewsResponse;
    outgoingReviews: FetchedReviewsResponse;
    reviewRequests: ReviewRequest[];
    myBusinesses: Tables<"businesses">[];
    reviewStatuses: Tables<"review_statuses">[];
  };
}

export const StoreProvider = ({ initialData, children }: Props) => {
  const storeRef = useRef<AppStore | null>(null);

  if (!storeRef.current) {
    // Create the store instance the first time this renders
    const store = makeStore();

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
