"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  fetchDashboardBusinessActionCounts,
  type BusinessActionCounts,
} from "@/app/(protected)/dashboard/actions";
import { CreateBusinessDialog } from "@/components/my-business/CreateBusinessDialog";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { authSelectors } from "@/lib/redux/slices/auth";
import {
  myBusinessesActions,
  myBusinessesSelectors,
} from "@/lib/redux/slices/my-business";
import { reviewRequestsActions } from "@/lib/redux/slices/review-request";
import { FetchedBusiness } from "@/types/dashboard";

import { LocationsBoard } from "./locations-board";
import { mapBusinessToLocation } from "./map-business-to-location";
import { NoBusinessesEmptyState } from "./no-businesses-empty-state";

const zeroCounts = (): BusinessActionCounts => ({
  incomingAction: 0,
  outgoingAction: 0,
  connectionFull: false,
});

export function DashboardLocationsGrid() {
  const dispatch = useAppDispatch();
  const userId = useAppSelector(authSelectors.selectUserId);
  const myBusinesses = useAppSelector(myBusinessesSelectors.selectData);
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [actionByBusiness, setActionByBusiness] = useState<
    Record<number, BusinessActionCounts>
  >({});

  const hasBusinesses = myBusinesses.length > 0;

  useEffect(() => {
    if (!userId || myBusinesses.length === 0) {
      setActionByBusiness({});
      return;
    }
    let cancelled = false;
    const ids = myBusinesses.map((b) => b.id);
    void (async () => {
      const res = await fetchDashboardBusinessActionCounts(userId, ids);
      if (cancelled) return;
      if (!res.ok) {
        setActionByBusiness(
          Object.fromEntries(ids.map((id) => [id, zeroCounts()])) as Record<
            number,
            BusinessActionCounts
          >,
        );
        return;
      }
      setActionByBusiness(res.data);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, myBusinesses]);

  const locations = useMemo(
    () =>
      myBusinesses.map((b) =>
        mapBusinessToLocation(b, actionByBusiness[b.id]),
      ),
    [myBusinesses, actionByBusiness],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return locations;
    return locations.filter((b) => b.name.toLowerCase().includes(q));
  }, [query, locations]);

  const onCreatedBusiness = useCallback(
    (data: FetchedBusiness) => {
      dispatch(myBusinessesActions.addData(data));
      setCreateOpen(false);
      dispatch(reviewRequestsActions.fetchReviewRequestsThunk(userId));
    },
    [dispatch, userId],
  );

  const openCreate = useCallback(() => setCreateOpen(true), []);

  return (
    <>
      {!hasBusinesses ? (
        <NoBusinessesEmptyState onAdd={openCreate} />
      ) : (
        <LocationsBoard
          query={query}
          onQueryChange={setQuery}
          filtered={filtered}
          onAddBusiness={openCreate}
        />
      )}
      <CreateBusinessDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreatedData={onCreatedBusiness}
      />
    </>
  );
}
