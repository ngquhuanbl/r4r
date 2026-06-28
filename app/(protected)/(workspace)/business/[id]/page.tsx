import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";

import { BusinessCapacitySkeleton } from "@/components/business/left-section/business-capacity-subsection/business-capacity-skeleton";
import { BusinessInfoSubSectionClient } from "@/components/business/left-section/business-info-subsection/business-info-sub-section-client";
import { BusinessMetricsSkeleton } from "@/components/business/left-section/business-metrics-skeleton";
import { getUser, getUserOrRedirect } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

import { getBusinessForUserCached } from "./actions";
import { BusinessReviewsWorkspaceServer } from "./right-section/business-reviews-workspace-server";
import { ConnectionCapacityServer } from "./left-section/connection-capacity-server";
import { BusinessMetricsServer } from "./left-section/business-metrics-server";

type PageProps = { params: { id: string } };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const id = Number.parseInt(params.id, 10);
  if (Number.isNaN(id)) {
    return { title: "Business | R4R" };
  }
  const user = await getUser();
  if (!user) {
    return { title: "Business | R4R" };
  }
  const business = await getBusinessForUserCached(user.id, id);
  if (!business) {
    return { title: "Business | R4R" };
  }
  return {
    title: `${business.business_name} | R4R`,
    description: `Manage review exchanges and tasks for ${business.business_name}.`,
  };
}

/**
 * Business detail page, displays 2 main sections:
 * 1. Left sidebar: Business info, capacity and metrics
 * 2. Right sidebar: Reviews workspace
 */
export default async function BusinessPage({ params }: PageProps) {
  const id = Number.parseInt(params.id, 10);
  if (Number.isNaN(id)) {
    notFound();
  }

  const user = await getUserOrRedirect();
  const business = await getBusinessForUserCached(user.id, id as Tables<"businesses">["id"]);
  if (!business) {
    notFound();
  }

  return (
    <div className="grid w-full grid-cols-1 gap-8 pt-8 pb-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:items-start lg:gap-x-10 lg:gap-y-0">
      <div className="flex min-w-0 flex-col gap-6 lg:max-w-sm">
        <BusinessInfoSubSectionClient business={business} />
        <Suspense fallback={<BusinessCapacitySkeleton />}>
          <ConnectionCapacityServer
            userId={user.id}
            businessId={business.id}
            businessName={business.business_name}
          />
        </Suspense>
        <Suspense fallback={<BusinessMetricsSkeleton />}>
          <BusinessMetricsServer userId={user.id} businessId={business.id} />
        </Suspense>
      </div>
      <div className="min-w-0">
        <BusinessReviewsWorkspaceServer userId={user.id} businessId={business.id} />
      </div>
    </div>
  );
}
