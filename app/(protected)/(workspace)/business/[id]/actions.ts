"use server";

import { unstable_cache } from "next/cache";

import {
  fetchBusinessBillingInfo,
  fetchUserSubscriptionPeriodEnd,
} from "@/app/(protected)/billing/actions";
import {
  getBusinessProfileTag,
  getBusinessSnapshotTag,
} from "@/lib/business/business-page-cache-tags";
import { mapBusinessRowWithPlatforms } from "@/app/(protected)/actions/business-actions/utils/data-processing";
import { computeBusinessReviewSnapshot } from "@/lib/business/compute-business-review-snapshot";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { FetchedBusiness } from "@/types/dashboard";
import type { BusinessReviewSnapshot } from "@/types/business-page";
import type { APIResponse, UserId } from "@/types/shared";
import type { Tables } from "@/types/database";

/**
 * Returns the business row only if it belongs to the given user.
 */
export async function getBusinessForUser(
  userId: UserId,
  businessId: Tables<"businesses">["id"],
): Promise<FetchedBusiness | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("businesses")
    .select(
      `
      id,
      business_name,
      phone,
      address,
      city,
      state,
      zip_code,
      cover_image_url,
      created_at,
      updated_at,
      platforms:business_platforms (
        id,
        platform_id,
        platform_url
      )
      `,
    )
    .eq("id", businessId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("getBusinessForUser", error);
    return null;
  }
  if (!data) return null;

  return mapBusinessRowWithPlatforms(data);
}

/**
 * Returns the business row only if it belongs to the given user. Cached.
 * @param userId - The user id of the business owner.
 * @param businessId - The id of the business to get.
 * @returns The business row if it belongs to the given user, otherwise null.
 */
export async function getBusinessForUserCached(
  userId: UserId,
  businessId: Tables<"businesses">["id"],
): Promise<FetchedBusiness | null> {
  const cached = unstable_cache(
    async (
      cachedUserId: UserId,
      cachedBusinessId: Tables<"businesses">["id"],
    ) => {
      const supabase = createServiceRoleClient();

      // Service-role client bypasses Supabase RLS. Verify ownership explicitly before
      // reading business data inside unstable_cache (no per-request session/cookies here).
      const { data: owned } = await supabase
        .from("businesses")
        .select("id")
        .eq("id", cachedBusinessId)
        .eq("user_id", cachedUserId)
        .maybeSingle();

      if (!owned) {
        return null;
      }

      const { data, error } = await supabase
        .from("businesses")
        .select(
          `
            id,
            business_name,
            phone,
            address,
            city,
            state,
            zip_code,
            cover_image_url,
            created_at,
            updated_at,
            platforms:business_platforms (
              id,
              platform_id,
              platform_url
            )
          `,
        )
        .eq("id", cachedBusinessId)
        .eq("user_id", cachedUserId)
        .maybeSingle();

      if (error) {
        console.error("getBusinessForUserCached", error);
        return null;
      }
      if (!data) return null;

      return mapBusinessRowWithPlatforms(data);
    },
    ["business-profile"],
    { tags: [getBusinessProfileTag(businessId)] },
  );
  return cached(userId, businessId);
}

/**
 * Snapshot counts for the stacked bar chart. "Received" is scoped to this business.
 * "Given" counts outgoing reviews where `reviewer_business_id` matches this business.
 */
export async function fetchBusinessReviewSnapshot(
  userId: UserId,
  businessId: Tables<"businesses">["id"],
): Promise<APIResponse<BusinessReviewSnapshot>> {
  const supabase = createClient();
  return computeBusinessReviewSnapshot(supabase, userId, businessId);
}

export async function fetchBusinessReviewSnapshotCached(
  userId: UserId,
  businessId: Tables<"businesses">["id"],
): Promise<APIResponse<BusinessReviewSnapshot>> {
  const cached = unstable_cache(
    async (
      cachedUserId: UserId,
      cachedBusinessId: Tables<"businesses">["id"],
    ) => {
      const supabase = createServiceRoleClient();
      const { data: owned } = await supabase
        .from("businesses")
        .select("id")
        .eq("id", cachedBusinessId)
        .eq("user_id", cachedUserId)
        .maybeSingle();
      if (!owned) {
        return { ok: false, error: "Business not found" } as const;
      }
      return computeBusinessReviewSnapshot(
        supabase,
        cachedUserId,
        cachedBusinessId,
      );
    },
    ["business-review-snapshot"],
    { tags: [getBusinessSnapshotTag(businessId)] },
  );
  return cached(userId, businessId);
}

export type BusinessBillingSidebarContext = {
  businessBilling: Tables<"business_billing"> | null;
  subscriptionPeriodEnd: string | null;
  slotsUsed: number;
};

/** Billing row, renewal date, and active connection count for the workspace sidebar. */
export async function fetchBusinessBillingContext(
  userId: UserId,
  businessId: Tables<"businesses">["id"],
): Promise<BusinessBillingSidebarContext> {
  const [businessBilling, subscriptionPeriodEnd] = await Promise.all([
    fetchBusinessBillingInfo(businessId),
    fetchUserSubscriptionPeriodEnd(userId),
  ]);

  return {
    businessBilling,
    subscriptionPeriodEnd,
    slotsUsed: businessBilling?.slots_used ?? 0,
  };
}

/**
 * Client-safe refresh of billing + slot usage after mutations (e.g. new connection).
 * Uses the authenticated session; ignores client-supplied user id.
 */
export async function refetchBusinessBillingContext(
  businessId: Tables<"businesses">["id"],
): Promise<APIResponse<BusinessBillingSidebarContext>> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Unauthorized" };
  }
  const owned = await getBusinessForUser(user.id, businessId);
  if (!owned) {
    return { ok: false, error: "Business not found" };
  }
  const data = await fetchBusinessBillingContext(user.id, businessId);
  return { ok: true, data };
}
