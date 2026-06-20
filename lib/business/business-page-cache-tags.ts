import type { Tables } from "@/types/database";

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
