"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  refetchBusinessBillingContext,
  type BusinessBillingSidebarContext,
} from "@/app/(protected)/business/[id]/actions";
import type { FetchedBusiness } from "@/types/dashboard";
import type { Tables } from "@/types/database";
import type { UserId } from "@/types/shared";
import type { BusinessReviewSnapshot } from "@/types/business-page";

import { BusinessLeftPanel } from "./business-left-panel";
import {
  BusinessReviewsWorkspace,
  type BusinessReviewsWorkspaceHandle,
} from "./business-reviews-workspace";

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
  const pathname = usePathname();
  const reviewsWorkspaceRef = useRef<BusinessReviewsWorkspaceHandle>(null);
  const [billing, setBilling] =
    useState<BusinessBillingSidebarContext>(billingContext);

  useEffect(() => {
    setBilling(billingContext);
  }, [billingContext]);

  return (
    <div className="grid w-full grid-cols-1 gap-8 pt-8 pb-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:items-start lg:gap-x-10 lg:gap-y-0">
      <div className="min-w-0 lg:max-w-sm">
        <BusinessLeftPanel
          userId={userId}
          business={business}
          snapshot={snapshot}
          billingContext={billing}
          onBusinessUpdated={() => router.refresh()}
          onConnectionMatchFound={async () => {
            reviewsWorkspaceRef.current?.afterConnectionMatch();
            const next = new URLSearchParams(
              typeof window !== "undefined" ? window.location.search : "",
            );
            next.set("tab", "outgoing");
            router.replace(`${pathname}?${next.toString()}`, { scroll: false });
            window.setTimeout(() => {
              document
                .getElementById("business-reviews-workspace")
                ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }, 50);
            const res = await refetchBusinessBillingContext(business.id);
            if (res.ok) {
              setBilling(res.data);
            } else {
              toast.error("Could not refresh connection capacity", {
                description:
                  typeof res.error === "string"
                    ? res.error
                    : "Please refresh the page.",
              });
            }
          }}
        />
      </div>
      <div className="min-w-0">
        <BusinessReviewsWorkspace
          ref={reviewsWorkspaceRef}
          userId={userId}
          businessId={business.id}
          reviewStatuses={reviewStatuses}
        />
      </div>
    </div>
  );
}
