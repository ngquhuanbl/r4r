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
 * `review_invitations.invitee_business_id` is set for the invitee.
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
        invitation:review_invitations!inner (
          business_id,
          inviter_id
        ),
        status:review_statuses!inner ( name )
      `,
      )
      .eq("invitation.inviter_id", userId)
      .eq("status.name", ReviewStatusNames.SUBMITTED)
      .in("invitation.business_id", businessIds),
    supabase
      .from("reviews")
      .select(
        `
        id,
        invitation:review_invitations!inner (
          invitee_id,
          invitee_business_id
        ),
        status:review_statuses!inner ( name )
      `,
      )
      .eq("invitation.invitee_id", userId)
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
    const inv = row.invitation as { business_id: number };
    const bid = inv.business_id;
    incomingByBiz.set(bid, (incomingByBiz.get(bid) ?? 0) + 1);
  }

  const outgoingByBiz = new Map<number, number>();
  for (const row of outgoingRes.data ?? []) {
    const inv = row.invitation as { invitee_business_id: number | null };
    const bid = inv.invitee_business_id;
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
