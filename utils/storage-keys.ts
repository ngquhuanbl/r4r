import type { Tables } from "@/types/database";

export function createOutgoingLastCursorStorageKey(
  businessId: Tables<"businesses">["id"],
): string {
  return `r4r:outgoing:lastCursor:${businessId}`;
}
