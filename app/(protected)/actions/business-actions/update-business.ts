"use server";

import type { BusinessMutationResponse } from "@/app/(protected)/actions/business-actions/types";
import {
  hasCoreMetadataChanged,
  havePlatformUrlsChanged,
  mapBusinessRowWithPlatforms,
  parseValidatedBusinessCoreForm,
  parseValidatedEditPlatformUrls,
  platformUrlsFromBusinessPlatformRows,
  type ValidatedBusinessCore,
} from "@/app/(protected)/actions/business-actions/utils/data-processing";
import {
  hasFormCoverPhoto,
  uploadBusinessCoverFromForm,
} from "@/app/(protected)/actions/business-actions/utils/image";
import { revalidateBusinessCaches } from "@/app/(protected)/actions/business-actions/utils/revalidation";
import { createClient } from "@/lib/supabase/server";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { PlatformURLs } from "@/types/dashboard";
import type { Database, Tables } from "@/types/database";

/**
 * Updates an owned business profile from the edit form.
 *
 * Request strategy (minimize `businesses` writes):
 * 1. Load current row + platform junction rows (RLS-scoped read for diffing).
 * 2. Validate submitted metadata and platform URLs on the server.
 * 3. Skip all writes when nothing changed.
 * 4. Upload cover photo to storage first when a new file is present.
 *    If upload fails, abort before mutating Postgres so we never save metadata
 *    while leaving a broken/missing image reference.
 * 5. Apply at most one `businesses.update` with a patch that merges changed
 *    metadata and/or the new `cover_image_url`.
 * 6. Sync `business_platforms` only when URL values actually changed.
 * 7. Invalidate tagged caches; the client calls `router.refresh()` to re-fetch.
 */
export async function updateBusiness(
  businessId: Tables<"businesses">["id"],
  formData: FormData,
): Promise<BusinessMutationResponse> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Unauthorized" };
  }

  // Baseline for diffs and platform sync (junction row ids). Ownership enforced via user_id.
  const { data: existing, error: existingError } = await supabase
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
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingError) {
    console.error("updateBusiness: failed to load business", existingError);
    return { ok: false, error: existingError };
  }
  if (!existing) {
    return { ok: false, error: "Business not found" };
  }

  // Server-side validation mirrors client rules so direct FormData posts cannot bypass them.
  const coreResult = parseValidatedBusinessCoreForm(formData);
  if (!coreResult.ok) {
    return { ok: false, error: coreResult.error };
  }

  const { data: platformRows, error: platformsError } = await supabase
    .from("platforms")
    .select("id, name")
    .order("id");

  if (platformsError) {
    console.error("Failed to fetch platforms", platformsError);
    return { ok: false, error: platformsError };
  }

  const platformUrlsResult = parseValidatedEditPlatformUrls(
    formData,
    platformRows,
  );
  if (!platformUrlsResult.ok) {
    return { ok: false, error: platformUrlsResult.error };
  }

  const existingCore: ValidatedBusinessCore = {
    address: existing.address,
    business_name: existing.business_name,
    city: existing.city,
    phone: existing.phone,
    state: existing.state,
    zip_code: existing.zip_code,
  };
  const existingPlatformUrls = platformUrlsFromBusinessPlatformRows(
    existing.platforms ?? [],
  );

  const metadataChanged = hasCoreMetadataChanged(
    existingCore,
    coreResult.data,
  );
  const platformsChanged = havePlatformUrlsChanged(
    existingPlatformUrls,
    platformUrlsResult.data,
  );
  const hasNewPhoto = hasFormCoverPhoto(formData);

  // No-op save: avoid touching DB or caches when the form matches stored state.
  if (!metadataChanged && !platformsChanged && !hasNewPhoto) {
    return { ok: true, data: mapBusinessRowWithPlatforms(existing) };
  }

  let nextCoverImageUrl = existing.cover_image_url;

  // Storage upload happens before any business row write so we have the final URL
  // for a single combined update (metadata + cover) when both change.
  if (hasNewPhoto) {
    const upload = await uploadBusinessCoverFromForm(
      supabase,
      user.id,
      businessId,
      formData,
    );
    if (!upload.uploadedUrl) {
      return {
        ok: false,
        error: upload.coverPhotoWarning ?? "Failed to upload image.",
      };
    }
    nextCoverImageUrl = upload.uploadedUrl;
  }

  // Build the smallest patch possible: only fields that actually changed.
  const businessPatch: Partial<ValidatedBusinessCore> & {
    cover_image_url?: string | null;
  } = {};
  if (metadataChanged) {
    Object.assign(businessPatch, coreResult.data);
  }
  if (hasNewPhoto) {
    businessPatch.cover_image_url = nextCoverImageUrl;
  }

  let updatedBusiness = existing;

  // At most one `businesses` UPDATE per request (metadata, cover, or both).
  if (Object.keys(businessPatch).length > 0) {
    const { data, error: updateBusinessError } = await supabase
      .from("businesses")
      .update(businessPatch)
      .eq("id", businessId)
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
      .single();

    if (updateBusinessError) {
      console.error("Error updating business:", updateBusinessError);
      return { ok: false, error: updateBusinessError };
    }

    updatedBusiness = data;
  }

  let platform_urls = platformUrlsFromBusinessPlatformRows(
    updatedBusiness.platforms ?? [],
  );

  // Platform URLs live in `business_platforms`; sync only when the validated set differs.
  if (platformsChanged) {
    const syncResult = await syncBusinessPlatformUrls(
      supabase,
      businessId,
      platformUrlsResult.data,
      updatedBusiness.platforms ?? [],
    );
    if (!syncResult.ok) {
      return { ok: false, error: syncResult.error };
    }
    platform_urls = syncResult.platform_urls;
  }

  // Tag invalidation busts server Data Cache; mounted UI still needs router.refresh().
  revalidateBusinessCaches(user.id, businessId);
  return {
    ok: true,
    data: {
      ...mapBusinessRowWithPlatforms(updatedBusiness),
      platform_urls,
    },
  };
}



type ExistingBusinessPlatform = Pick<
  Tables<"business_platforms">,
  "id" | "platform_id" | "platform_url"
>;

type SyncResult =
  | { ok: true; platform_urls: PlatformURLs }
  | { ok: false; error: string };

/**
 * Reconciles validated platform URLs against existing rows for a business.
 *
 * Inserts new links, updates changed URLs, and removes cleared platforms.
 * Deletes are queued only for platforms that already have a junction row —
 * clearing an empty field must not issue a delete for a non-existent row.
 */
export async function syncBusinessPlatformUrls(
  supabase: SupabaseClient<Database>,
  businessId: Tables<"businesses">["id"],
  validatedUrls: PlatformURLs,
  existingPlatforms: ExistingBusinessPlatform[],
): Promise<SyncResult> {
  const platformIdToRowId = new Map<
    Tables<"platforms">["id"],
    Tables<"business_platforms">["id"]
  >();
  const platform_urls: PlatformURLs = {};

  for (const { id, platform_id, platform_url } of existingPlatforms) {
    if (platformIdToRowId.has(platform_id)) {
      console.error(
        `Unexpected duplicated business platform: (businessId=${businessId}, platformId=${platform_id}, id=${id})`,
      );
      return { ok: false, error: "Unexpected error" };
    }
    platformIdToRowId.set(platform_id, id);
    platform_urls[platform_id] = platform_url;
  }

  const updateList: Array<
    Pick<Tables<"business_platforms">, "id" | "platform_url">
  > = [];
  const insertList: Array<
    Pick<Tables<"business_platforms">, "platform_id" | "platform_url">
  > = [];
  const removeList: Array<Pick<Tables<"business_platforms">, "platform_id">> =
    [];

  // Classify submitted URLs into insert / update / remove against existing junction rows.
  for (const [platformIdStr, platform_url] of Object.entries(validatedUrls)) {
    const platform_id = Number(platformIdStr);
    const rowId = platformIdToRowId.get(platform_id);
    if (rowId === undefined) {
      insertList.push({ platform_id, platform_url });
    } else {
      updateList.push({ id: rowId, platform_url });
    }
  }

  // Only platforms that had a row but are absent from the validated map get deleted.
  for (const platform_id of Array.from(platformIdToRowId.keys())) {
    if (validatedUrls[platform_id] === undefined) {
      removeList.push({ platform_id });
    }
  }

  if (updateList.length) {
    const result = await Promise.all(
      updateList.map(({ id, platform_url }) =>
        supabase
          .from("business_platforms")
          .update({ platform_url, is_verified: false })
          .eq("id", id)
          .select("platform_id, platform_url")
          .maybeSingle(),
      ),
    );

    for (const { data, error } of result) {
      if (error) {
        console.error("Failed to update business platform", error);
        return { ok: false, error: "Unexpected error" };
      }
      if (!data) {
        console.error("Failed to update business platform: row not found");
        return { ok: false, error: "Unexpected error" };
      }

      platform_urls[data.platform_id] = data.platform_url;
    }
  }

  if (insertList.length) {
    const { data, error } = await supabase
      .from("business_platforms")
      .insert(
        insertList.map(({ platform_url, platform_id }) => ({
          platform_url,
          platform_id,
          business_id: businessId,
          is_verified: false,
        })),
      )
      .select("platform_id, platform_url");

    if (error) {
      console.error("Failed to insert business platform", error);
      return { ok: false, error: "Unexpected error" };
    }

    for (const { platform_id, platform_url } of data) {
      platform_urls[platform_id] = platform_url;
    }
  }

  if (removeList.length) {
    const platformIdsToRemove = removeList.map(({ platform_id }) => platform_id);
    const { data, error } = await supabase
      .from("business_platforms")
      .delete()
      .eq("business_id", businessId)
      .in("platform_id", platformIdsToRemove)
      .select("platform_id");

    if (error) {
      console.error("Failed to delete business platform", error);
      return { ok: false, error: "Unexpected error" };
    }

    const deletedIds = new Set(
      (data ?? []).map(({ platform_id }) => platform_id),
    );
    for (const { platform_id } of removeList) {
      if (!deletedIds.has(platform_id)) {
        console.warn(
          `Business platform row missing during delete (businessId=${businessId}, platformId=${platform_id})`,
        );
      }
      delete platform_urls[platform_id];
    }
  }

  return { ok: true, platform_urls };
}
