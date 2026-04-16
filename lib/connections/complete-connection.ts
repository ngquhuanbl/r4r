import { revalidatePath } from "next/cache";

import { Paths, businessPath } from "@/constants/paths";
import { ReviewStatusNames } from "@/constants/shared";
import type { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

type Supabase = ReturnType<typeof createClient>;

function isTerminalReview(name: string | undefined): boolean {
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
    revalidatePath(businessPath(updated[0].business_a_id));
    revalidatePath(businessPath(updated[0].business_b_id));
    revalidatePath(Paths.DASHBOARD);
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
