"use server";

import { ReviewStatusNames } from "@/constants/shared";
import {
  countSlotsUsedForBusiness,
  getSlotLimitForBusiness,
} from "@/lib/billing/check-slots";
import { createClient } from "@/lib/supabase/server";
import type { APIResponse, UserId } from "@/types/shared";
import type { Tables } from "@/types/database";

export type BusinessTaskCounts = {
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
  /** True when active slots used >= plan limit (same rules as business page capacity). */
  isReady: boolean;
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
  APIResponse<Record<Tables<"businesses">["id"], BusinessTaskCounts>>
> {
  if (businessIds.length === 0) {
    return { ok: true, data: {} };
  }

  const supabase = createClient();

  const [incomingRes, outgoingRes] = await Promise.all([
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

  if (incomingRes.error) {
    console.error(
      "fetchDashboardBusinessTaskCounts incoming",
      incomingRes.error,
    );
    return { ok: false, error: incomingRes.error.message };
  }
  if (outgoingRes.error) {
    console.error(
      "fetchDashboardBusinessTaskCounts outgoing",
      outgoingRes.error,
    );
    return { ok: false, error: outgoingRes.error.message };
  }

  const incomingByBiz = new Map<number, number>();
  for (const row of incomingRes.data ?? []) {
    const bid = row.reviewed_business_id;
    incomingByBiz.set(bid, (incomingByBiz.get(bid) ?? 0) + 1);
  }

  const outgoingByBiz = new Map<number, number>();
  for (const row of outgoingRes.data ?? []) {
    const bid = row.reviewer_business_id;
    if (bid == null) continue;
    outgoingByBiz.set(bid, (outgoingByBiz.get(bid) ?? 0) + 1);
  }

  const data: Record<Tables<"businesses">["id"], BusinessTaskCounts> =
    Object.fromEntries(
      businessIds.map((id) => [
        id,
        {
          incoming: 0,
          outgoing: 0,
          isReady: false,
        },
      ]),
    );

  for (const id of businessIds) {
    data[id] = {
      incoming: incomingByBiz.get(id) ?? 0,
      outgoing: outgoingByBiz.get(id) ?? 0,
      isReady: false,
    };
  }

  const capacityRows = await Promise.all(
    businessIds.map(async (id) => {
      const [limit, used] = await Promise.all([
        getSlotLimitForBusiness(supabase, id),
        countSlotsUsedForBusiness(supabase, id),
      ]);
      return { id, connectionFull: used >= limit };
    }),
  );

  for (const row of capacityRows) {
    data[row.id].isReady = row.connectionFull;
  }

  return { ok: true, data };
}
