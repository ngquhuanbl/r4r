"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";

import { CreateBusinessDialog } from "@/components/business/create-business-dialog";
import { TASK_CAPACITY_TTL_MS } from "@/constants/dashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { authSelectors } from "@/lib/redux/slices/auth";
import {
  businessTaskCapacityActions,
  businessTaskCapacitySelectors,
} from "@/lib/redux/slices/business-task-capacity";
import {
  myBusinessesActions,
  myBusinessesSelectors,
} from "@/lib/redux/slices/my-business";
import { FetchedBusiness } from "@/types/dashboard";

import { AddBusinessProfileCard } from "./business-profile/add-business-profile-card";
import {
  BusinessProfileCard,
  type DisplayedBusinessProfile,
} from "./business-profile/business-profile-card";
import { EmptyDashboardContent } from "./empty-dashboard-content";

import { getAddress } from "@/utils/shared";

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
  const taskAndCapacityInfoByBusiness = useAppSelector(
    businessTaskCapacitySelectors.selectByBusinessId,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [shouldShowCreateProfileDialog, setShouldShowCreateProfileDialog] =
    useState(false);

  /** Business cards merged with task and capacity info for rendering. */
  const items = useMemo(
    () => {
      const result = [];
      for (const business of myBusinesses) {
        const item: DisplayedBusinessProfile = {
          id: String(business.id),
          name: business.business_name,
          status: "loading",
          address: getAddress(business),
          imageSrc: business.cover_image_url,
          imageAlt: business.business_name ? `${business.business_name} storefront` : "",
          incoming: null,
          outgoing: null,
        }
        
        const taskAndCapacityInfo = taskAndCapacityInfoByBusiness[business.id];
        if (taskAndCapacityInfo) {
          // If the task and capacity info is available, display it
          item.status = taskAndCapacityInfo.slotsUsed >= taskAndCapacityInfo.slotLimit ? "full" : "ready";
          item.incoming = taskAndCapacityInfo.incoming;
          item.outgoing = taskAndCapacityInfo.outgoing;
        }
        result.push(item);
      }
      return result;
    },
    [myBusinesses, taskAndCapacityInfoByBusiness],
  );

  /** Search-filtered business cards shown in the dashboard grid. */
  const filteredItems = useMemo(() => {
    const search = searchQuery.trim().toLowerCase();
    if (!search) return items;
    return items.filter((item) => item.name.toLowerCase().includes(search));
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

  /** Deferred refresh policy on mount/revisit: init, dirty IDs, and missing card rows. */
  useEffect(() => {
    if (!userId || myBusinesses.length === 0) return;
    void dispatch(
      businessTaskCapacityActions.orchestrateRefresh(
        userId,
        "mount",
        TASK_CAPACITY_TTL_MS,
      ),
    );
  }, [
    dispatch,
    myBusinesses,
    userId,
  ]);

  /** Safety recovery on focus/visibility/online: prefer dirty-only refresh before fallback full refresh. */
  useEffect(() => {
    if (!userId || myBusinesses.length === 0) return;

    let timer: number | null = null;

    const scheduleRefresh = (reason: "focus" | "visibility" | "online") => {
      if (timer != null) {
        window.clearTimeout(timer);
      }
      timer = window.setTimeout(() => {
        timer = null;
        void dispatch(
          businessTaskCapacityActions.orchestrateRefresh(
            userId,
            reason,
            TASK_CAPACITY_TTL_MS,
          ),
        );
      }, 250);
    };

    const onFocus = () => scheduleRefresh("focus");
    const onOnline = () => scheduleRefresh("online");
    const onVisibility = () => {
      if (!document.hidden) scheduleRefresh("visibility");
    };

    window.addEventListener("focus", onFocus);
    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      if (timer != null) window.clearTimeout(timer);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [
    dispatch,
    myBusinesses,
    userId,
  ]);

  //
  // RENDER
  //

  /** Whether the user has at least one business to render. */
  const hasBusinesses = myBusinesses.length > 0;

  return (
    <>
      {!hasBusinesses ? (
        <EmptyDashboardContent onAddNewBusinessProfile={openCreate} />
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
              {filteredItems.map((item) => (
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
