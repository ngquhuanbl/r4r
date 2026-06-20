"use server";

import { revalidateTag } from "next/cache";

import { ReviewStatusNames } from "@/constants/shared";
import { getBusinessSnapshotTag } from "@/lib/business/business-page-cache-tags";
import { tryResolveConnectionForReview } from "@/lib/connections/complete-connection";
import { createClient } from "@/lib/supabase/server";
import {
  FetchedReviewsResponse,
  IncomingReview,
  UpdatedReviewStatus,
} from "@/types/dashboard";
import { Tables } from "@/types/database";
import { APIResponse, UserId } from "@/types/shared";

export async function fetchIncomingReviews(
  userId: UserId,
  page: number,
  pageSize: number,
  businessId?: Tables<"businesses">["id"],
  statusId?: Tables<"review_statuses">["id"],
): Promise<APIResponse<FetchedReviewsResponse<IncomingReview>>> {
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
				reviewer_user_id,
				reviewer_business_id,
				reviewed_business:businesses!reviews_reviewed_business_id_fkey (
					id,
					business_name
				),
				platform:platforms!inner (
					id,
					name
				)
				`,
      )
      .eq("reviewed_owner_user_id", userId)
      .neq("status.name", ReviewStatusNames.DRAFT);

    if (businessId !== undefined) {
      query = query.eq("reviewed_business_id", businessId);
    }
    if (statusId !== undefined) {
      query = query.eq("status.id", statusId);
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
      .eq("reviewed_owner_user_id", userId)
      .neq("status.name", ReviewStatusNames.DRAFT);

    if (businessId !== undefined) {
      query = query.eq("reviewed_business_id", businessId);
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
        countResult.error,
      );
    }

    return {
      ok: false,
      error: error?.message,
    };
  }

  const rawRows = dataResult.data ?? [];
  let enriched: IncomingReview[] = rawRows.map((row) => ({
    ...(row as IncomingReview),
    reviewer_business_name: null,
    reviewer_business_cover_image_url: null,
    reviewer_business_location: null,
  }));

  const explicitBusinessIds = Array.from(
    new Set(
      enriched
        .map((r) => r.reviewer_business_id)
        .filter((id): id is number => id != null),
    ),
  );

  const partnerByBusinessId = new Map<
    number,
    {
      name: string;
      cover: string | null;
      location: Pick<Tables<"businesses">, "address" | "city" | "state">;
    }
  >();

  if (explicitBusinessIds.length > 0) {
    const { data: explicitRows } = await supabase
      .from("businesses")
      .select("id, business_name, cover_image_url, address, city, state")
      .in("id", explicitBusinessIds);

    for (const row of explicitRows ?? []) {
      partnerByBusinessId.set(row.id, {
        name: row.business_name,
        cover: row.cover_image_url ?? null,
        location: {
          address: row.address,
          city: row.city,
          state: row.state,
        },
      });
    }
  }

  const reviewerIdsNeedingFallback: UserId[] = [];
  const seenReviewer = new Set<string>();
  for (const r of enriched) {
    if (r.reviewer_business_id != null) continue;
    const uid = r.reviewer_user_id;
    if (uid && !seenReviewer.has(uid)) {
      seenReviewer.add(uid);
      reviewerIdsNeedingFallback.push(uid);
    }
  }

  const partnerByUser = new Map<
    UserId,
    {
      name: string;
      cover: string | null;
      location: Pick<Tables<"businesses">, "address" | "city" | "state">;
    }
  >();

  if (reviewerIdsNeedingFallback.length > 0) {
    const { data: bizRows } = await supabase
      .from("businesses")
      .select(
        "user_id, business_name, created_at, cover_image_url, address, city, state",
      )
      .in("user_id", reviewerIdsNeedingFallback)
      .order("created_at", { ascending: true });

    for (const row of bizRows ?? []) {
      const uid = row.user_id as UserId;
      if (!partnerByUser.has(uid)) {
        partnerByUser.set(uid, {
          name: row.business_name,
          cover: row.cover_image_url ?? null,
          location: {
            address: row.address,
            city: row.city,
            state: row.state,
          },
        });
      }
    }
  }

  enriched = enriched.map((r) => {
    const bid = r.reviewer_business_id;
    const explicit = bid != null ? partnerByBusinessId.get(bid) : undefined;
    const fallback = partnerByUser.get(r.reviewer_user_id as UserId);
    const p = explicit ?? fallback;
    return {
      ...r,
      reviewer_business_name: p?.name ?? null,
      reviewer_business_cover_image_url: p?.cover ?? null,
      reviewer_business_location: p?.location ?? null,
    };
  });

  return {
    ok: true,
    data: {
      data: enriched,
      total_results: countResult.count!,
    },
  };
}

export async function confirmIncomingReview(
  reviewId: Tables<"reviews">["id"],
): Promise<APIResponse<UpdatedReviewStatus>> {
  const supabase = createClient();

  const { data: verifiedStatus, error: statusError } = await supabase
    .from("review_statuses")
    .select("id")
    .eq("name", ReviewStatusNames.VERIFIED)
    .single();

  if (statusError) {
    console.error("Error fetching verified status:", statusError);
    return { ok: false, error: statusError };
  }

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

  await tryResolveConnectionForReview(supabase, reviewId);
  if (data[0]?.reviewed_business_id != null) {
    revalidateTag(getBusinessSnapshotTag(data[0].reviewed_business_id));
  }
  if (data[0]?.reviewer_business_id != null) {
    revalidateTag(getBusinessSnapshotTag(data[0].reviewer_business_id));
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
  reviewId: Tables<"reviews">["id"],
): Promise<APIResponse<UpdatedReviewStatus>> {
  const supabase = createClient();

  const { data: rejectedStatus, error: statusError } = await supabase
    .from("review_statuses")
    .select("id")
    .eq("name", ReviewStatusNames.REJECTED)
    .single();

  if (statusError) {
    console.error("Error fetching rejected status:", statusError);
    return { ok: false, error: statusError };
  }

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

  await tryResolveConnectionForReview(supabase, reviewId);
  if (data[0]?.reviewed_business_id != null) {
    revalidateTag(getBusinessSnapshotTag(data[0].reviewed_business_id));
  }
  if (data[0]?.reviewer_business_id != null) {
    revalidateTag(getBusinessSnapshotTag(data[0].reviewer_business_id));
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
