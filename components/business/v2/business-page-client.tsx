"use client";

import { useRouter } from "next/navigation";

import type { BusinessBillingSidebarContext } from "@/app/(protected)/business/[id]/actions";
import type { FetchedBusiness } from "@/types/dashboard";
import type { Tables } from "@/types/database";
import type { UserId } from "@/types/shared";
import type { BusinessReviewSnapshot } from "@/types/business-page";

import { BusinessLeftPanel } from "./business-left-panel";
import { BusinessReviewsWorkspace } from "./business-reviews-workspace";

export function BusinessPageClient({
  userId,
  business,
  snapshot,
  reviewStatuses,
  billingContext,
}: {
  userId: UserId;
  business: FetchedBusiness;
  snapshot: BusinessReviewSnapshot;
  reviewStatuses: Tables<"review_statuses">[];
  billingContext: BusinessBillingSidebarContext;
}) {
  const router = useRouter();

  return (
    <div className="grid w-full grid-cols-1 gap-8 pt-8 pb-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:items-start lg:gap-x-10 lg:gap-y-0">
      <div className="min-w-0 lg:max-w-sm">
        <BusinessLeftPanel
          business={business}
          snapshot={snapshot}
          billingContext={billingContext}
          onBusinessUpdated={() => router.refresh()}
        />
      </div>
      <div className="min-w-0">
        <BusinessReviewsWorkspace
          userId={userId}
          businessId={business.id}
          reviewStatuses={reviewStatuses}
        />
      </div>
    </div>
  );
}
