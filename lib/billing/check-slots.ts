import { InvitationStatusNames } from "@/constants/shared";
import { TIER_SLOT_LIMIT, TIER_STARTER, type BillingTier } from "@/lib/billing/tiers";
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

export async function countActiveConnectionsForBusiness(
  supabase: Supabase,
  businessId: number,
): Promise<number> {
  const { data: statuses } = await supabase
    .from("invitation_statuses")
    .select("id")
    .in("name", [
      InvitationStatusNames.PENDING,
      InvitationStatusNames.ACCEPTED,
    ]);

  const statusIds = (statuses ?? []).map((s) => s.id);
  if (statusIds.length === 0) return 0;

  const { count, error } = await supabase
    .from("review_invitations")
    .select("*", { count: "exact", head: true })
    .eq("business_id", businessId)
    .in("status_id", statusIds);

  if (error) {
    console.error("countActiveConnectionsForBusiness:", error);
    return 0;
  }
  return count ?? 0;
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
    countActiveConnectionsForBusiness(supabase, businessId),
  ]);

  if (used >= limit) {
    return {
      ok: false,
      error: `This business has reached its active connection limit (${limit}). Upgrade the plan or wait until a connection closes.`,
    };
  }
  return { ok: true };
}
