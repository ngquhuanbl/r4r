import { revalidateTag } from "next/cache";

import {
  getBusinessListTag,
  getBusinessProfileTag,
} from "@/lib/business/business-page-cache-tags";
import type { Tables } from "@/types/database";
import type { UserId } from "@/types/shared";

/** Invalidates cached business list data for a user. */
export function revalidateBusinessListCache(userId: UserId): void {
  revalidateTag(getBusinessListTag(userId));
}

/** Invalidates cached single-business profile data. */
export function revalidateBusinessProfileCache(
  businessId: Tables<"businesses">["id"],
): void {
  revalidateTag(getBusinessProfileTag(businessId));
}

/** Invalidates list cache and, when provided, the updated business profile cache. */
export function revalidateBusinessCaches(
  userId: UserId,
  businessId?: Tables<"businesses">["id"],
): void {
  // Mutations call this after writes; clients still need router.refresh() for mounted UI.
  revalidateBusinessListCache(userId);
  if (businessId != null) {
    revalidateBusinessProfileCache(businessId);
  }
}
