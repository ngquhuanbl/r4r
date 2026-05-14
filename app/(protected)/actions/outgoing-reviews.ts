"use server";

import { ReviewStatusNames } from "@/constants/shared";
import {
  tryCompleteConnectionForReview,
  tryReleaseOwnSlotAfterOutgoingSubmit,
} from "@/lib/connections/complete-connection";
import { createClient } from "@/lib/supabase/server";
import {
  FetchedReviewsResponse,
  OutgoingReview,
  SubmitReviewResponse,
} from "@/types/dashboard";
import { Tables } from "@/types/database";
import { APIResponse, UserId } from "@/types/shared";

export async function fetchOutgoingReviews(
  userId: UserId,
  page: number,
  pageSize: number,
  reviewStatusId?: Tables<"review_statuses">["id"],
  /**
   * When set, only outgoing reviews whose invitation is attributed to this owned business
   * (`review_invitations.invitee_business_id`). Omit for account-wide lists (e.g. dashboard).
   */
  inviteeOwnedBusinessId?: Tables<"businesses">["id"],
): Promise<APIResponse<FetchedReviewsResponse<OutgoingReview>>> {
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
					business:businesses!review_invitations_business_id_fkey (
						id,
						business_name,
						address,
						city,
						state,
						zip_code,
						cover_image_url,
						business_platforms (
							platform_id,
							platform_url
						)
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

    if (inviteeOwnedBusinessId !== undefined) {
      query = query.eq(
        "invitation.invitee_business_id",
        inviteeOwnedBusinessId,
      );
    }

    // Filter by review status
    if (reviewStatusId !== undefined) {
      query = query.eq("status.id", reviewStatusId);
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
						business:businesses!review_invitations_business_id_fkey (
							id
						),
						inviter_id
					)
				`,
        { count: "exact", head: true }
      )
      .eq("invitation.invitee_id", userId);

    if (inviteeOwnedBusinessId !== undefined) {
      query = query.eq(
        "invitation.invitee_business_id",
        inviteeOwnedBusinessId,
      );
    }

    if (reviewStatusId !== undefined) {
      query = query.eq("status.id", reviewStatusId);
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
      data: (dataResult.data ?? []) as OutgoingReview[],
      total_results: countResult.count!,
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

  await tryCompleteConnectionForReview(supabase, reviewId);
  await tryReleaseOwnSlotAfterOutgoingSubmit(supabase, reviewId);

  // Client lists update via submit dialogs (Redux / local state); avoid revalidatePath
  // here so the dashboard layout and business page do not remount.
  return {
    ok: true,
    data: updateData,
  };
}
