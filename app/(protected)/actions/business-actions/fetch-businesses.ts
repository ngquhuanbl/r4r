"use server";

import { unstable_cache } from "next/cache";

import { getBusinessListTag } from "@/lib/business/business-page-cache-tags";
import { mapBusinessRowWithPlatforms } from "@/app/(protected)/actions/business-actions/utils/data-processing";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { FetchedBusiness } from "@/types/dashboard";
import type { APIResponse, UserId } from "@/types/shared";

const BUSINESS_LIST_SELECT = `
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
`;

export async function fetchBusinesses(
  userId: UserId,
): Promise<APIResponse<FetchedBusiness[]>> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("businesses")
      .select(BUSINESS_LIST_SELECT)
      .eq("user_id", userId);

    if (error) {
      console.error("Failed to fetch business list", error);
      return { ok: false, error: error.message };
    }

    return {
      ok: true,
      data: data.map(mapBusinessRowWithPlatforms),
    };
  } catch (e: any) {
    console.error("Unexpected error during business list fetching", e);
    return { ok: false, error: e.message || "Unexpected error" };
  }
}

export async function fetchBusinessesCached(
  userId: UserId,
): Promise<APIResponse<FetchedBusiness[]>> {
  const cached = unstable_cache(
    async (cachedUserId: UserId): Promise<APIResponse<FetchedBusiness[]>> => {
      try {
        const supabase = createServiceRoleClient();
        const { data, error } = await supabase
          .from("businesses")
          .select(BUSINESS_LIST_SELECT)
          .eq("user_id", cachedUserId);

        if (error) {
          console.error("Failed to fetch business list (cached)", error);
          return { ok: false, error: error.message };
        }

        return {
          ok: true,
          data: data.map(mapBusinessRowWithPlatforms),
        };
      } catch (e: any) {
        console.error("Unexpected error during cached business list fetching", e);
        return { ok: false, error: e.message || "Unexpected error" };
      }
    },
    ["business-list"],
    { tags: [getBusinessListTag(userId)] },
  );
  return cached(userId);
}
