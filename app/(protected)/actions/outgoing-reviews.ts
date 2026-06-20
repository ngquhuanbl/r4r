"use server";

import { revalidateTag } from "next/cache";

import { ReviewStatusNames } from "@/constants/shared";
import {
  getBusinessBillingInfoTag,
  getBusinessSnapshotTag,
} from "@/lib/business/business-page-cache-tags";
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

export type OutgoingTaskNotification = {
  // Reuse full row shape so Realtime/catch-up notifications can
  // directly append to UI state without extra per-item fetches.
} & OutgoingReview;

async function assertBusinessOwnedByCurrentUser(
  supabase: ReturnType<typeof createClient>,
  businessId: Tables<"businesses">["id"],
): Promise<APIResponse<true>> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Unauthorized" };
  }

  const { data: owned, error } = await supabase
    .from("businesses")
    .select("id")
    .eq("id", businessId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (error || !owned) {
    return { ok: false, error: "Business not found" };
  }
  return { ok: true, data: true };
}

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

export async function fetchOutgoingTaskNotificationsSinceCursor(
  businessId: Tables<"businesses">["id"],
  sinceCursor: string | null,
  limit = 6,
): Promise<APIResponse<OutgoingTaskNotification[]>> {
  const supabase = createClient();
  const owned = await assertBusinessOwnedByCurrentUser(supabase, businessId);
  if (!owned.ok) return owned;

  const { data: draftStatus, error: statusErr } = await supabase
    .from("review_statuses")
    .select("id")
    .eq("name", ReviewStatusNames.DRAFT)
    .maybeSingle();
  if (statusErr || !draftStatus) {
    return { ok: false, error: statusErr?.message ?? "Status configuration missing" };
  }

  let query = supabase
    .from("reviews")
    .select(
      `
      id,
      content,
      url,
      created_at,
      reviewed_owner_user_id,
      status:review_statuses!inner (
        id,
        name
      ),
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
    .eq("reviewer_business_id", businessId)
    .eq("status_id", draftStatus.id)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (sinceCursor) {
    query = query.gt("created_at", sinceCursor);
  }

  const { data, error } = await query;
  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, data: (data ?? []) as OutgoingTaskNotification[] };
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
      reviewed_business_id,
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
    revalidateTag(getBusinessBillingInfoTag(updateData.reviewer_business_id));
    revalidateTag(getBusinessSnapshotTag(updateData.reviewer_business_id));
  }
  if (updateData.reviewed_business_id != null) {
    revalidateTag(getBusinessSnapshotTag(updateData.reviewed_business_id));
  }

  await tryCloseConnectionForReview(supabase, reviewId);

  return {
    ok: true,
    data: updateData,
  };
}
