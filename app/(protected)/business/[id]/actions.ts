"use server";

import { countSlotsUsedForBusiness } from "@/lib/billing/check-slots";
import { createClient } from "@/lib/supabase/server";
import { ReviewStatusNames } from "@/constants/shared";
import type { FetchedBusiness } from "@/types/dashboard";
import type { BusinessReviewSnapshot } from "@/types/business-page";
import type { APIResponse, UserId } from "@/types/shared";
import type { Tables } from "@/types/database";

/**
 * Returns the business row only if it belongs to the given user.
 */
export async function getBusinessForUser(
  userId: UserId,
  businessId: Tables<"businesses">["id"],
): Promise<FetchedBusiness | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("businesses")
    .select(
      `
      id,
      business_name,
      phone,
      address,
      city,
      state,
      zip_code,
      cover_image_url,
      created_at,
      updated_at,
      platforms:business_platforms (
        id,
        platform_id,
        platform_url
      )
      `,
    )
    .eq("id", businessId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("getBusinessForUser", error);
    return null;
  }
  if (!data) return null;

  const { platforms, ...rest } = data;
  const platform_urls: FetchedBusiness["platform_urls"] = {};
  (platforms ?? []).forEach((row) => {
    if (row.platform_url != null) {
      platform_urls[row.platform_id] = row.platform_url;
    }
  });

  return {
    ...rest,
    platform_urls,
  };
}

/**
 * Snapshot counts for the stacked bar chart. "Received" is scoped to this business.
 * "Given" is user-global (outgoing reviews are not linked to a specific owned business in `review_invitations`).
 */
export async function fetchBusinessReviewSnapshot(
  userId: UserId,
  businessId: Tables<"businesses">["id"],
): Promise<APIResponse<BusinessReviewSnapshot>> {
  const supabase = createClient();

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
      .eq("invitation.business.id", businessId)
      .neq("status_id", draftId);

  const baseOutgoing = () =>
    supabase
      .from("reviews")
      .select(
        `id,
        invitation:review_invitations!inner ( invitee_id )`,
        { count: "exact", head: true },
      )
      .eq("invitation.invitee_id", userId)
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
        invitation:review_invitations!inner ( invitee_id )`,
        { count: "exact", head: true },
      )
      .eq("invitation.invitee_id", userId)
      .eq("status_id", verifiedId),
    supabase
      .from("reviews")
      .select(
        `id,
        invitation:review_invitations!inner ( invitee_id )`,
        { count: "exact", head: true },
      )
      .eq("invitation.invitee_id", userId)
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

export type BusinessBillingSidebarContext = {
  businessBilling: Tables<"business_billing"> | null;
  subscriptionPeriodEnd: string | null;
  slotsUsed: number;
};

/** Billing row, renewal date, and active connection count for the workspace sidebar. */
export async function fetchBusinessBillingContext(
  userId: UserId,
  businessId: Tables<"businesses">["id"],
): Promise<BusinessBillingSidebarContext> {
  const supabase = createClient();
  const [{ data: bb }, { data: ub }, slotsUsed] = await Promise.all([
    supabase
      .from("business_billing")
      .select("*")
      .eq("business_id", businessId)
      .maybeSingle(),
    supabase
      .from("user_billing")
      .select("subscription_current_period_end")
      .eq("user_id", userId)
      .maybeSingle(),
    countSlotsUsedForBusiness(supabase, businessId),
  ]);

  return {
    businessBilling: bb,
    subscriptionPeriodEnd: ub?.subscription_current_period_end ?? null,
    slotsUsed,
  };
}
