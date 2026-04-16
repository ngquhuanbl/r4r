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

/**
 * Active connections: first-class `connections` rows with status=active (see docs/connection-spec.md).
 * Legacy invitations without `connection_id` are not counted here.
 */
export async function countActiveConnectionsForBusiness(
  supabase: Supabase,
  businessId: number,
): Promise<number> {
  const { count, error } = await supabase
    .from("connections")
    .select("*", { count: "exact", head: true })
    .eq("status", "active")
    .or(
      `business_a_id.eq.${businessId},business_b_id.eq.${businessId}`,
    );

  if (error) {
    console.error("countActiveConnectionsForBusiness:", error);
    return 0;
  }
  return count ?? 0;
}

/**
 * Legacy fallback: invitations PENDING/ACCEPTED without a connection (pre-migration data).
 * Only adds to the count when no connection_id is set, to avoid double-counting once connections exist.
 */
export async function countLegacyInvitationsWithoutConnection(
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
    .in("status_id", statusIds)
    .is("connection_id", null);

  if (error) {
    console.error("countLegacyInvitationsWithoutConnection:", error);
    return 0;
  }
  return count ?? 0;
}

/** Total “slots used” = active connections + legacy unattributed invitations. */
export async function countSlotsUsedForBusiness(
  supabase: Supabase,
  businessId: number,
): Promise<number> {
  const [fromConnections, legacy] = await Promise.all([
    countActiveConnectionsForBusiness(supabase, businessId),
    countLegacyInvitationsWithoutConnection(supabase, businessId),
  ]);
  return fromConnections + legacy;
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
