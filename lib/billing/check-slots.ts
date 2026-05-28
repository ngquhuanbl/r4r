import { TIER_SLOT_LIMIT, TIER_STARTER, type BillingTier } from "@/lib/billing/tiers";
import { getSlotsUsed } from "@/lib/billing/slots-used";
import type { createClient } from "@/lib/supabase/server";

type Supabase = ReturnType<typeof createClient>;

export async function getSlotLimitForBusiness(
  supabase: Supabase,
  businessId: number,
): Promise<number> {
  const { data } = await supabase
    .from("business_billing")
    .select("slot_limit, tier")
    .eq("business_id", businessId)
    .maybeSingle();

  if (!data) return TIER_SLOT_LIMIT[TIER_STARTER as BillingTier];
  return data.slot_limit;
}

export async function countSlotsUsedForBusiness(
  supabase: Supabase,
  businessId: number,
): Promise<number> {
  return getSlotsUsed(supabase, businessId);
}

/**
 * Blocks new connections when at or over the business slot limit (spec: slot squeeze).
 */
export async function assertBusinessHasAvailableSlot(
  supabase: Supabase,
  businessId: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const [limit, used] = await Promise.all([
    getSlotLimitForBusiness(supabase, businessId),
    countSlotsUsedForBusiness(supabase, businessId),
  ]);

  if (used >= limit) {
    return {
      ok: false,
      error: `This business has reached its active connection limit (${limit}). Upgrade the plan or wait until a connection closes.`,
    };
  }
  return { ok: true };
}
