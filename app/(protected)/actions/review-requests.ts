"use server";

import { revalidatePath } from "next/cache";

import { Paths, businessPath } from "@/constants/paths";
import { InvitationStatusNames, ReviewStatusNames } from "@/constants/shared";
import { createClient } from "@/lib/supabase/server";
import { resolveInviteeBusinessIdForAccept } from "@/lib/server/resolve-invitee-business-for-accept";
import {
  ReviewRequest,
  UpdatedReviewRequestsStatus,
} from "@/types/dashboard";
import { Tables } from "@/types/database";
import { APIResponse, UserId } from "@/types/shared";

export async function acceptReviewRequest(
  invitationId: Tables<"review_invitations">["id"],
  inviteeBusinessId?: Tables<"businesses">["id"],
): Promise<APIResponse<UpdatedReviewRequestsStatus>> {
  const supabase = createClient();

  const resolved = await resolveInviteeBusinessIdForAccept(
    supabase,
    invitationId,
    inviteeBusinessId,
  );
  if (!resolved.ok) {
    return { ok: false, error: resolved.error };
  }

  // Get the ACCEPTED status ID
  const { data: acceptedStatus, error: statusError } = await supabase
    .from("invitation_statuses")
    .select("id")
    .eq("name", InvitationStatusNames.ACCEPTED)
    .single();

  if (statusError) {
    console.error("Error fetching accepted status:", statusError);
    return { ok: false, error: statusError };
  }

  // Update the invitation status and invitee-owned business context
  const { error } = await supabase
    .from("review_invitations")
    .update({
      status_id: acceptedStatus.id,
      invitee_business_id: resolved.businessId,
    })
    .eq("id", invitationId);

  if (error) {
    console.error("Error accepting invitation:", error);
    return { ok: false, error };
  }

  // Create an initial draft review
  const { data: draftStatus } = await supabase
    .from("review_statuses")
    .select("id")
    .eq("name", ReviewStatusNames.DRAFT)
    .single();

  if (draftStatus) {
    await supabase.from("reviews").insert({
      invitation_id: invitationId,
      status_id: draftStatus.id,
    });
  }

  revalidatePath(Paths.DASHBOARD);
  revalidatePath(businessPath(resolved.businessId));
  return {
    ok: true,
    data: {
      id: invitationId,
      status: {
        id: acceptedStatus.id,
        name: InvitationStatusNames.ACCEPTED,
      },
    },
  };
}

// Reject an invitation
export async function rejectReviewRequest(
  invitationId: Tables<"review_invitations">["id"]
): Promise<APIResponse<UpdatedReviewRequestsStatus>> {
  const supabase = createClient();

  // Get the REJECTED status ID
  const { data: rejectedStatus, error: statusError } = await supabase
    .from("invitation_statuses")
    .select("id")
    .eq("name", InvitationStatusNames.REJECTED)
    .single();

  if (statusError) {
    console.error("Error fetching rejected status:", statusError);
    return { ok: false, error: statusError };
  }

  // Update the invitation status
  const { error } = await supabase
    .from("review_invitations")
    .update({ status_id: rejectedStatus.id })
    .eq("id", invitationId);

  if (error) {
    console.error("Error rejecting invitation:", error);
    return { ok: false, error };
  }

  revalidatePath(Paths.DASHBOARD);
  return {
    ok: true,
    data: {
      id: invitationId,
      status: {
        id: rejectedStatus.id,
        name: InvitationStatusNames.REJECTED,
      },
    },
  };
}

//#endregion

//#region Review requests
export async function fetchPendingReviewRequests(
  userId: UserId
): Promise<APIResponse<ReviewRequest[]>> {
  const supabase = createClient();

  // First, get the pending status ID
  const { data: pendingStatus, error: statusError } = await supabase
    .from("invitation_statuses")
    .select("id")
    .eq("name", InvitationStatusNames.PENDING)
    .single();

  if (statusError) {
    console.error("Error fetching pending status:", statusError);
    return { ok: false, error: statusError };
  }

  // Now fetch invitations with that status
  const { data, error } = await supabase
    .from("review_invitations")
    .select(
      `
      id,
      message,
      business:businesses!review_invitations_business_id_fkey (
        id,
        business_name,
        address,
        city,
        state,
        zip_code,
				phone
      ),
      platform:platforms!inner (
        id,
        name,
        color
      ),
			status:invitation_statuses!inner (
				id,
				name
			)
    `
    )
    .eq("invitee_id", userId)
    .eq("status_id", pendingStatus.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching review requests:", error);
    return { ok: false, error };
  }

  return {
    ok: true,
    data: (data ?? []) as ReviewRequest[],
  };
}
