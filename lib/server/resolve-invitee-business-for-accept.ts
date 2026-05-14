import { createClient } from "@/lib/supabase/server";
import { Tables } from "@/types/database";

export type ServerSupabase = ReturnType<typeof createClient>;

export async function resolveInviteeBusinessIdForAccept(
  supabase: ServerSupabase,
  invitationId: Tables<"review_invitations">["id"],
  inviteeBusinessId: Tables<"businesses">["id"] | undefined,
): Promise<
  | { ok: true; businessId: Tables<"businesses">["id"] }
  | { ok: false; error: string }
> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Not authenticated" };
  }

  const { data: inv, error: invErr } = await supabase
    .from("review_invitations")
    .select("id, invitee_id")
    .eq("id", invitationId)
    .maybeSingle();

  if (invErr || !inv) {
    return { ok: false, error: invErr?.message ?? "Invitation not found" };
  }
  if (inv.invitee_id !== user.id) {
    return { ok: false, error: "Forbidden" };
  }

  const { data: owned } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  const ids = (owned ?? []).map((b) => b.id);

  if (inviteeBusinessId !== undefined) {
    if (!ids.includes(inviteeBusinessId)) {
      return { ok: false, error: "Choose one of your businesses" };
    }
    return { ok: true, businessId: inviteeBusinessId };
  }

  if (ids.length === 0) {
    return { ok: false, error: "Add a business before accepting" };
  }
  if (ids.length === 1) {
    return { ok: true, businessId: ids[0]! };
  }
  return {
    ok: false,
    error: "Choose which of your businesses this review is for",
  };
}
