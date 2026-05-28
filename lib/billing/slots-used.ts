import { ReviewStatusNames } from "@/constants/shared";
import { TIER_SLOT_LIMIT, TIER_STARTER, type BillingTier } from "@/lib/billing/tiers";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import type { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

type Supabase = ReturnType<typeof createClient>;
type SupabaseLike = Pick<Supabase, "from">;

let draftStatusIdCache: number | null = null;

async function getDraftStatusId(supabase: SupabaseLike): Promise<number | null> {
  if (draftStatusIdCache != null) {
    return draftStatusIdCache;
  }
  const { data, error } = await supabase
    .from("review_statuses")
    .select("id")
    .eq("name", ReviewStatusNames.DRAFT)
    .maybeSingle();

  if (error || !data?.id) {
    console.error("getDraftStatusId", error);
    return null;
  }

  draftStatusIdCache = data.id;
  return data.id;
}

export async function getSlotsUsed(
  supabase: Supabase,
  businessId: Tables<"businesses">["id"],
): Promise<number> {
  const { data, error } = await supabase
    .from("business_billing")
    .select("slots_used")
    .eq("business_id", businessId)
    .maybeSingle();

  if (error) {
    console.error("getSlotsUsed business_billing", error);
  } else if (data) {
    return data.slots_used ?? 0;
  }

  const draftStatusId = await getDraftStatusId(supabase);
  if (draftStatusId == null) return 0;

  const { count, error: countErr } = await supabase
    .from("reviews")
    .select("*", { count: "exact", head: true })
    .eq("reviewer_business_id", businessId)
    .eq("status_id", draftStatusId);

  if (countErr) {
    console.error("getSlotsUsed fallback count", countErr);
    return 0;
  }
  return count ?? 0;
}

export async function adjustSlotsUsed(
  businessId: Tables<"businesses">["id"],
  delta: number,
): Promise<number | null> {
  const supabase = createServiceRoleClient();

  const { data: existing, error: existingErr } = await supabase
    .from("business_billing")
    .select("business_id, slots_used")
    .eq("business_id", businessId)
    .maybeSingle();

  if (existingErr) {
    console.error("adjustSlotsUsed existing row", existingErr);
    return null;
  }

  if (!existing) {
    const { error: upsertErr } = await supabase.from("business_billing").upsert(
      {
        business_id: businessId,
        tier: Number(TIER_STARTER),
        slot_limit: TIER_SLOT_LIMIT[TIER_STARTER as BillingTier],
        slots_used: 0,
        cancel_at_period_end: false,
        current_period_end: null,
      },
      { onConflict: "business_id" },
    );
    if (upsertErr) {
      console.error("adjustSlotsUsed upsert starter row", upsertErr);
      return null;
    }
  }

  const { data: after, error: afterErr } = await supabase
    .from("business_billing")
    .select("slots_used")
    .eq("business_id", businessId)
    .maybeSingle();

  if (afterErr || !after) {
    console.error("adjustSlotsUsed select after upsert", afterErr);
    return null;
  }

  const next = Math.max(0, after.slots_used + delta);
  const { data: updated, error: updateErr } = await supabase
    .from("business_billing")
    .update({
      slots_used: next,
      updated_at: new Date().toISOString(),
    })
    .eq("business_id", businessId)
    .select("slots_used")
    .maybeSingle();

  if (updateErr || !updated) {
    console.error("adjustSlotsUsed update", updateErr);
    return null;
  }

  return updated.slots_used;
}

export async function reconcileSlotsUsedFromReviews(
  businessId?: Tables<"businesses">["id"],
): Promise<void> {
  const supabase = createServiceRoleClient();

  const draftStatusId = await getDraftStatusId(supabase);
  if (draftStatusId == null) return;

  const query = supabase
    .from("reviews")
    .select("reviewer_business_id")
    .eq("status_id", draftStatusId)
    .not("reviewer_business_id", "is", null);
  if (businessId != null) {
    query.eq("reviewer_business_id", businessId);
  }

  const { data: draftRows, error: rowsErr } = await query;
  if (rowsErr) {
    console.error("reconcileSlotsUsedFromReviews rows", rowsErr);
    return;
  }

  const counts = new Map<number, number>();
  for (const row of draftRows ?? []) {
    const bid = row.reviewer_business_id;
    if (bid == null) continue;
    counts.set(bid, (counts.get(bid) ?? 0) + 1);
  }

  let targetBusinessIds: number[];
  if (businessId != null) {
    targetBusinessIds = [businessId];
  } else {
    const { data: billingRows } = await supabase
      .from("business_billing")
      .select("business_id");
    const knownIds = new Set<number>([
      ...Array.from(counts.keys()),
      ...(billingRows ?? []).map((row) => row.business_id),
    ]);
    targetBusinessIds = Array.from(knownIds);
  }

  if (targetBusinessIds.length === 0) return;

  for (const bid of targetBusinessIds) {
    const desired = counts.get(bid) ?? 0;
    await supabase
      .from("business_billing")
      .upsert(
        {
          business_id: bid,
          tier: Number(TIER_STARTER),
          slot_limit: TIER_SLOT_LIMIT[TIER_STARTER as BillingTier],
          slots_used: desired,
          cancel_at_period_end: false,
          current_period_end: null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "business_id" },
      );
  }
}
