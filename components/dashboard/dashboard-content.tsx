"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  fetchDashboardBusinessTaskCounts,
  type BusinessTaskCounts,
} from "@/app/(protected)/(workspace)/dashboard/actions";
import { CreateBusinessDialog } from "@/components/business/create-business-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { authSelectors } from "@/lib/redux/slices/auth";
import {
  myBusinessesActions,
  myBusinessesSelectors,
} from "@/lib/redux/slices/my-business";
import { FetchedBusiness } from "@/types/dashboard";
import { Plus, Search } from "lucide-react";

import { AddBusinessProfileCard } from "./business-profile/add-business-profile-card";
import { BusinessProfileCard } from "./business-profile/business-profile-card";
import { mapBusinessToLocation } from "./business-profile/map-business-to-location";
import { NoBusinessesEmptyState } from "./business-profile/no-businesses-empty-state";

const zeroCounts = (): BusinessTaskCounts => ({
  incoming: 0,
  outgoing: 0,
  isReady: false,
});

/**
 * Content of the dashboard page.
 * * Display business list in grid layout and provide create business dialog.
 */
export function DashboardContent() {
  //
  // PROPS
  //
  // This component has no props.

  //
  // STATE
  //
  const dispatch = useAppDispatch();
  const userId = useAppSelector(authSelectors.selectUserId);
  const myBusinesses = useAppSelector(myBusinessesSelectors.selectData);
  const [searchQuery, setSearchQuery] = useState("");
  const [shouldShowCreateProfileDialog, setShouldShowCreateProfileDialog] =
    useState(false);
  /** Per-business action counters used to build dashboard location cards. */
  const [actionByBusiness, setActionByBusiness] = useState<
    Record<number, BusinessTaskCounts>
  >({});

  /** Business cards merged with server action counts for rendering. */
  const items = useMemo(
    () =>
      myBusinesses.map((business) =>
        mapBusinessToLocation(business, actionByBusiness[business.id]),
      ),
    [myBusinesses, actionByBusiness],
  );

  /** Search-filtered business cards shown in the dashboard grid. */
  const filtered = useMemo(() => {
    const search = searchQuery.trim().toLowerCase();
    if (!search) return items;
    return items.filter((item) =>
      item.name.toLowerCase().includes(search),
    );
  }, [searchQuery, items]);

  //
  // EVENTS
  //

  /** Handler for successful business creation; appends row and closes dialog. */
  const onCreatedBusiness = useCallback(
    (data: FetchedBusiness) => {
      dispatch(myBusinessesActions.addData(data));
      setShouldShowCreateProfileDialog(false);
    },
    [dispatch],
  );

  /** Handler for opening the create business dialog. */
  const openCreate = useCallback(
    () => setShouldShowCreateProfileDialog(true),
    [],
  );

  //
  // EFFECTS
  //

  /** Loads per-business action counts whenever user or business list changes. */
  useEffect(() => {
    if (!userId || myBusinesses.length === 0) {
      setActionByBusiness({});
      return;
    }

    let cancelled = false;
    const ids = myBusinesses.map((business) => business.id);

    void (async () => {
      const res = await fetchDashboardBusinessTaskCounts(userId, ids);
      if (cancelled) return;
      if (!res.ok) {
        setActionByBusiness(
          Object.fromEntries(ids.map((id) => [id, zeroCounts()])) as Record<
            number,
            BusinessTaskCounts
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

  //
  // RENDER
  //

  /** Whether the user has at least one business to render. */
  const hasBusinesses = myBusinesses.length > 0;

  return (
    <>
      {!hasBusinesses ? (
        <NoBusinessesEmptyState onAdd={openCreate} />
      ) : (
        <div className="w-full min-w-0 self-stretch font-inter">
          <div className="flex w-full flex-col gap-8">
            <div className="flex flex-col gap-6">
              <h2 className="text-4xl font-normal tracking-tight text-foreground sm:text-5xl">
                Pick a business to start
              </h2>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
                <div className="relative w-full max-w-[432px] flex-1">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden
                  />
                  <Input
                    type="search"
                    placeholder="Search by business name"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    className="h-9 w-full rounded-md border border-input bg-background pl-9"
                    aria-label="Search by business name"
                  />
                </div>
                <Button
                  type="button"
                  variant="ocean"
                  className="h-10 shrink-0 rounded-md px-4 font-medium sm:w-auto"
                  onClick={openCreate}
                >
                  <Plus className="h-4 w-4" aria-hidden />
                  Add a new business
                </Button>
              </div>
            </div>

            <ul className="grid list-none grid-cols-1 gap-5 p-0 md:grid-cols-2 md:gap-6">
              {filtered.map((item) => (
                <li key={item.id}>
                  <BusinessProfileCard data={item} />
                </li>
              ))}
              <AddBusinessProfileCard onClick={openCreate} />
            </ul>
          </div>
        </div>
      )}

      <CreateBusinessDialog
        open={shouldShowCreateProfileDialog}
        onOpenChange={setShouldShowCreateProfileDialog}
        onCreatedData={onCreatedBusiness}
      />
    </>
  );
}
