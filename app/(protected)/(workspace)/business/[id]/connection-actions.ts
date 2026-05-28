"use server";

import { revalidatePath } from "next/cache";

import { Paths } from "@/constants/paths";
import { ReviewStatusNames } from "@/constants/shared";
import { assertBusinessHasAvailableSlot } from "@/lib/billing/check-slots";
import { adjustSlotsUsed } from "@/lib/billing/slots-used";
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

/**
 * Find another user's business with a free slot, optional same-state stub for proximity.
 */
async function findMatchCandidate(
  supabase: ReturnType<typeof createClient>,
  initiatorBusinessId: number,
  initiatorUserId: UserId,
  initiatorState: string,
): Promise<number | null> {
  const { data: candidates, error } = await supabase
    .from("businesses")
    .select("id, user_id, state")
    .neq("user_id", initiatorUserId)
    .neq("id", initiatorBusinessId)
    .eq("state", initiatorState)
    .order("id", { ascending: true })
    .limit(40);

  if (error || !candidates?.length) {
    const { data: fallback } = await supabase
      .from("businesses")
      .select("id, user_id")
      .neq("user_id", initiatorUserId)
      .neq("id", initiatorBusinessId)
      .order("id", { ascending: true })
      .limit(40);

    if (!fallback?.length) return null;

    for (const row of fallback) {
      const slot = await assertBusinessHasAvailableSlot(supabase, row.id);
      if (!slot.ok) continue;
      if (
        await hasConnectionBetween(
          supabase,
          initiatorBusinessId,
          row.id,
        )
      ) {
        continue;
      }
      return row.id;
    }
    return null;
  }

  for (const row of candidates) {
    const slot = await assertBusinessHasAvailableSlot(supabase, row.id);
    if (!slot.ok) continue;
    if (
      await hasConnectionBetween(
        supabase,
        initiatorBusinessId,
        row.id,
      )
    ) {
      continue;
    }
    return row.id;
  }

  return null;
}

export async function startConnectionMatch(
  userId: UserId,
  businessId: Tables<"businesses">["id"],
): Promise<
  APIResponse<{ connectionId: number } | { matched: false; reason?: string }>
> {
  const supabase = createClient();

  const { data: mine, error: bErr } = await supabase
    .from("businesses")
    .select("id, user_id, state")
    .eq("id", businessId)
    .maybeSingle();

  if (bErr || !mine || mine.user_id !== userId) {
    return { ok: false, error: "Business not found" };
  }

  const slotOk = await assertBusinessHasAvailableSlot(supabase, businessId);
  if (!slotOk.ok) {
    return { ok: false, error: slotOk.error };
  }

  const partnerBusinessId = await findMatchCandidate(
    supabase,
    businessId,
    userId,
    mine.state,
  );

  if (partnerBusinessId == null) {
    return {
      ok: true,
      data: { matched: false, reason: "no_partner" },
    };
  }

  const { data: partner } = await supabase
    .from("businesses")
    .select("id, user_id")
    .eq("id", partnerBusinessId)
    .single();

  if (!partner) {
    return { ok: false, error: "Partner business missing" };
  }

  const { low, high } = canonicalPair(businessId, partnerBusinessId);

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

  const { data: pPartner } = await supabase
    .from("business_platforms")
    .select("platform_id")
    .eq("business_id", partnerBusinessId)
    .limit(1)
    .maybeSingle();

  if (!pInit?.platform_id || !pPartner?.platform_id) {
    return {
      ok: false,
      error:
        "Both businesses need at least one platform linked before matching.",
    };
  }

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
      return {
        ok: true,
        data: { matched: false, reason: "already_matched_before" },
      };
    }
    console.error("startConnectionMatch connection insert", connErr);
    return { ok: false, error: connErr?.message ?? "Could not create connection" };
  }

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
    return { ok: false, error: r1e?.message ?? r2e?.message ?? "Review draft failed" };
  }

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
    return { ok: false, error: "Could not reserve slot counters for this match" };
  }

  revalidatePath(Paths.DASHBOARD);
  // Do not revalidate business profile URLs here: the user may be on that page;
  // revalidation remounts client state and resets UI (e.g. reviews tab). Billing
  // and lists are refreshed via client actions on the business page instead.

  return { ok: true, data: { connectionId } };
}

