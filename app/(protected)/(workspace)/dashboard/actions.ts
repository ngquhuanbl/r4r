"use server";

import { ReviewStatusNames } from "@/constants/shared";
import {
  TIER_SLOT_LIMIT,
  TIER_STARTER,
  type BillingTier,
} from "@/lib/billing/tiers";
import { createClient } from "@/lib/supabase/server";
import type { APIResponse, UserId } from "@/types/shared";
import type { Tables } from "@/types/database";


export type BusinessTaskAndCapacityInfo = {
  /**
   * Incoming task are ones that are submitted TO the this business.
   * They are tasks whose `reviewed_business_id` matches the given business and the
   * `status.name` is `SUBMITTED`.
   */
  incoming: number;
  /**
   * Outgoing task are ones that are waiting to be submitted
   * by the given businesses.
   * They are tasks whose `reviewer_user_id` matches the given user and the
   * `status.name` is `DRAFT` and `reviewer_business_id` matches the given business.
   */
  outgoing: number;
  
  /** The slot limit for the business. */
  slotLimit: number;
  /** The number of slots used for the business. */
  slotsUsed: number;
};

/**
 * Fetch the task counts for the given businesses.
 * Per owned business: incoming SUBMITTED (verify) and outgoing DRAFT (submit) when
 * `reviews.reviewer_business_id` matches the owned business.
 */
export async function fetchDashboardBusinessTaskCounts(
  userId: UserId,
  businessIds: Tables<"businesses">["id"][],
): Promise<
  APIResponse<Record<Tables<"businesses">["id"], BusinessTaskAndCapacityInfo>>
> {
  if (businessIds.length === 0) {
    return { ok: true, data: {} };
  }

  const supabase = createClient();

  const [incomingCountRes, outgoingCountRes] = await Promise.all([
    /**
     * Fetch incoming reviews that submitted TO the given businesses
     * that haven't been verified yet.
     */
    supabase
      .from("reviews")
      .select(
        `
        id,
        reviewed_business_id,
        reviewed_owner_user_id,
        status:review_statuses!inner ( name )
      `,
      )
      .eq("reviewed_owner_user_id", userId)
      .eq("status.name", ReviewStatusNames.SUBMITTED)
      .in("reviewed_business_id", businessIds),
    /**
     * Fetch outgoing reviews that are waiting to be submitted
     * by the given businesses
     */
    supabase
      .from("reviews")
      .select(
        `
        id,
        reviewer_user_id,
        reviewer_business_id,
        status:review_statuses!inner ( name )
      `,
      )
      .eq("reviewer_user_id", userId)
      .eq("status.name", ReviewStatusNames.DRAFT)
      .in("reviewer_business_id", businessIds),
  ]);

  if (incomingCountRes.error) {
    console.error(
      "fetchDashboardBusinessTaskCounts incoming count",
      incomingCountRes.error,
    );
    return { ok: false, error: incomingCountRes.error.message };
  }
  if (outgoingCountRes.error) {
    console.error(
      "fetchDashboardBusinessTaskCounts outgoing count",
      outgoingCountRes.error,
    );
    return { ok: false, error: outgoingCountRes.error.message };
  }

  const result: Record<Tables<"businesses">["id"], BusinessTaskAndCapacityInfo> =
    Object.fromEntries(
      businessIds.map((id) => [
        id,
        {
          incoming: 0,
          outgoing: 0,
          slotLimit: 0,
          slotsUsed: 0,
        },
      ]),
    );

  for (const row of incomingCountRes.data ?? []) {
    const bid = row.reviewed_business_id;
    result[bid].incoming++;
  }

  for (const row of outgoingCountRes.data ?? []) {
    const bid = row.reviewer_business_id;
    if (bid == null) continue;
    result[bid].outgoing++;
  }

  const { data: billingData, error: billingErr } = await supabase
    .from("business_billing")
    .select("business_id, slot_limit, slots_used")
    .in("business_id", businessIds);

  if (billingErr) {
    console.error("fetchDashboardBusinessTaskCounts billing data", billingErr);
    return { ok: false, error: billingErr.message };
  }

  /**
   * Capacity info by business.
   * Possible to be missing for some businesses since the billing data serves as the hot read path for slot used counts only.
   */
  const billingByBiz = new Map<
    Tables<"businesses">["id"],
    Pick<Tables<"business_billing">, "slot_limit" | "slots_used">
  >();
  for (const row of billingData ?? []) {
    billingByBiz.set(row.business_id, {
      slot_limit: row.slot_limit,
      slots_used: row.slots_used,
    });
  }

  const missingBillingBusinessIds = businessIds.filter(
    (id) => !billingByBiz.has(id),
  );

  const fallbackSlotUsedByBiz = new Map<
    Tables<"businesses">["id"],
    Tables<"business_billing">["slots_used"]
  >();

  // Fill in missing capacity info for businesses
  if (missingBillingBusinessIds.length > 0) {
    const { data: fallbackSlotUsedData, error: fallbackSlotUsedErr } =
      await supabase
        .from("reviews")
        .select(
          `
        reviewer_business_id,
        status:review_statuses!inner ( name )
      `,
        )
        .in("reviewer_business_id", missingBillingBusinessIds)
        .eq("status.name", ReviewStatusNames.DRAFT);

    if (fallbackSlotUsedErr) {
      console.error(
        "fetchDashboardBusinessTaskCounts fallback slot used",
        fallbackSlotUsedErr,
      );
      return { ok: false, error: fallbackSlotUsedErr.message };
    }

    for (const row of fallbackSlotUsedData ?? []) {
      const bid = row.reviewer_business_id;
      if (bid == null) continue;
      fallbackSlotUsedByBiz.set(bid, (fallbackSlotUsedByBiz.get(bid) ?? 0) + 1);
    }
  }

  const starterSlotLimit = TIER_SLOT_LIMIT[TIER_STARTER as BillingTier];
  const completeCapacityInfor = businessIds.map((id) => {
    const billing = billingByBiz.get(id);
    const limit = billing?.slot_limit ?? starterSlotLimit;
    const used = billing?.slots_used ?? fallbackSlotUsedByBiz.get(id) ?? 0;
    return { id, slotLimit: limit, slotsUsed: used };
  });

  // Fill in capacity info to the result
  for (const { id, slotLimit, slotsUsed } of completeCapacityInfor) {
    result[id].slotLimit = slotLimit;
    result[id].slotsUsed = slotsUsed;
  }

  return { ok: true, data: result };
}
