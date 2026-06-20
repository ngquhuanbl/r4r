"use client";
import { useEffect, useRef } from "react";
import { Provider } from "react-redux";

import { authActions } from "@/lib/redux/slices/auth";
import { platformsActions } from "@/lib/redux/slices/platform";
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

/**
 * Root Redux provider for all authenticated routes under `app/(protected)`.
 *
 * Responsibilities:
 * - creates the Redux store once on first client mount
 * - seeds global catalog/session slices (`auth`, `reviewStatuses`, `platforms`)
 * - exposes the store to nested route groups (including `(workspace)`)
 *
 * Note: workspace-specific realtime orchestration is intentionally isolated in
 * `app/(protected)/(workspace)/workspace-realtime-bridge.tsx` to keep
 * non-workspace routes such as account/billing lightweight.
 */
export const StoreProvider = ({ initialData, children }: Props) => {
  const storeRef = useRef<AppStore | null>(null);

  if (!storeRef.current) {
    const store = makeStore();

    /**
     * Base bootstrap for the whole protected shell.
     *
     * Why initialize these slices here?
     * - `auth`, `reviewStatuses`, and `platforms` are general catalog/session data
     *   used across all protected routes (workspace, account, billing, header, etc.).
     * - They should exist before any route-specific hydration so selectors can read
     *   a stable baseline immediately after mount.
     * - Workspace-heavy business data remains in `app/(protected)/(workspace)`.
     */
    store.dispatch(authActions.setCredentials(initialData.user));
    store.dispatch(
      reviewStatusesActions.loadInitData(initialData.reviewStatuses),
    );
    store.dispatch(platformsActions.loadInitData(initialData.platforms));

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
