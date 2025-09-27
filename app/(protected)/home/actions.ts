"use server";

import { revalidatePath } from "next/cache";

import { InvitationStatusNames, ReviewStatusNames } from "@/constants/shared";
import { createClient } from "@/lib/supabase/server";
import {
  Review,
  ReviewRequest,
  SubmitReviewResponse,
  UpdatedReviewStatus,
  UpdatedReviewRequestsStatus,
} from "@/types/dashboard";
import { Tables } from "@/types/database";
import { APIResponse, UserId } from "@/types/shared";

export async function fetchBusinesses(
  userId: UserId
): Promise<APIResponse<Tables<"businesses">[]>> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("businesses")
      .select("*")
      .eq("user_id", userId);

    if (error) {
      console.error("Failed to fetch business list", error);
      return { ok: false, error: error.message };
    }

    return { ok: true, data: data || [] };
  } catch (e: any) {
    console.error("Unexpected error during business list fetching", e);
    return { ok: false, error: e.message || "Unexpected error" };
  }
}

export async function fetchReviewStatuses(): Promise<
  APIResponse<Tables<"review_statuses">[]>
> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.from("review_statuses").select("*");

    if (error) {
      console.error("Failed to fetch incoming review status list", error);
      return { ok: false, error: error.message };
    }

    return { ok: true, data: data || [] };
  } catch (e: any) {
    console.error(
      "Unexpected error during incoming review status list fetching",
      e
    );
    return { ok: false, error: e.message || "Unexpected error" };
  }
}

//#region INCOMING REVIEWS
export async function fetchIncomingReviews(
  userId: UserId,
  page: number,
  pageSize: number,
  businessId?: Tables<"businesses">["id"],
  statusId?: Tables<"review_statuses">["id"]
): Promise<
  APIResponse<{
    data: Review[];
    total_page: number;
  }>
> {
  const supabase = createClient();

  // Create query for fetching data
  const dataQuery = (function () {
    let query = supabase
      .from("reviews")
      .select(
        `
				id,
				content,
				url,
				status:review_statuses!inner (
					id,
					name
				),
				created_at,
				invitation:review_invitations!inner (
					business:businesses!inner (
						id,
						business_name,
						address,
						city,
						state,
						zip_code
					),
					platform:platforms!inner (
						id,
						name
					),
					inviter_id
				)
				`
      )
      .eq("invitation.inviter_id", userId)
      .neq("status.name", ReviewStatusNames.DRAFT);

    // Filter
    if (businessId !== undefined) {
      query = query.eq("invitation.business.id", businessId);
    }
    if (statusId !== undefined) {
      query = query.eq("status.id", statusId);
    }

    // Pagination
    const from = (page - 1) * pageSize;
    const to = from + (pageSize - 1);
    query = query.range(from, to).order("created_at", { ascending: false });

    return query;
  })();

  const countQuery = (function () {
    let query = supabase
      .from("reviews")
      .select(
        `
					id,
					status:review_statuses!inner (
						id,
						name
					),
					invitation:review_invitations!inner (
						business:businesses!inner (
							id
						),
						inviter_id
					)
				`,
        { count: "exact", head: true }
      )
      .eq("invitation.inviter_id", userId)
      .neq("status.name", ReviewStatusNames.DRAFT);

    // Filter
    if (businessId !== undefined) {
      query = query.eq("invitation.business.id", businessId);
    }
    if (statusId !== undefined) {
      query = query.eq("status.id", statusId);
    }

    return query;
  })();

  const [dataResult, countResult] = await Promise.all([dataQuery, countQuery]);
  if (dataResult.error || countResult.error) {
    let error = dataResult.error;
    if (!error) error = countResult.error;

    if (dataResult.error) {
      console.error("Failed to fetch incoming review data", dataResult.error);
    }

    if (countResult.error) {
      console.error(
        "Failed to count incoming review total page",
        countResult.error
      );
    }

    return {
      ok: false,
      error: error?.message,
    };
  }

  return {
    ok: true,
    data: {
      data: dataResult.data,
      total_page: Math.ceil(countResult.count! / pageSize),
    },
  };
}

export async function confirmIncomingReview(
  reviewId: Tables<"reviews">["id"]
): Promise<APIResponse<UpdatedReviewStatus>> {
  const supabase = createClient();

  // Get the VERIFIED status ID
  const { data: verifiedStatus, error: statusError } = await supabase
    .from("review_statuses")
    .select("id")
    .eq("name", ReviewStatusNames.VERIFIED)
    .single();

  if (statusError) {
    console.error("Error fetching verified status:", statusError);
    return { ok: false, error: statusError };
  }

  // Update the review status
  const { data, error } = await supabase
    .from("reviews")
    .update({
      status_id: verifiedStatus.id,
      verified_at: new Date().toISOString(),
    })
    .eq("id", reviewId)
    .select();

  if (error) {
    console.error("Error approving review:", error);
    return { ok: false, error };
  }

  // Get the review details for revalidation
  const { data: reviewData } = await supabase
    .from("reviews")
    .select("invitation_id")
    .eq("id", reviewId)
    .single();

  if (reviewData) {
    const { data: invitationData } = await supabase
      .from("review_invitations")
      .select("invitee_id, inviter_id")
      .eq("id", reviewData.invitation_id)
      .single();

    if (invitationData) {
      // Revalidate paths for both business owner and reviewer
      revalidatePath("/home");
      revalidatePath("/businesses");
    }
  }

  return {
    ok: true,
    data: {
      id: reviewId,
      status: {
        id: data[0].status_id,
        name: ReviewStatusNames.VERIFIED,
      },
    },
  };
}

export async function rejectIncomingReview(
  reviewId: Tables<"reviews">["id"]
): Promise<APIResponse<UpdatedReviewStatus>> {
  const supabase = createClient();

  // Get the VERIFIED status ID
  const { data: rejectedStatus, error: statusError } = await supabase
    .from("review_statuses")
    .select("id")
    .eq("name", ReviewStatusNames.REJECTED)
    .single();

  if (statusError) {
    console.error("Error fetching rejected status:", statusError);
    return { ok: false, error: statusError };
  }

  // Update the review status
  const { data, error } = await supabase
    .from("reviews")
    .update({
      status_id: rejectedStatus.id,
    })
    .eq("id", reviewId)
    .select();

  if (error) {
    console.error("Error rejecting review:", error);
    return { ok: false, error };
  }

  // Get the review details for revalidation
  const { data: reviewData } = await supabase
    .from("reviews")
    .select("invitation_id")
    .eq("id", reviewId)
    .single();

  if (reviewData) {
    const { data: invitationData } = await supabase
      .from("review_invitations")
      .select("invitee_id, inviter_id")
      .eq("id", reviewData.invitation_id)
      .single();

    if (invitationData) {
      // Revalidate paths for both business owner and reviewer
      revalidatePath("/home");
      revalidatePath("/businesses");
    }
  }

  return {
    ok: true,
    data: {
      id: reviewId,
      status: {
        id: data[0].status_id,
        name: ReviewStatusNames.REJECTED,
      },
    },
  };
}

//#endregion

//#region OUTGOING REVIEWS
export async function fetchOutgoingReviewStatuses(): Promise<
  APIResponse<Tables<"review_statuses">[]>
> {
  const supabase = createClient();
  const { data, error } = await supabase.from("review_statuses").select("*");

  if (error) {
    console.error("Failed to fetch outgoing review status list", error);
    return { ok: false, error: error.message };
  }

  return { ok: true, data: data || [] };
}

export async function fetchBusinessesCount(
  userId: UserId
): Promise<APIResponse<number>> {
  try {
    const supabase = createClient();
    const { count, error } = await supabase
      .from("businesses")
      .select("*", { count: "exact", head: false })
      .eq("user_id", userId);

    if (error) {
      console.error("Failed to fetch business list", error);
      return { ok: false, error: error.message };
    }

    return { ok: true, data: count || 0 };
  } catch (e: any) {
    console.error("Unexpected error during business list fetching", e);
    return { ok: false, error: e.message || "Unexpected error" };
  }
}

export async function fetchOutgoingReviews(
  userId: UserId,
  page: number,
  pageSize: number,
  statusId?: Tables<"businesses">["id"]
): Promise<
  APIResponse<{
    data: Review[];
    total_page: number;
  }>
> {
  const supabase = createClient();

  // Create query for fetching data
  const dataQuery = (function () {
    let query = supabase
      .from("reviews")
      .select(
        `
				id,
				content,
				url,
				status:review_statuses!inner (
					id,
					name
				),
				created_at,
				invitation:review_invitations!inner (
					business:businesses!inner (
						id,
						business_name,
						address,
						city,
						state,
						zip_code
					),
					platform:platforms!inner (
						id,
						name
					),
					inviter_id
				)
				`
      )
      .eq("invitation.invitee_id", userId);

    // Filter
    if (statusId !== undefined) {
      query = query.eq("status.id", statusId);
    }

    // Pagination
    const from = (page - 1) * pageSize;
    const to = from + (pageSize - 1);
    query = query.range(from, to).order("created_at", { ascending: false });

    return query;
  })();

  const countQuery = (function () {
    let query = supabase
      .from("reviews")
      .select(
        `
					id,
					status:review_statuses!inner (
						id,
						name
					),
					invitation:review_invitations!inner (
						business:businesses!inner (
							id
						),
						inviter_id
					)
				`,
        { count: "exact", head: true }
      )
      .eq("invitation.invitee_id", userId);

    // Filter
    if (statusId !== undefined) {
      query = query.eq("status.id", statusId);
    }

    return query;
  })();

  const [dataResult, countResult] = await Promise.all([dataQuery, countQuery]);
  if (dataResult.error || countResult.error) {
    let error = dataResult.error;
    if (!error) error = countResult.error;

    if (dataResult.error) {
      console.error("Failed to fetch outgoing review data", dataResult.error);
    }

    if (countResult.error) {
      console.error(
        "Failed to count outgoing review total page",
        countResult.error
      );
    }

    return {
      ok: false,
      error: error?.message,
    };
  }

  return {
    ok: true,
    data: {
      data: dataResult.data,
      total_page: Math.ceil(countResult.count! / pageSize),
    },
  };
}
export async function submitOutgoingReview(
  reviewId: Tables<"reviews">["id"],
  reviewContent: Tables<"reviews">["content"],
  reviewUrl: Tables<"reviews">["url"]
): Promise<APIResponse<SubmitReviewResponse>> {
  const supabase = createClient();

  // Get the SUBMITTED status ID
  const { data: submittedStatus, error: reviewStatusError } = await supabase
    .from("review_statuses")
    .select("id")
    .eq("name", ReviewStatusNames.SUBMITTED)
    .single();

  if (reviewStatusError) {
    console.error("Error fetching submitted status:", reviewStatusError);
    return { ok: false, error: reviewStatusError };
  }

  // Update the review
  const { data: updateData, error: updateError } = await supabase
    .from("reviews")
    .update({
      content: reviewContent,
      url: reviewUrl,
      status_id: submittedStatus.id,
      submitted_at: new Date().toISOString(),
    })
    .eq("id", reviewId)
    .select(
      `
			id,
			url,
			content,
			status:review_statuses!inner (
				id,
				name
			)
			`
    )
    .single();

  if (updateError) {
    console.error("Error submitting review:", updateError);
    return { ok: false, error: updateError };
  }

  // Ensure all relevant paths are revalidated
  revalidatePath("/home", "layout");
  revalidatePath("/home", "page");
  return {
    ok: true,
    data: updateData,
  };
}

export async function acceptReviewRequest(
  invitationId: Tables<"review_invitations">["id"]
): Promise<APIResponse<UpdatedReviewRequestsStatus>> {
  const supabase = createClient();

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

  // Update the invitation status
  const { data, error } = await supabase
    .from("review_invitations")
    .update({ status_id: acceptedStatus.id })
    .eq("id", invitationId)
    .select();

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

  revalidatePath("/home");
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
  const { data, error } = await supabase
    .from("review_invitations")
    .update({ status_id: rejectedStatus.id })
    .eq("id", invitationId)
    .select();

  if (error) {
    console.error("Error rejecting invitation:", error);
    return { ok: false, error };
  }

  revalidatePath("/home");
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
      business:businesses!inner (
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
    data,
  };
}

//#endrgion

// Fetch all invitations for a user that are in the "pending" status
export async function fetchInvitations(userId: UserId) {
  const supabase = createClient();

  // First, get the pending status ID
  const { data: pendingStatus, error: statusError } = await supabase
    .from("invitation_statuses")
    .select("id")
    .eq("name", "PENDING")
    .single();

  if (statusError) {
    console.error("Error fetching pending status:", statusError);
    return [];
  }

  // Now fetch invitations with that status
  const { data, error } = await supabase
    .from("review_invitations")
    .select(
      `
      id,
      status_id,
      message,
      business:business_id(
        id,
        business_name,
        address,
        city,
        state,
        zip_code
      ),
      platform:platform_id(
        id,
        name,
        color
      )
    `
    )
    .eq("invitee_id", userId)
    .eq("status_id", pendingStatus.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching invitations:", error);
    return [];
  }

  return data || [];
}

// Fetch all invitations for a user that are in the "accepted" status
export async function fetchAcceptedInvitations(userId: UserId) {
  const supabase = createClient();

  // First, get the accepted status ID
  const { data: acceptedStatus, error: statusError } = await supabase
    .from("invitation_statuses")
    .select("id")
    .eq("name", "ACCEPTED")
    .single();

  if (statusError) {
    console.error("Error fetching accepted status:", statusError);
    return [];
  }

  // Now fetch invitations with that status
  const { data, error } = await supabase
    .from("review_invitations")
    .select(
      `
      id,
      status_id,
      message,
      business:business_id(
        id,
        business_name,
        address,
        city,
        state,
        zip_code
      ),
      platform:platform_id(
        id,
        name,
        color
      )
    `
    )
    .eq("invitee_id", userId)
    .eq("status_id", acceptedStatus.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching accepted invitations:", error);
    return [];
  }

  // For each invitation, fetch the associated review to get its status
  const invitationsWithReviewStatus = await Promise.all(
    (data || []).map(async (invitation) => {
      const { data: reviewData, error: reviewError } = await supabase
        .from("reviews")
        .select(
          `
          id,
          status_id,
          content,
          url
        `
        )
        .eq("invitation_id", invitation.id)
        .single();

      if (reviewError) {
        console.error(
          `Error fetching review for invitation ${invitation.id}:`,
          reviewError
        );
        return { ...invitation, review: null };
      }

      return { ...invitation, review: reviewData };
    })
  );

  return invitationsWithReviewStatus || [];
}

// Fetch all reviews that need to be verified by the user (business owner)
export async function fetchPendingReviews(userId: UserId) {
  const supabase = createClient();

  // First, get the submitted status ID
  const { data: submittedStatus, error: reviewStatusError } = await supabase
    .from("review_statuses")
    .select("id")
    .eq("name", "SUBMITTED")
    .single();

  if (reviewStatusError) {
    console.error("Error fetching submitted status:", reviewStatusError);
    return [];
  }

  // Now fetch submitted reviews where the user is the business owner
  const { data: invitations, error: invitationsError } = await supabase
    .from("review_invitations")
    .select(
      `
      id,
      business:business_id(
        id,
        business_name,
        address,
        city,
        state,
        zip_code
      ),
      platform:platform_id(
        id,
        name,
        color
      )
    `
    )
    .eq("inviter_id", userId);

  if (invitationsError) {
    console.error(
      "Error fetching invitations for business owner:",
      invitationsError
    );
    return [];
  }

  if (!invitations || invitations.length === 0) {
    return [];
  }

  // Get the reviews for these invitations that are in SUBMITTED status
  const invitationIds = invitations.map((inv) => inv.id);

  const { data: reviews, error: reviewsError } = await supabase
    .from("reviews")
    .select(
      `
      id,
      invitation_id,
      content,
      url,
      status_id,
      submitted_at
    `
    )
    .in("invitation_id", invitationIds)
    .eq("status_id", submittedStatus.id);

  if (reviewsError) {
    console.error("Error fetching submitted reviews:", reviewsError);
    return [];
  }

  // Combine the review data with the invitation data
  const pendingReviews = reviews.map((review) => {
    const invitation = invitations.find(
      (inv) => inv.id === review.invitation_id
    );
    return {
      id: review.id,
      invitation_id: review.invitation_id,
      review_content: review.content,
      review_url: review.url,
      submitted_at: review.submitted_at,
      business: invitation?.business,
      platform: invitation?.platform,
    };
  });

  return pendingReviews || [];
}

// Accept an invitation
export async function acceptInvitation(invitationId) {
  const supabase = createClient();

  // Get the ACCEPTED status ID
  const { data: acceptedStatus, error: statusError } = await supabase
    .from("invitation_statuses")
    .select("id")
    .eq("name", "ACCEPTED")
    .single();

  if (statusError) {
    console.error("Error fetching accepted status:", statusError);
    return { success: false, error: statusError };
  }

  // Update the invitation status
  const { data, error } = await supabase
    .from("review_invitations")
    .update({ status_id: acceptedStatus.id })
    .eq("id", invitationId)
    .select();

  if (error) {
    console.error("Error accepting invitation:", error);
    return { success: false, error };
  }

  // Create an initial draft review
  const { data: draftStatus } = await supabase
    .from("review_statuses")
    .select("id")
    .eq("name", "DRAFT")
    .single();

  if (draftStatus) {
    await supabase.from("reviews").insert({
      invitation_id: invitationId,
      status_id: draftStatus.id,
    });
  }

  revalidatePath("/home");
  return { success: true, data };
}

// Reject an invitation
export async function rejectInvitation(invitationId) {
  const supabase = createClient();

  // Get the REJECTED status ID
  const { data: rejectedStatus, error: statusError } = await supabase
    .from("invitation_statuses")
    .select("id")
    .eq("name", "REJECTED")
    .single();

  if (statusError) {
    console.error("Error fetching rejected status:", statusError);
    return { success: false, error: statusError };
  }

  // Update the invitation status
  const { data, error } = await supabase
    .from("review_invitations")
    .update({ status_id: rejectedStatus.id })
    .eq("id", invitationId)
    .select();

  if (error) {
    console.error("Error rejecting invitation:", error);
    return { success: false, error };
  }

  revalidatePath("/home");
  return { success: true, data };
}

// Submit a review
export async function submitReview(invitationId, reviewContent, reviewUrl) {
  const supabase = createClient();

  // Get the SUBMITTED status ID
  const { data: submittedStatus, error: statusError } = await supabase
    .from("review_statuses")
    .select("id")
    .eq("name", "SUBMITTED")
    .single();

  if (statusError) {
    console.error("Error fetching submitted status:", statusError);
    return { success: false, error: statusError };
  }

  // Get the review ID for this invitation
  const { data: reviewData, error: reviewError } = await supabase
    .from("reviews")
    .select("id")
    .eq("invitation_id", invitationId)
    .single();

  if (reviewError) {
    console.error("Error fetching review:", reviewError);
    return { success: false, error: reviewError };
  }

  // Update the review
  const { data, error } = await supabase
    .from("reviews")
    .update({
      content: reviewContent,
      url: reviewUrl,
      status_id: submittedStatus.id,
      submitted_at: new Date().toISOString(),
    })
    .eq("id", reviewData.id)
    .select();

  if (error) {
    console.error("Error submitting review:", error);
    return { success: false, error };
  }

  // Ensure all relevant paths are revalidated
  revalidatePath("/home", "layout");
  revalidatePath("/home", "page");
  return { success: true, data, status_id: submittedStatus.id };
}

// Approve a review
export async function approveReview(reviewId) {
  const supabase = createClient();

  // Get the VERIFIED status ID
  const { data: verifiedStatus, error: statusError } = await supabase
    .from("review_statuses")
    .select("id")
    .eq("name", "VERIFIED")
    .single();

  if (statusError) {
    console.error("Error fetching verified status:", statusError);
    return { success: false, error: statusError };
  }

  // Update the review status
  const { data, error } = await supabase
    .from("reviews")
    .update({
      status_id: verifiedStatus.id,
      verified_at: new Date().toISOString(),
    })
    .eq("id", reviewId)
    .select();

  if (error) {
    console.error("Error approving review:", error);
    return { success: false, error };
  }

  // Get the review details for revalidation
  const { data: reviewData } = await supabase
    .from("reviews")
    .select("invitation_id")
    .eq("id", reviewId)
    .single();

  if (reviewData) {
    const { data: invitationData } = await supabase
      .from("review_invitations")
      .select("invitee_id, inviter_id")
      .eq("id", reviewData.invitation_id)
      .single();

    if (invitationData) {
      // Revalidate paths for both business owner and reviewer
      revalidatePath("/home");
      revalidatePath("/businesses");
    }
  }

  return { success: true, data };
}

// Deny a review
export async function denyReview(reviewId) {
  const supabase = createClient();

  // Get the REJECTED status ID
  const { data: rejectedStatus, error: statusError } = await supabase
    .from("review_statuses")
    .select("id")
    .eq("name", "REJECTED")
    .single();

  if (statusError) {
    console.error("Error fetching rejected status:", statusError);
    return { success: false, error: statusError };
  }

  // Update the review status
  const { data, error } = await supabase
    .from("reviews")
    .update({
      status_id: rejectedStatus.id,
    })
    .eq("id", reviewId)
    .select();

  if (error) {
    console.error("Error denying review:", error);
    return { success: false, error };
  }

  // Get the review details for revalidation
  const { data: reviewData } = await supabase
    .from("reviews")
    .select("invitation_id")
    .eq("id", reviewId)
    .single();

  if (reviewData) {
    const { data: invitationData } = await supabase
      .from("review_invitations")
      .select("invitee_id, inviter_id")
      .eq("id", reviewData.invitation_id)
      .single();

    if (invitationData) {
      // Revalidate paths for both business owner and reviewer
      revalidatePath("/home");
      revalidatePath("/businesses");
    }
  }

  return { success: true, data };
}
