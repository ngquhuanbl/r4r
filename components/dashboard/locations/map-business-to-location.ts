import type { BusinessActionCounts } from "@/app/(protected)/(workspace)/dashboard/actions";
import { FetchedBusiness } from "@/types/dashboard";
import { getAddress } from "@/utils/shared";

import type { DashboardLocation } from "./types";

export function mapBusinessToLocation(
  b: FetchedBusiness,
  counts: BusinessActionCounts | undefined,
): DashboardLocation {
  if (!counts) {
    return {
      id: String(b.id),
      name: b.business_name,
      status: "loading",
      address: getAddress(b),
      imageSrc: b.cover_image_url,
      imageAlt: b.business_name ? `${b.business_name} storefront` : "",
      left: { count: 0 },
      right: { count: 0 },
    };
  }

  return {
    id: String(b.id),
    name: b.business_name,
    status: counts.connectionFull ? "full" : "ready",
    address: getAddress(b),
    imageSrc: b.cover_image_url,
    imageAlt: b.business_name ? `${b.business_name} storefront` : "",
    left: { count: counts.incomingAction },
    right: { count: counts.outgoingAction },
  };
}
