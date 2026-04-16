import type { BusinessActionCounts } from "@/app/(protected)/dashboard/actions";
import { FetchedBusiness } from "@/types/dashboard";
import { getAddress } from "@/utils/shared";

import type { DashboardLocation } from "./types";

export function mapBusinessToLocation(
  b: FetchedBusiness,
  counts: BusinessActionCounts,
): DashboardLocation {
  return {
    id: String(b.id),
    name: b.business_name,
    status: "ready",
    address: getAddress(b),
    imageSrc: b.cover_image_url,
    imageAlt: b.business_name ? `${b.business_name} storefront` : "",
    left: { count: counts.incomingAction },
    right: { count: counts.outgoingAction },
  };
}
