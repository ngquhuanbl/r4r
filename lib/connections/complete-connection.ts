import { revalidatePath } from "next/cache";

import { Paths } from "@/constants/paths";
import { ReviewStatusNames } from "@/constants/shared";
import type { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

type Supabase = ReturnType<typeof createClient>;

export function isTerminalReview(name: string | undefined): boolean {
  if (!name) return false;
  return (
    name === ReviewStatusNames.VERIFIED || name === ReviewStatusNames.REJECTED
  );
}

/**
 * Connection completes when both reviews on the two invitations are terminal
 * (verified or rejected by the business owner who received the review).
 */
export async function tryCompleteConnection(
  supabase: Supabase,
  connectionId: Tables<"connections">["id"],
): Promise<void> {
  const { data: conn, error: cErr } = await supabase
    .from("connections")
    .select("id, status")
    .eq("id", connectionId)
    .maybeSingle();

  if (cErr || !conn || conn.status !== "active") {
    return;
  }

  const { data: invs, error: invErr } = await supabase
    .from("review_invitations")
    .select("id")
    .eq("connection_id", connectionId);

  if (invErr || !invs || invs.length !== 2) {
    return;
  }

  const { data: revs } = await supabase
    .from("reviews")
    .select(
      `
      invitation_id,
      status:review_statuses!inner (
        name
      )
    `,
    )
    .in("invitation_id", invs.map((i) => i.id));

  if (!revs || revs.length !== 2) {
    return;
  }

  const allTerminal = revs.every((r) => {
    const row = r as { status: { name: string } };
    return isTerminalReview(row.status?.name);
  });

  if (!allTerminal) {
    return;
  }

  const { data: updated } = await supabase
    .from("connections")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", connectionId)
    .eq("status", "active")
    .select("business_a_id, business_b_id");

  if (updated?.[0]) {
    revalidatePath(Paths.DASHBOARD);
    // Avoid revalidatePath(businessPath(...)): users on a business page would get
    // a full segment refresh and lose client UI state (e.g. active reviews tab).
  }
}

export async function tryCompleteConnectionForReview(
  supabase: Supabase,
  reviewId: Tables<"reviews">["id"],
): Promise<void> {
  const { data: rev } = await supabase
    .from("reviews")
    .select("invitation_id")
    .eq("id", reviewId)
    .maybeSingle();

  if (!rev?.invitation_id) return;

  const { data: inv } = await supabase
    .from("review_invitations")
    .select("connection_id")
    .eq("id", rev.invitation_id)
    .maybeSingle();

  if (!inv?.connection_id) return;

  await tryCompleteConnection(supabase, inv.connection_id);
}

/**
 * After outgoing submit: the invitee's owned business (`invitee_business_id`) stops
 * counting this connection toward its slot limit. When both sides have submitted,
 * the connection is marked completed so neither party is blocked from new matches.
 */
export async function tryReleaseOwnSlotAfterOutgoingSubmit(
  supabase: Supabase,
  reviewId: Tables<"reviews">["id"],
): Promise<void> {
  const { data: row, error: rowErr } = await supabase
    .from("reviews")
    .select(
      `
      invitation:review_invitations!inner (
        connection_id,
        invitee_business_id
      )
    `,
    )
    .eq("id", reviewId)
    .maybeSingle();

  if (rowErr || !row?.invitation) {
    if (rowErr) {
      console.error("tryReleaseOwnSlotAfterOutgoingSubmit review", rowErr);
    }
    return;
  }

  const inv = row.invitation as {
    connection_id: number | null;
    invitee_business_id: number | null;
  };

  if (!inv.connection_id || inv.invitee_business_id == null) {
    return;
  }

  const { data: conn, error: cErr } = await supabase
    .from("connections")
    .select(
      "id, status, business_a_id, business_b_id, business_a_slot_released_at, business_b_slot_released_at",
    )
    .eq("id", inv.connection_id)
    .maybeSingle();

  if (cErr || !conn || conn.status !== "active") {
    if (cErr) console.error("tryReleaseOwnSlotAfterOutgoingSubmit conn", cErr);
    return;
  }

  const bid = inv.invitee_business_id;
  if (bid !== conn.business_a_id && bid !== conn.business_b_id) {
    console.error(
      "tryReleaseOwnSlotAfterOutgoingSubmit: invitee_business_id not on connection",
      { reviewId, bid, conn },
    );
    return;
  }

  const now = new Date().toISOString();
  const isA = bid === conn.business_a_id;
  const { error: uErr } = await supabase
    .from("connections")
    .update(
      isA
        ? { business_a_slot_released_at: now }
        : { business_b_slot_released_at: now },
    )
    .eq("id", conn.id)
    .eq("status", "active")
    .is(isA ? "business_a_slot_released_at" : "business_b_slot_released_at", null);

  if (uErr) {
    console.error("tryReleaseOwnSlotAfterOutgoingSubmit update", uErr);
    return;
  }

  const { data: after } = await supabase
    .from("connections")
    .select(
      "business_a_slot_released_at, business_b_slot_released_at, status",
    )
    .eq("id", conn.id)
    .maybeSingle();

  if (
    after?.status === "active" &&
    after.business_a_slot_released_at &&
    after.business_b_slot_released_at
  ) {
    const { error: doneErr } = await supabase
      .from("connections")
      .update({
        status: "completed",
        completed_at: now,
      })
      .eq("id", conn.id)
      .eq("status", "active");

    if (doneErr) {
      console.error("tryReleaseOwnSlotAfterOutgoingSubmit complete", doneErr);
      return;
    }
  }
}
