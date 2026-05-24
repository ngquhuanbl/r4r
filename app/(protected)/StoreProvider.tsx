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
import { Tables } from "@/types/database";
import { setupListeners } from "@reduxjs/toolkit/query";

import type { ReactNode } from "react";
import type { User } from "@supabase/supabase-js";

interface Props {
  readonly children: ReactNode;

  readonly initialData: {
    user: User;
    reviewStatuses: Tables<"review_statuses">[];
    platforms: Tables<"platforms">[];
  };
}

export const StoreProvider = ({ initialData, children }: Props) => {
  const storeRef = useRef<AppStore | null>(null);

  if (!storeRef.current) {
    const store = makeStore();

    store.dispatch(authActions.setCredentials(initialData.user));
    store.dispatch(
      reviewStatusesActions.loadInitData(initialData.reviewStatuses),
    );
    store.dispatch(platformsActions.loadInitData(initialData.platforms));

    // Workspace routes hydrate businesses, reviews, requests, and metrics.
    store.dispatch(incomingReviewsActions.loadInitData({ data: [], total_results: 0 }));
    store.dispatch(outgoingReviewsActions.loadInitData({ data: [], total_results: 0 }));
    store.dispatch(reviewRequestsActions.loadInitData([]));
    store.dispatch(myBusinessesActions.loadInitData([]));
    store.dispatch(metricActions.setMetric({
      total_incoming_all: 0,
      total_incoming_verified: 0,
      total_outgoing_all: 0,
      total_outgoing_verified: 0,
    }));

    storeRef.current = store;
  }

  useEffect(() => {
    if (storeRef.current != null) {
      const unsubscribe = setupListeners(storeRef.current.dispatch);
      return unsubscribe;
    }
  }, []);

  return <Provider store={storeRef.current}>{children}</Provider>;
};
