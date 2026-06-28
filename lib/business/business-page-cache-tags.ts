import type { Tables } from "@/types/database";
import type { UserId } from "@/types/shared";

export function getBusinessListTag(userId: UserId): string {
  return `business-list:${userId}`;
}

export function getBusinessProfileTag(
  businessId: Tables<"businesses">["id"],
): string {
  return `business-profile:${businessId}`;
}

export function getBusinessSnapshotTag(
  businessId: Tables<"businesses">["id"],
): string {
  return `business-snapshot:${businessId}`;
}

export function getBusinessBillingInfoTag(
  businessId: Tables<"businesses">["id"],
): string {
  return `business-billing-info:${businessId}`;
}
