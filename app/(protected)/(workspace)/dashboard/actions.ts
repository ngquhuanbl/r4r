"use server";

import { ReviewStatusNames } from "@/constants/shared";
import {
  countSlotsUsedForBusiness,
  getSlotLimitForBusiness,
} from "@/lib/billing/check-slots";
import { createClient } from "@/lib/supabase/server";
import type { APIResponse, UserId } from "@/types/shared";
import type { Tables } from "@/types/database";

export type BusinessActionCounts = {
  incomingAction: number;
  outgoingAction: number;
  /** True when active slots used >= plan limit (same rules as business page capacity). */
  connectionFull: boolean;
};

/**
 * Per owned business: incoming SUBMITTED (verify) and outgoing DRAFT (submit) when
 * `reviews.reviewer_business_id` matches the owned business.
 */
export async function fetchDashboardBusinessActionCounts(
  userId: UserId,
  businessIds: Tables<"businesses">["id"][],
): Promise<APIResponse<Record<number, BusinessActionCounts>>> {
  if (businessIds.length === 0) {
    return { ok: true, data: {} };
  }

  const supabase = createClient();

  const empty = (): Record<number, BusinessActionCounts> =>
    Object.fromEntries(
      businessIds.map((id) => [
        id,
        {
          incomingAction: 0,
          outgoingAction: 0,
          connectionFull: false,
        },
      ]),
    ) as Record<number, BusinessActionCounts>;

  const businessIdSet = new Set(businessIds);

  const [incomingRes, outgoingRes] = await Promise.all([
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
      .eq("status.name", ReviewStatusNames.DRAFT),
  ]);

  if (incomingRes.error) {
    console.error("fetchDashboardBusinessActionCounts incoming", incomingRes.error);
    return { ok: false, error: incomingRes.error.message };
  }
  if (outgoingRes.error) {
    console.error("fetchDashboardBusinessActionCounts outgoing", outgoingRes.error);
    return { ok: false, error: outgoingRes.error.message };
  }

  const incomingByBiz = new Map<number, number>();
  for (const row of incomingRes.data ?? []) {
    const bid = row.reviewed_business_id as number;
    incomingByBiz.set(bid, (incomingByBiz.get(bid) ?? 0) + 1);
  }

  const outgoingByBiz = new Map<number, number>();
  for (const row of outgoingRes.data ?? []) {
    const bid = row.reviewer_business_id as number | null;
    if (bid == null || !businessIdSet.has(bid)) continue;
    outgoingByBiz.set(bid, (outgoingByBiz.get(bid) ?? 0) + 1);
  }

  const data = empty();
  for (const id of businessIds) {
    data[id] = {
      incomingAction: incomingByBiz.get(id) ?? 0,
      outgoingAction: outgoingByBiz.get(id) ?? 0,
      connectionFull: false,
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
    data[row.id].connectionFull = row.connectionFull;
  }

  return { ok: true, data };
}
