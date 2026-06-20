"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { Paths } from "@/constants/paths";
import { ReviewStatusNames } from "@/constants/shared";
import {
  assertBusinessHasAvailableSlot,
  countSlotsUsedForBusiness,
  getSlotLimitForBusiness,
} from "@/lib/billing/check-slots";
import { adjustSlotsUsed } from "@/lib/billing/slots-used";
import {
  buildMatchSummary,
  type MatchReason,
  type MatchSummary,
} from "@/lib/connections/match-summary";
import { getBusinessBillingInfoTag } from "@/lib/business/business-page-cache-tags";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { APIResponse, UserId } from "@/types/shared";
import type { Tables } from "@/types/database";

function canonicalPair(
  a: number,
  b: number,
): { low: number; high: number } {
  return a < b ? { low: a, high: b } : { low: b, high: a };
}

async function hasConnectionBetween(
  supabase: ReturnType<typeof createClient>,
  businessIdA: number,
  businessIdB: number,
): Promise<boolean> {
  const { low, high } = canonicalPair(businessIdA, businessIdB);
  const { data, error } = await supabase
    .from("connections")
    .select("id")
    .eq("business_a_id", low)
    .eq("business_b_id", high)
    .maybeSingle();

  if (error) {
    console.error("hasConnectionBetween", error);
    return true;
  }
  return data != null;
}

export type StartConnectionMatchSummary = MatchSummary;

/**
 * Find another user's business with a free slot, optional same-state stub for proximity.
 */
async function listMatchCandidates(
  supabase: ReturnType<typeof createClient>,
  initiatorBusinessId: number,
  initiatorUserId: UserId,
  initiatorState: string,
): Promise<number[]> {
  const { data: sameStateCandidates } = await supabase
    .from("businesses")
    .select("id")
    .neq("user_id", initiatorUserId)
    .neq("id", initiatorBusinessId)
    .eq("state", initiatorState)
    .order("id", { ascending: true })
    .limit(80);

  const { data: fallbackCandidates } = await supabase
    .from("businesses")
    .select("id")
    .neq("user_id", initiatorUserId)
    .neq("id", initiatorBusinessId)
    .order("id", { ascending: true })
    .limit(120);

  const orderedIds: number[] = [];
  const seen = new Set<number>();
  for (const row of sameStateCandidates ?? []) {
    if (!seen.has(row.id)) {
      seen.add(row.id);
      orderedIds.push(row.id);
    }
  }
  for (const row of fallbackCandidates ?? []) {
    if (!seen.has(row.id)) {
      seen.add(row.id);
      orderedIds.push(row.id);
    }
  }
  return orderedIds;
}

async function getAvailableCapacity(
  supabase: ReturnType<typeof createClient>,
  businessId: number,
): Promise<number> {
  const [slotLimit, slotsUsed] = await Promise.all([
    getSlotLimitForBusiness(supabase, businessId),
    countSlotsUsedForBusiness(supabase, businessId),
  ]);
  return Math.max(0, slotLimit - slotsUsed);
}

export async function startConnectionMatch(
  userId: UserId,
  businessId: Tables<"businesses">["id"],
): Promise<APIResponse<StartConnectionMatchSummary>> {
  // 1) Authenticate caller against the provided user id.
  const authSupabase = createClient();
  const {
    data: { user },
  } = await authSupabase.auth.getUser();
  if (!user || user.id !== userId) {
    return { ok: false, error: "Unauthorized" };
  }
  const supabase = createServiceRoleClient();

  // 2) Load the initiator business and enforce ownership.
  const { data: mine, error: bErr } = await supabase
    .from("businesses")
    .select("id, user_id, state")
    .eq("id", businessId)
    .maybeSingle();

  if (bErr || !mine || mine.user_id !== userId) {
    return { ok: false, error: "Business not found" };
  }

  // 3) Compute fill target (all currently available slots for initiator).
  const initialCapacity = await getAvailableCapacity(supabase, businessId);
  if (initialCapacity <= 0) {
    return {
      ok: true,
      data: { matchedCount: 0, remainingCapacity: 0, reason: "no_capacity" },
    };
  }

  // 4) Resolve fixed prerequisites once (draft status + initiator platform).
  const { data: draftSt } = await supabase
    .from("review_statuses")
    .select("id")
    .eq("name", ReviewStatusNames.DRAFT)
    .single();

  if (!draftSt) {
    return { ok: false, error: "Status configuration missing" };
  }

  const { data: pInit } = await supabase
    .from("business_platforms")
    .select("platform_id")
    .eq("business_id", businessId)
    .limit(1)
    .maybeSingle();

  if (!pInit?.platform_id) {
    return {
      ok: false,
      error: "Your business needs at least one platform linked before matching.",
    };
  }

  // 5) Build deterministic candidate order: same-state first, global fallback.
  const orderedCandidates = await listMatchCandidates(
    supabase,
    businessId,
    userId,
    mine.state,
  );

  if (orderedCandidates.length === 0) {
    return {
      ok: true,
      data: {
        matchedCount: 0,
        remainingCapacity: initialCapacity,
        reason: "no_partner",
      },
    };
  }

  // 6) Iterate candidates until capacity is filled or supply is exhausted.
  let matchedCount = 0;
  let conflictSkips = 0;
  let partnerCapacitySkips = 0;
  let fatalReason: MatchReason | undefined;

  for (const partnerBusinessId of orderedCandidates) {
    if (matchedCount >= initialCapacity) {
      break;
    }

    // Re-check both sides right before create to reduce race window.
    const initiatorSlotOk = await assertBusinessHasAvailableSlot(supabase, businessId);
    if (!initiatorSlotOk.ok) {
      break;
    }

    const partnerSlotOk = await assertBusinessHasAvailableSlot(
      supabase,
      partnerBusinessId,
    );
    if (!partnerSlotOk.ok) {
      partnerCapacitySkips += 1;
      continue;
    }

    // Lifetime uniqueness guard: skip previously-connected pairs.
    if (await hasConnectionBetween(supabase, businessId, partnerBusinessId)) {
      conflictSkips += 1;
      continue;
    }

    const { data: partner } = await supabase
      .from("businesses")
      .select("id, user_id")
      .eq("id", partnerBusinessId)
      .maybeSingle();

    if (!partner) continue;

    // Partner must have at least one platform to construct reciprocal drafts.
    const { data: pPartner } = await supabase
      .from("business_platforms")
      .select("platform_id")
      .eq("business_id", partnerBusinessId)
      .limit(1)
      .maybeSingle();
    if (!pPartner?.platform_id) continue;

    const { low, high } = canonicalPair(businessId, partnerBusinessId);
    const { data: connRow, error: connErr } = await supabase
      .from("connections")
      .insert({
        business_a_id: low,
        business_b_id: high,
        initiator_business_id: businessId,
      })
      .select("id")
      .single();

    if (connErr || !connRow) {
      if (connErr?.code === "23505") {
        conflictSkips += 1;
        continue;
      }
      console.error("startConnectionMatch connection insert", connErr);
      fatalReason = "internal_error";
      break;
    }

    // 7) Create both draft review legs for the new connection.
    const connectionId = connRow.id;
    const review1 = {
      connection_id: connectionId,
      platform_id: pInit.platform_id,
      reviewed_business_id: businessId,
      reviewed_owner_user_id: userId,
      reviewer_user_id: partner.user_id,
      reviewer_business_id: partnerBusinessId,
      status_id: draftSt.id,
    };

    const review2 = {
      connection_id: connectionId,
      platform_id: pPartner.platform_id,
      reviewed_business_id: partnerBusinessId,
      reviewed_owner_user_id: partner.user_id,
      reviewer_user_id: userId,
      reviewer_business_id: businessId,
      status_id: draftSt.id,
    };

    const { error: r1e } = await supabase.from("reviews").insert(review1);
    const { error: r2e } = await supabase.from("reviews").insert(review2);

    if (r1e || r2e) {
      await supabase.from("reviews").delete().eq("connection_id", connectionId);
      await supabase.from("connections").delete().eq("id", connectionId);
      fatalReason = "internal_error";
      break;
    }

    // 8) Reserve one slot on both businesses; rollback pair if reservation fails.
    const [initiatorSlots, partnerSlots] = await Promise.all([
      adjustSlotsUsed(businessId, +1),
      adjustSlotsUsed(partnerBusinessId, +1),
    ]);

    if (initiatorSlots == null || partnerSlots == null) {
      if (initiatorSlots != null) {
        await adjustSlotsUsed(businessId, -1);
      }
      if (partnerSlots != null) {
        await adjustSlotsUsed(partnerBusinessId, -1);
      }
      await supabase.from("reviews").delete().eq("connection_id", connectionId);
      await supabase.from("connections").delete().eq("id", connectionId);
      fatalReason = "internal_error";
      break;
    }

    matchedCount += 1;
  }

  // 9) Convert loop outcome into a stable summary contract for the UI.
  const summary = buildMatchSummary({
    initialCapacity,
    matchedCount,
    conflictSkips,
    partnerCapacitySkips,
    fatalReason,
  });

  // 10) Revalidate dashboard only when at least one new connection was created.
  if (matchedCount > 0) {
    revalidatePath(Paths.DASHBOARD);
    revalidateTag(getBusinessBillingInfoTag(businessId));
    // Do not revalidate business profile URLs here: the user may be on that page;
    // revalidation remounts client state and resets UI (e.g. reviews tab). Billing
    // and lists are refreshed via client actions on the business page instead.
  }

  return {
    ok: true,
    data: summary,
  };
}

