"use server";

import { ReviewStatusNames } from "@/constants/shared";
import {
  tryCloseConnectionForReview,
} from "@/lib/connections/complete-connection";
import { adjustSlotsUsed } from "@/lib/billing/slots-used";
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
   * When set, only outgoing reviews attributed to this owned business
   * (`reviews.reviewer_business_id`). Omit for account-wide lists (e.g. dashboard).
   */
  reviewerOwnedBusinessId?: Tables<"businesses">["id"],
): Promise<APIResponse<FetchedReviewsResponse<OutgoingReview>>> {
  const supabase = createClient();

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
				reviewed_owner_user_id,
				reviewed_business:businesses!reviews_reviewed_business_id_fkey (
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
				)
				`,
      )
      .eq("reviewer_user_id", userId);

    if (reviewerOwnedBusinessId !== undefined) {
      query = query.eq("reviewer_business_id", reviewerOwnedBusinessId);
    }

    if (reviewStatusId !== undefined) {
      query = query.eq("status.id", reviewStatusId);
    }

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
					)
				`,
        { count: "exact", head: true },
      )
      .eq("reviewer_user_id", userId);

    if (reviewerOwnedBusinessId !== undefined) {
      query = query.eq("reviewer_business_id", reviewerOwnedBusinessId);
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
        countResult.error,
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
  reviewUrl: Tables<"reviews">["url"],
): Promise<APIResponse<SubmitReviewResponse>> {
  const supabase = createClient();

  const { data: submittedStatus, error: reviewStatusError } = await supabase
    .from("review_statuses")
    .select("id, name")
    .in("name", [ReviewStatusNames.DRAFT, ReviewStatusNames.SUBMITTED]);

  if (reviewStatusError || !submittedStatus?.length) {
    console.error("Error fetching submitted status:", reviewStatusError);
    return { ok: false, error: reviewStatusError };
  }

  const submittedStatusId = submittedStatus.find(
    (row) => row.name === ReviewStatusNames.SUBMITTED,
  )?.id;
  const draftStatusId = submittedStatus.find(
    (row) => row.name === ReviewStatusNames.DRAFT,
  )?.id;

  if (!submittedStatusId || !draftStatusId) {
    return { ok: false, error: "Status configuration missing" };
  }

  const { data: updateData, error: updateError } = await supabase
    .from("reviews")
    .update({
      content: reviewContent,
      url: reviewUrl,
      status_id: submittedStatusId,
      submitted_at: new Date().toISOString(),
    })
    .eq("id", reviewId)
    .eq("status_id", draftStatusId)
    .select(
      `
			id,
			url,
			content,
      reviewer_business_id,
			status:review_statuses!inner (
				id,
				name
			)
			`,
    )
    .single();

  if (updateError) {
    console.error("Error submitting review:", updateError);
    return { ok: false, error: updateError };
  }

  if (updateData.reviewer_business_id != null) {
    const slots = await adjustSlotsUsed(updateData.reviewer_business_id, -1);
    if (slots == null) {
      return { ok: false, error: "Could not update slot counters" };
    }
  }

  await tryCloseConnectionForReview(supabase, reviewId);

  return {
    ok: true,
    data: updateData,
  };
}
