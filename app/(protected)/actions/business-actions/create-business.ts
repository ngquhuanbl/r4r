"use server";

import {
  mapBusinessRowWithPlatforms,
  parseValidatedBusinessCoreForm,
  parseValidatedCreatePlatformUrls,
} from "@/app/(protected)/actions/business-actions/utils/data-processing";
import { uploadBusinessCoverFromForm } from "@/app/(protected)/actions/business-actions/utils/image";
import type { BusinessMutationResponse } from "@/app/(protected)/actions/business-actions/types";
import { revalidateBusinessCaches } from "@/app/(protected)/actions/business-actions/utils/revalidation";
import { createClient } from "@/lib/supabase/server";

/**
 * Creates a new business profile from the create-business form.
 *
 * Request strategy:
 * 1. Authenticate via session (`user_id` is never taken from the client).
 * 2. Validate core metadata and platform URLs on the server before any writes.
 * 3. Insert the `businesses` row (metadata only; `cover_image_url` starts null).
 * 4. Upload cover photo to storage when present, then persist `cover_image_url`.
 *    Storage paths require `businessId` (`userId/businessId/cover.ext`), and ids are
 *    SERIAL-assigned on insert — so create cannot batch metadata + cover into one
 *    `INSERT` the way `updateBusiness` batches into one `UPDATE`.
 * 5. Insert `business_platforms` junction rows (required for a valid profile).
 * 6. Invalidate tagged caches; the client calls `router.refresh()` to re-fetch.
 *
 * Failure semantics:
 * - Cover upload/save failures are soft: the business is kept, optional warning returned.
 * - Platform insert failure is hard: the new business row is rolled back.
 */
export async function createBusiness(
  formData: FormData,
): Promise<BusinessMutationResponse> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Unauthorized" };
  }

  // Fail fast on invalid metadata before hitting the platforms catalog query.
  const coreResult = parseValidatedBusinessCoreForm(formData);
  if (!coreResult.ok) {
    return { ok: false, error: coreResult.error };
  }

  const { data: platformRows, error: platformsLookupError } = await supabase
    .from("platforms")
    .select("id, name")
    .order("id");

  if (platformsLookupError) {
    console.error("Error loading platforms:", platformsLookupError);
    return { ok: false, error: platformsLookupError };
  }

  // Create form sends platform URLs as a JSON blob; invalid non-empty URLs fail explicitly.
  const platformUrlsResult = parseValidatedCreatePlatformUrls(
    formData,
    platformRows,
  );
  if (!platformUrlsResult.ok) {
    return { ok: false, error: platformUrlsResult.error };
  }

  const businessData = {
    ...coreResult.data,
    user_id: user.id,
  };

  // First `businesses` write: metadata only. `businessId` is needed for storage upload.
  const { data: newBusiness, error: businessError } = await supabase
    .from("businesses")
    .insert(businessData)
    .select()
    .single();

  if (businessError) {
    console.error("Error creating business:", businessError);
    return { ok: false, error: businessError };
  }

  // Second `businesses` write (cover only): upload needs the inserted id for the storage key.
  const coverUpload = await uploadBusinessCoverFromForm(
    supabase,
    user.id,
    newBusiness.id,
    formData,
  );

  let coverImageUrl: string | null = newBusiness.cover_image_url ?? null;
  let coverPhotoWarning: string | undefined;

  if (coverUpload.uploadedUrl) {
    const { error: coverUpdateError } = await supabase
      .from("businesses")
      .update({ cover_image_url: coverUpload.uploadedUrl })
      .eq("id", newBusiness.id);

    if (coverUpdateError) {
      // File is in storage but the row still has null cover — warn, do not fail create.
      console.error("Error saving cover_image_url:", coverUpdateError);
      coverPhotoWarning =
        "Photo uploaded but could not be saved to your profile. Try again.";
    } else {
      coverImageUrl = coverUpload.uploadedUrl;
    }
  } else if (coverUpload.coverPhotoWarning !== undefined) {
    coverPhotoWarning = coverUpload.coverPhotoWarning;
  }

  // Platforms are required — a business without junction rows is not a usable profile.
  const dataToInsert = Object.entries(platformUrlsResult.data).map(
    ([platformId, url]) => ({
      business_id: newBusiness.id,
      is_verified: false,
      platform_id: parseInt(platformId, 10),
      platform_url: url,
    }),
  );

  const { data: platformData, error: platformError } = await supabase
    .from("business_platforms")
    .insert(dataToInsert)
    .select("id, platform_id, platform_url");

  if (platformError) {
    console.error("Error adding platform URLs:", platformError);
    // Roll back the business row so we never leave an owner with a platform-less profile.
    const { error: rollbackError } = await supabase
      .from("businesses")
      .delete()
      .eq("id", newBusiness.id);
    if (rollbackError) {
      console.error(
        "Error rolling back business after platform insert failure:",
        rollbackError,
      );
    }
    return {
      ok: false,
      error: "Failed to save platform URLs. Please try again.",
    };
  }

  // Tag invalidation busts server Data Cache; mounted UI still needs router.refresh().
  revalidateBusinessCaches(user.id, newBusiness.id);
  return {
    ok: true,
    data: mapBusinessRowWithPlatforms({
      ...newBusiness,
      cover_image_url: coverImageUrl,
      platforms: platformData,
    }),
    ...(coverPhotoWarning !== undefined ? { coverPhotoWarning } : {}),
  };
}
