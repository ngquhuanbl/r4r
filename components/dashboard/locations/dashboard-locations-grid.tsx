"use client";

import { useCallback, useMemo, useState } from "react";

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

export function DashboardLocationsGrid() {
  const dispatch = useAppDispatch();
  const userId = useAppSelector(authSelectors.selectUserId);
  const myBusinesses = useAppSelector(myBusinessesSelectors.selectData);
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const hasBusinesses = myBusinesses.length > 0;

  const locations = useMemo(
    () => myBusinesses.map((b, i) => mapBusinessToLocation(b, i)),
    [myBusinesses],
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
