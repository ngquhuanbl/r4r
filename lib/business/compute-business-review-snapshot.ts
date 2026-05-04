import type { SupabaseClient } from "@supabase/supabase-js";

import { ReviewStatusNames } from "@/constants/shared";
import type { Database } from "@/types/database";
import type { BusinessReviewSnapshot } from "@/types/business-page";
import type { APIResponse, UserId } from "@/types/shared";

/**
 * Shared counts for the business page performance chart (server or browser Supabase).
 */
export async function computeBusinessReviewSnapshot(
  supabase: SupabaseClient<Database>,
  userId: UserId,
  businessId: Database["public"]["Tables"]["businesses"]["Row"]["id"],
): Promise<APIResponse<BusinessReviewSnapshot>> {
  const { data: statuses, error: stErr } = await supabase
    .from("review_statuses")
    .select("id, name");

  if (stErr || !statuses?.length) {
    return { ok: false, error: stErr?.message ?? "review_statuses" };
  }

  const byName = Object.fromEntries(statuses.map((s) => [s.name, s.id])) as Record<
    string,
    number
  >;
  const verifiedId = byName[ReviewStatusNames.VERIFIED];
  const rejectedId = byName[ReviewStatusNames.REJECTED];
  const draftId = byName[ReviewStatusNames.DRAFT];

  if (
    verifiedId === undefined ||
    rejectedId === undefined ||
    draftId === undefined
  ) {
    return {
      ok: false,
      error:
        "review_statuses is missing DRAFT, VERIFIED, or REJECTED row (check DB seed).",
    };
  }

  const baseIncoming = () =>
    supabase
      .from("reviews")
      .select(
        `
        id,
        invitation:review_invitations!inner (
          business_id,
          inviter_id
        )
      `,
        { count: "exact", head: true },
      )
      .eq("invitation.inviter_id", userId)
      .eq("invitation.business_id", businessId)
      .neq("status_id", draftId);

  const baseOutgoing = () =>
    supabase
      .from("reviews")
      .select(
        `id,
        invitation:review_invitations!inner ( invitee_id, invitee_business_id )`,
        { count: "exact", head: true },
      )
      .eq("invitation.invitee_id", userId)
      .eq("invitation.invitee_business_id", businessId)
      .neq("status_id", draftId);

  const [
    recvVerified,
    recvRejected,
    totalIncoming,
    givenVerified,
    givenRejected,
    totalOutgoing,
  ] = await Promise.all([
    baseIncoming().eq("status_id", verifiedId),
    baseIncoming().eq("status_id", rejectedId),
    baseIncoming(),
    supabase
      .from("reviews")
      .select(
        `id,
        invitation:review_invitations!inner ( invitee_id, invitee_business_id )`,
        { count: "exact", head: true },
      )
      .eq("invitation.invitee_id", userId)
      .eq("invitation.invitee_business_id", businessId)
      .eq("status_id", verifiedId),
    supabase
      .from("reviews")
      .select(
        `id,
        invitation:review_invitations!inner ( invitee_id, invitee_business_id )`,
        { count: "exact", head: true },
      )
      .eq("invitation.invitee_id", userId)
      .eq("invitation.invitee_business_id", businessId)
      .eq("status_id", rejectedId),
    baseOutgoing(),
  ]);

  const errors = [
    recvVerified.error,
    recvRejected.error,
    totalIncoming.error,
    givenVerified.error,
    givenRejected.error,
    totalOutgoing.error,
  ].filter(Boolean);
  if (errors.length) {
    return { ok: false, error: errors[0]!.message };
  }

  const rv = recvVerified.count ?? 0;
  const rr = recvRejected.count ?? 0;
  const ti = totalIncoming.count ?? 0;
  const gv = givenVerified.count ?? 0;
  const gr = givenRejected.count ?? 0;
  const to = totalOutgoing.count ?? 0;

  return {
    ok: true,
    data: {
      received: {
        accepted: rv,
        rejected: rr,
        other: Math.max(0, ti - rv - rr),
      },
      given: {
        accepted: gv,
        rejected: gr,
        other: Math.max(0, to - gv - gr),
      },
    },
  };
}
