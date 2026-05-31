"use client";

import { useCallback, useEffect, useState } from "react";

import {
  refetchBusinessBillingContext,
  type BusinessBillingSidebarContext,
} from "@/app/(protected)/(workspace)/business/[id]/actions";
import { refreshBusinessReviewSnapshot } from "@/lib/business/refresh-business-review-snapshot-browser";
import type { FetchedBusiness } from "@/types/dashboard";
import type { Tables } from "@/types/database";
import type { UserId } from "@/types/shared";
import type { BusinessReviewSnapshot } from "@/types/business-page";

import { BusinessLeftPanel } from "./business-left-panel";
import { BusinessReviewsWorkspace } from "./business-reviews-workspace";

export function BusinessPageClient({
  userId,
  business: initialBusiness,
  snapshot: initialSnapshot,
  reviewStatuses,
  billingContext,
}: {
  userId: UserId;
  business: FetchedBusiness;
  snapshot: BusinessReviewSnapshot;
  reviewStatuses: Tables<"review_statuses">[];
  billingContext: BusinessBillingSidebarContext;
}) {
  const [business, setBusiness] = useState<FetchedBusiness>(initialBusiness);
  const [billing, setBilling] =
    useState<BusinessBillingSidebarContext>(billingContext);
  const [snapshot, setSnapshot] =
    useState<BusinessReviewSnapshot>(initialSnapshot);

  useEffect(() => {
    setBusiness(initialBusiness);
  }, [initialBusiness]);

  useEffect(() => {
    setBilling(billingContext);
  }, [billingContext]);

  useEffect(() => {
    setSnapshot(initialSnapshot);
  }, [initialSnapshot]);

  const refreshSnapshot = useCallback(async () => {
    const res = await refreshBusinessReviewSnapshot(business.id);
    if (res.ok) {
      console.log("refreshSnapshot", res.data);
      setSnapshot(res.data);
    }
  }, [business.id]);

  const handleConnectionMatchFound = useCallback(
    ({ slotsDelta }: { slotsDelta: number }) => {
      // Optimistic capacity update for immediate UI feedback.
      setBilling((prev) => {
        const slotsTotal = prev.businessBilling?.slot_limit ?? 1;
        const nextUsed = Math.min(
          slotsTotal,
          Math.max(0, prev.slotsUsed + slotsDelta),
        );
        return { ...prev, slotsUsed: nextUsed };
      });

      // Background reconcile keeps UI in sync if another tab/device changed state.
      void (async () => {
        const res = await refetchBusinessBillingContext(business.id);
        if (res.ok) {
          setBilling(res.data);
        }
      })();
    },
    [business.id],
  );

  const handleBusinessUpdated = useCallback((updated: FetchedBusiness) => {
    setBusiness(updated);
  }, []);

  return (
    <div className="grid w-full grid-cols-1 gap-8 pt-8 pb-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:items-start lg:gap-x-10 lg:gap-y-0">
      <div className="min-w-0 lg:max-w-sm">
        <BusinessLeftPanel
          userId={userId}
          business={business}
          snapshot={snapshot}
          billingContext={billing}
          onBusinessUpdated={handleBusinessUpdated}
          onConnectionMatchFound={handleConnectionMatchFound}
        />
      </div>
      <div className="min-w-0">
        <BusinessReviewsWorkspace
          userId={userId}
          businessId={business.id}
          reviewStatuses={reviewStatuses}
          onOutgoingReviewSubmitted={async () => {
            const res = await refetchBusinessBillingContext(business.id);
            if (res.ok) {
              setBilling(res.data);
            }
          }}
          onReviewStatsMayHaveChanged={refreshSnapshot}
        />
      </div>
    </div>
  );
}
