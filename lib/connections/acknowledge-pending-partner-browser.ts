import { createClient } from "@/lib/supabase/client";
import type { APIResponse } from "@/types/shared";
import type { Tables } from "@/types/database";

export type UnacknowledgedPartnerConnection = {
  connectionId: number;
  initiatorBusinessName: string;
};

/**
 * Same behavior as the former server action, but runs in the browser so App Router
 * does not refetch the whole RSC tree after completion.
 */
export async function acknowledgePendingPartnerConnections(
  businessId: Tables<"businesses">["id"],
): Promise<APIResponse<UnacknowledgedPartnerConnection[]>> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Unauthorized" };
  }

  const { data: owned, error: ownErr } = await supabase
    .from("businesses")
    .select("id")
    .eq("id", businessId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (ownErr || !owned) {
    return { ok: false, error: "Business not found" };
  }

  const { data: pending, error } = await supabase
    .from("connections")
    .select("id, initiator_business_id")
    .or(`business_a_id.eq.${businessId},business_b_id.eq.${businessId}`)
    .neq("initiator_business_id", businessId)
    .is("partner_acknowledged_at", null)
    .is("closed_at", null);

  if (error) {
    console.error("acknowledgePendingPartnerConnections list", error);
    return { ok: false, error: error.message };
  }

  if (!pending?.length) {
    return { ok: true, data: [] };
  }

  const pendingIds = pending.map((c) => c.id);
  const { data: stillValid, error: selErr } = await supabase
    .from("connections")
    .select("id, initiator_business_id")
    .in("id", pendingIds)
    .or(`business_a_id.eq.${businessId},business_b_id.eq.${businessId}`)
    .neq("initiator_business_id", businessId)
    .is("partner_acknowledged_at", null)
    .is("closed_at", null);

  if (selErr) {
    console.error("acknowledgePendingPartnerConnections validate", selErr);
    return { ok: false, error: selErr.message };
  }

  const validRows = stillValid ?? [];
  if (!validRows.length) {
    return { ok: true, data: [] };
  }

  const now = new Date().toISOString();
  const validIds = validRows.map((r) => r.id);
  const { error: updErr } = await supabase
    .from("connections")
    .update({ partner_acknowledged_at: now })
    .in("id", validIds);

  if (updErr) {
    console.error("acknowledgePendingPartnerConnections update", updErr);
    return { ok: false, error: updErr.message };
  }

  const initiatorIds = Array.from(
    new Set(validRows.map((c) => c.initiator_business_id)),
  );
  const { data: businesses, error: nameErr } = await supabase
    .from("businesses")
    .select("id, business_name")
    .in("id", initiatorIds);

  if (nameErr) {
    console.error("acknowledgePendingPartnerConnections names", nameErr);
    return { ok: false, error: nameErr.message };
  }

  const nameById = Object.fromEntries(
    (businesses ?? []).map((b) => [b.id, b.business_name.trim() || "Partner"]),
  );

  const data: UnacknowledgedPartnerConnection[] = validRows.map((c) => ({
    connectionId: c.id,
    initiatorBusinessName:
      nameById[c.initiator_business_id] ?? "Another business",
  }));

  return { ok: true, data };
}
