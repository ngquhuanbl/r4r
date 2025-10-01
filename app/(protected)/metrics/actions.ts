"use server";
import { ReviewStatusNames } from "@/constants/shared";
import { createClient } from "@/lib/supabase/server";
import { Metrics } from "@/types/metric";
import { APIResponse, UserId } from "@/types/shared";

export async function fetchMetrics(
  userId: UserId
): Promise<APIResponse<Metrics>> {
  const supabase = createClient();

  const { data: verifiedStatus, error: verifiedStatusError } = await supabase
    .from("review_statuses")
    .select("id")
    .eq("name", ReviewStatusNames.VERIFIED)
    .single();

  if (verifiedStatusError) {
    console.error("Error fetching verified status:", verifiedStatusError);
    return { ok: false, error: verifiedStatusError };
  }

  const { data: draftStatus, error: draftStatusError } = await supabase
    .from("review_statuses")
    .select("id")
    .eq("name", ReviewStatusNames.DRAFT)
    .single();

  if (draftStatusError) {
    console.error("Error fetching verified status:", draftStatusError);
    return { ok: false, error: draftStatusError };
  }

  const totalIncomingAllQuery = supabase
    .from("reviews")
    .select(
      `
				id,
				invitation:review_invitations!inner (
					inviter_id
				)
				`,
      { count: "exact", head: false }
    )
    .eq("invitation.inviter_id", userId)
    .neq("status_id", draftStatus.id);

  const totalIncomingVerifiedQuery = supabase
    .from("reviews")
    .select(
      `
				id,
				status_id,
				invitation:review_invitations!inner (
					inviter_id
				)
				`,
      { count: "exact", head: false }
    )
    .eq("invitation.inviter_id", userId)
    .eq("status_id", verifiedStatus.id);

  const totalOutgoingAllQuery = supabase
    .from("reviews")
    .select(
      `
				id,
				invitation:review_invitations!inner (
					invitee_id
				)
				`,
      { count: "exact", head: false }
    )
    .eq("invitation.invitee_id", userId);

  const totalOutgoingVerifiedQuery = supabase
    .from("reviews")
    .select(
      `
				id,
				invitation:review_invitations!inner (
					invitee_id
				)
				`,
      { count: "exact", head: false }
    )
    .eq("invitation.invitee_id", userId)
    .eq("status_id", verifiedStatus.id);

  const result = await Promise.all([
    totalIncomingAllQuery.then(({ count, error }) => ({
      data: { total_incoming_all: count! },
      error,
    })),
    totalIncomingVerifiedQuery.then(({ count, error }) => ({
      data: { total_incoming_verified: count! },
      error,
    })),
    totalOutgoingAllQuery.then(({ count, error }) => ({
      data: { total_outgoing_all: count! },
      error,
    })),
    totalOutgoingVerifiedQuery.then(({ count, error }) => ({
      data: { total_outgoing_verified: count! },
      error,
    })),
  ]);

  let finalData: Metrics = {
    total_incoming_all: 0,
    total_incoming_verified: 0,
    total_outgoing_all: 0,
    total_outgoing_verified: 0,
  };
  for (const { data, error } of result) {
    if (error) {
      return { ok: false, error };
    }
    finalData = {
      ...finalData,
      ...data!,
    };
  }

  return { ok: true, data: finalData };
}
