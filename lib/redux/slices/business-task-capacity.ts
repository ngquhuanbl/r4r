import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import {
  fetchDashboardBusinessTaskCounts,
} from "@/app/(protected)/(workspace)/dashboard/actions";
import type { BusinessTaskAndCapacityInfo } from "@/app/(protected)/(workspace)/dashboard/actions";
import type { Tables } from "@/types/database";

import { myBusinessesActions, myBusinessesSelectors } from "./my-business";
import type { AppThunk, RootState } from "../store";

export enum BusinessTaskCapacityLifecycleStatus {
  INIT = "init",
  LOADING = "loading",
  SUCCEEDED = "succeeded",
  FAILED = "failed",
}

type BusinessId = Tables<"businesses">["id"];
type RefreshOrchestrationReason = "mount" | "focus" | "visibility" | "online";

let isRefreshOrchestrationInFlight = false;

type DashboardTaskCapacityState = {
  /** The mapping of business ID to task and capacity information. */
  byBusinessId: Record<BusinessId, BusinessTaskAndCapacityInfo>;
  /** The status of the business task capacity loading. */
  status: BusinessTaskCapacityLifecycleStatus;
  /** The timestamp of the last successful fetch. */
  lastFetchedAt: number | null;
  /** The error message if the last fetch failed. */
  error: string | null;
  /** The list of business IDs that are dirty and need to be refreshed. */
  dirtyBusinessIds: BusinessId[];
  /** 
   * The list of business IDs that are in flight and need to be refreshed.
   * This is used for deduplication purposes since the refresh is triggered by multiple sources.
   */
  inFlightBusinessIds: BusinessId[];
  /**
   * Whether the current dirty set can be trusted.
   * We set this to `false` when Realtime delivery may be incomplete
   * (for example channel timeout/error or reconnect windows), because
   * some review mutations might have been missed and therefore not marked dirty.
   * While `false`, dashboard recovery logic can do a broader refresh instead of
   * relying only on `dirtyBusinessIds`; after a successful reconcile fetch we set
   * it back to `true`.
   */
  canTrustCurrentDirtySet: boolean;
};

const initialState: DashboardTaskCapacityState = {
  byBusinessId: {},
  status: BusinessTaskCapacityLifecycleStatus.INIT,
  lastFetchedAt: null,
  error: null,
  dirtyBusinessIds: [],
  inFlightBusinessIds: [],
  canTrustCurrentDirtySet: true,
};

function mergeUniqueIds(current: BusinessId[], next: BusinessId[]): BusinessId[] {
  if (next.length === 0) return current;
  return Array.from(new Set<BusinessId>([...current, ...next]));
}

function pruneIds(ids: BusinessId[], allowedIds: Set<BusinessId>): BusinessId[] {
  return ids.filter((id) => allowedIds.has(id));
}

export const businessTaskCapacitySlice = createSlice({
  name: "business_task_capacity",
  initialState,
  reducers: {
    loadInitData(
      state,
      action: PayloadAction<Record<BusinessId, BusinessTaskAndCapacityInfo>>,
    ) {
      state.byBusinessId = action.payload;
      state.status = BusinessTaskCapacityLifecycleStatus.SUCCEEDED;
      state.lastFetchedAt = Date.now();
      state.error = null;
    },
    upsertMany(
      state,
      action: PayloadAction<Record<BusinessId, BusinessTaskAndCapacityInfo>>,
    ) {
      Object.assign(state.byBusinessId, action.payload);
      state.status = BusinessTaskCapacityLifecycleStatus.SUCCEEDED;
      state.lastFetchedAt = Date.now();
      state.error = null;
    },
    patchOne(
      state,
      action: PayloadAction<{
        id: BusinessId;
        changes: Partial<BusinessTaskAndCapacityInfo>;
      }>,
    ) {
      const { id, changes } = action.payload;
      const current = state.byBusinessId[id];
      if (!current) return;
      state.byBusinessId[id] = { ...current, ...changes };
    },
    markLoading(state) {
      state.status = BusinessTaskCapacityLifecycleStatus.LOADING;
      state.error = null;
    },
    markFailed(state, action: PayloadAction<string>) {
      state.status = BusinessTaskCapacityLifecycleStatus.FAILED;
      state.error = action.payload;
    },
    markInFlightMany(state, action: PayloadAction<BusinessId[]>) {
      state.inFlightBusinessIds = mergeUniqueIds(
        state.inFlightBusinessIds,
        action.payload,
      );
    },
    clearInFlightMany(state, action: PayloadAction<BusinessId[]>) {
      const removing = new Set(action.payload);
      state.inFlightBusinessIds = state.inFlightBusinessIds.filter(
        (id) => !removing.has(id),
      );
    },
    markDirtyMany(state, action: PayloadAction<BusinessId[]>) {
      state.dirtyBusinessIds = mergeUniqueIds(state.dirtyBusinessIds, action.payload);
    },
    clearDirtyMany(state, action: PayloadAction<BusinessId[]>) {
      const removing = new Set(action.payload);
      state.dirtyBusinessIds = state.dirtyBusinessIds.filter(
        (id) => !removing.has(id),
      );
    },
    setCanTrustCurrentDirtySet(state, action: PayloadAction<boolean>) {
      state.canTrustCurrentDirtySet = action.payload;
    },
    clear(state) {
      return { ...initialState, dirtyBusinessIds: state.dirtyBusinessIds };
    },
  },
  selectors: {
    selectByBusinessId: (state) => state.byBusinessId,
    selectStatus: (state) => state.status,
    selectLastFetchedAt: (state) => state.lastFetchedAt,
    selectError: (state) => state.error,
    selectDirtyBusinessIds: (state) => state.dirtyBusinessIds,
    selectInFlightBusinessIds: (state) => state.inFlightBusinessIds,
    selectCanTrustCurrentDirtySet: (state) => state.canTrustCurrentDirtySet,
  },
  extraReducers: (builder) => {
    builder
      .addCase(myBusinessesActions.loadInitData, (state, action) => {
        const ids = action.payload.map((business) => business.id);
        if (ids.length === 0) {
          return { ...initialState };
        }

        const allowedIds = new Set(ids);

        for (const rawKey of Object.keys(state.byBusinessId)) {
          const id = Number(rawKey);
          if (!allowedIds.has(id)) {
            delete state.byBusinessId[id];
          }
        }

        state.dirtyBusinessIds = pruneIds(state.dirtyBusinessIds, allowedIds);
        state.inFlightBusinessIds = pruneIds(state.inFlightBusinessIds, allowedIds);
      })
      .addCase(myBusinessesActions.deleteById, (state, action) => {
        const id = action.payload;
        delete state.byBusinessId[id];
        state.dirtyBusinessIds = state.dirtyBusinessIds.filter((x) => x !== id);
        state.inFlightBusinessIds = state.inFlightBusinessIds.filter(
          (x) => x !== id,
        );
      });
  },
});

export const businessTaskCapacityActions = {
  ...businessTaskCapacitySlice.actions,
  /**
   * Single gate for dashboard refresh scheduling to avoid overlapping policy runs.
   */
  orchestrateRefresh:
    (
      userId: string,
      reason: RefreshOrchestrationReason,
      ttlMs: number,
    ): AppThunk<Promise<void>> =>
    async (dispatch) => {
      if (isRefreshOrchestrationInFlight) return;
      isRefreshOrchestrationInFlight = true;

      try {
        if (reason === "online") {
          // Online transitions can include missed realtime signals.
          dispatch(businessTaskCapacityActions.setCanTrustCurrentDirtySet(false));
        }

        if (reason === "mount") {
          await dispatch(businessTaskCapacityActions.refreshVisibleByPolicy(userId));
          return;
        }

        await dispatch(
          businessTaskCapacityActions.refreshVisibleOnRecovery(userId, ttlMs),
        );
      } finally {
        isRefreshOrchestrationInFlight = false;
      }
    },
  /**
   * Refreshes visible dashboard businesses using deferred priority:
   * init/failed full refresh, then dirty-only refresh, then missing-row backfill.
   */
  refreshVisibleByPolicy:
    (userId: string): AppThunk<Promise<void>> =>
    async (dispatch, getState) => {
      const state = getState();
      // Resolve the current visible business IDs from Redux.
      const visibleIds = myBusinessesSelectors
        .selectData(state)
        .map((business) => business.id);
      if (visibleIds.length === 0) return;

      const status = businessTaskCapacitySelectors.selectStatus(state);
      // Priority 1: bootstrap/retry path refreshes the full visible set.
      if (
        status === BusinessTaskCapacityLifecycleStatus.INIT ||
        status === BusinessTaskCapacityLifecycleStatus.FAILED
      ) {
        await dispatch(businessTaskCapacityActions.refreshMany(userId, visibleIds));
        return;
      }

      const dirtySet = new Set(
        businessTaskCapacitySelectors.selectDirtyBusinessIds(state),
      );
      // Priority 2: prefer narrow dirty-only refresh when possible.
      const dirtyVisibleIds = visibleIds.filter((id) => dirtySet.has(id));
      if (dirtyVisibleIds.length > 0) {
        await dispatch(businessTaskCapacityActions.refreshMany(userId, dirtyVisibleIds));
        return;
      }

      const byBusinessId = businessTaskCapacitySelectors.selectByBusinessId(state);
      // Priority 3: backfill visible businesses that are still missing cache rows.
      const missingIds = visibleIds.filter((id) => byBusinessId[id] == null);
      if (missingIds.length > 0) {
        await dispatch(businessTaskCapacityActions.refreshMany(userId, missingIds));
      }
    },
  /**
   * Recovery refresh policy used for focus/visibility/online events:
   * dirty-visible first, otherwise full-visible when dirty set is untrusted or stale.
   */
  refreshVisibleOnRecovery:
    (userId: string, ttlMs: number): AppThunk<Promise<void>> =>
    async (dispatch, getState) => {
      const state = getState();
      // Resolve the current visible business IDs from Redux.
      const visibleIds = myBusinessesSelectors
        .selectData(state)
        .map((business) => business.id);
      if (visibleIds.length === 0) return;

      const dirtySet = new Set(
        businessTaskCapacitySelectors.selectDirtyBusinessIds(state),
      );
      // Recovery priority 1: dirty-only refresh keeps requests minimal.
      const dirtyVisibleIds = visibleIds.filter((id) => dirtySet.has(id));
      if (dirtyVisibleIds.length > 0) {
        await dispatch(businessTaskCapacityActions.refreshMany(userId, dirtyVisibleIds));
        return;
      }

      const canTrustCurrentDirtySet =
        businessTaskCapacitySelectors.selectCanTrustCurrentDirtySet(state);
      const isStale = isBusinessTaskCapacityStale(state, ttlMs);
      // Recovery priority 2: fallback full refresh when dirty set cannot be trusted.
      if (!canTrustCurrentDirtySet || isStale) {
        await dispatch(businessTaskCapacityActions.refreshMany(userId, visibleIds));
      }
    },
  refreshMany:
    (userId: string, candidateIds: BusinessId[]): AppThunk<Promise<void>> =>
    async (dispatch, getState) => {
      if (candidateIds.length === 0) return;

      const state = getState();
      const inFlightBusinessIds =
        businessTaskCapacitySelectors.selectInFlightBusinessIds(state);
      const uniqueIds = Array.from(new Set(candidateIds));
      const inFlightSet = new Set(inFlightBusinessIds);
      const requestIds = uniqueIds.filter((id) => !inFlightSet.has(id));
      if (requestIds.length === 0) return;

      dispatch(businessTaskCapacityActions.markLoading());
      dispatch(businessTaskCapacityActions.markInFlightMany(requestIds));

      try {
        const res = await fetchDashboardBusinessTaskCounts(userId, requestIds);
        if (!res.ok) {
          dispatch(businessTaskCapacityActions.markFailed(res.error));
          return;
        }
        dispatch(businessTaskCapacityActions.upsertMany(res.data));
        dispatch(businessTaskCapacityActions.clearDirtyMany(requestIds));
        dispatch(businessTaskCapacityActions.setCanTrustCurrentDirtySet(true));
      } finally {
        dispatch(businessTaskCapacityActions.clearInFlightMany(requestIds));
      }
    },
  maybeMarkDirty:
    (candidateIds: BusinessId[]): AppThunk =>
    (dispatch, getState) => {
      if (candidateIds.length === 0) return;
      const uniqueIds = Array.from(new Set(candidateIds));
      const state = getState();
      const dirtyBusinessIds = businessTaskCapacitySelectors.selectDirtyBusinessIds(
        state,
      );
      const dirtySet = new Set(dirtyBusinessIds);
      const nextIds = uniqueIds.filter((id) => !dirtySet.has(id));
      if (nextIds.length > 0) {
        dispatch(businessTaskCapacityActions.markDirtyMany(nextIds));
      }
    },
};

export const businessTaskCapacitySelectors = {
  ...businessTaskCapacitySlice.selectors,
  selectBusinessRow:
    (businessId: BusinessId) =>
    (state: RootState): BusinessTaskAndCapacityInfo | undefined =>
      state.business_task_capacity.byBusinessId[businessId],
  selectIsBusinessInFlight:
    (businessId: BusinessId) =>
    (state: RootState): boolean =>
      state.business_task_capacity.inFlightBusinessIds.includes(businessId),
};

export function isBusinessTaskCapacityStale(
  state: RootState,
  ttlMs: number,
): boolean {
  const ts = state.business_task_capacity.lastFetchedAt;
  if (ts == null) return true;
  return Date.now() - ts > ttlMs;
}
