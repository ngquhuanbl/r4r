"use server";

import { revalidatePath } from "next/cache";
import { revalidateTag, unstable_cache } from "next/cache";

import { Paths, businessPath } from "@/constants/paths";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { uploadBusinessCoverPhoto } from "@/lib/supabase/business-cover-photo";
import { createClient } from "@/lib/supabase/server";
import { formatUsPhoneMask, normalizeUsPhoneDigits } from "@/lib/phone-us";
import {
  classifyPlatformUrl,
  normalizePlatformUrlInput,
} from "@/lib/validation/platform-urls";
import { FetchedBusiness, PlatformURLs } from "@/types/dashboard";
import { Tables } from "@/types/database";
import { APIResponse, UserId } from "@/types/shared";
import { FieldNames } from "@/utils/my-business";

/** Create/update business — optional warning when profile saved but cover upload failed. */
export type BusinessMutationResponse =
  | { ok: true; data: FetchedBusiness; coverPhotoWarning?: string }
  | { ok: false; error: unknown };

function getBusinessListTag(userId: UserId): string {
  return `business-list:${userId}`;
}

export async function fetchBusinesses(
  userId: UserId,
): Promise<APIResponse<FetchedBusiness[]>> {
  try {
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
      .eq("user_id", userId);

    if (error) {
      console.error("Failed to fetch business list", error);
      return { ok: false, error: error.message };
    }

    const finalData = data.map((item) => {
      const { platforms, ...rest } = item;
      const platform_urls: FetchedBusiness["platform_urls"] = {};
      platforms.forEach(({ platform_id, platform_url }) => {
        platform_urls[platform_id] = platform_url;
      });
      return {
        ...rest,
        platform_urls,
      };
    });

    return { ok: true, data: finalData || [] };
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
          .eq("user_id", cachedUserId);

        if (error) {
          console.error("Failed to fetch business list (cached)", error);
          return { ok: false, error: error.message };
        }

        const finalData = data.map((item) => {
          const { platforms, ...rest } = item;
          const platform_urls: FetchedBusiness["platform_urls"] = {};
          platforms.forEach(({ platform_id, platform_url }) => {
            platform_urls[platform_id] = platform_url;
          });
          return {
            ...rest,
            platform_urls,
          };
        });

        return { ok: true, data: finalData || [] };
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

export async function updateBusiness(
  businessId: Tables<"businesses">["id"],
  formData: FormData,
): Promise<BusinessMutationResponse> {
  const supabase = createClient();

  const { data: platformsData, error: platformsError } = await supabase
    .from("platforms")
    .select("*")
    .order("id");

  if (platformsError) {
    console.error(`Failed to fetch platforms`, platformsError);
    return { ok: false, error: platformsError };
  }

  const businessData = {
    business_name: formData.get(FieldNames.forBusinessName()) as string,
    address: (formData.get(FieldNames.forAddress()) as string) || "",
    city: formData.get(FieldNames.forCity()) as string,
    state: formData.get(FieldNames.forState()) as string,
    zip_code: formData.get(FieldNames.forZipCode()) as string,
    phone: (formData.get(FieldNames.forPhone()) as string) || "",
  };

  // Update business
  const { data: updateBusinessData, error: updateBusinessError } =
    await supabase
      .from("businesses")
      .update(businessData)
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

  const updatedPlatformURLs: PlatformURLs = {};
  const platformId2BusinessPlatformIdMap = new Map<
    Tables<"platforms">["id"],
    Tables<"business_platforms">["id"]
  >();
  for (const {
    id,
    platform_id,
    platform_url,
  } of updateBusinessData.platforms) {
    if (platformId2BusinessPlatformIdMap.has(platform_id)) {
      console.log(
        `Unexpected duplicated business platform: (businessId, ${businessId}) - (platformId, ${platform_id}) - (id, ${id})`,
      );
      return { ok: false, error: "Unexpected error" };
    }
    platformId2BusinessPlatformIdMap.set(platform_id, id);
    updatedPlatformURLs[platform_id] = platform_url;
  }

  if (platformsData) {
    const updateList: Array<
      Pick<Tables<"business_platforms">, "id" | "platform_url">
    > = [];
    const insertList: Array<
      Pick<Tables<"business_platforms">, "platform_id" | "platform_url">
    > = [];
    const removeList: Array<Pick<Tables<"business_platforms">, "platform_id">> =
      [];
    for (const platform of platformsData) {
      const url = formData.get(
        FieldNames.forSinglePlatformURL(platform.id),
      ) as string;

      if (url && url.trim() !== "") {
        const id = platformId2BusinessPlatformIdMap.get(platform.id);
        if (id === undefined) {
          insertList.push({
            platform_id: platform.id,
            platform_url: url.trim(),
          });
        } else {
          updateList.push({
            id,
            platform_url: url.trim(),
          });
        }
      } else {
        removeList.push({
          platform_id: platform.id,
        });
      }
    }

    if (updateList.length) {
      const result = await Promise.all(
        updateList.map(({ id, platform_url }) =>
          supabase
            .from("business_platforms")
            .update({ platform_url, is_verified: false })
            .eq("id", id)
            .select(
              `
      				platform_id,
      				platform_url
      				`,
            )
            .maybeSingle(),
        ),
      );

      for (const { data, error } of result) {
        if (error) {
          console.error(`Failed to update business platform`, error);
          return { ok: false, error: "Unexpected error" };
        }

        updatedPlatformURLs[data!.platform_id] = data!.platform_url;
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
        .select(
          `
							platform_id,
							platform_url
							`,
        );

      if (error) {
        console.error(`Failed to insert business platform`, error);
        return { ok: false, error: "Unexpected error" };
      }

      for (const { platform_id, platform_url } of data) {
        updatedPlatformURLs[platform_id] = platform_url;
      }
    }

    if (removeList.length) {
      const result = await Promise.all(
        removeList.map(({ platform_id }) =>
          supabase
            .from("business_platforms")
            .delete()
            .eq("business_id", businessId)
            .eq("platform_id", platform_id)
            .select("platform_id")
            .maybeSingle(),
        ),
      );
      for (const { data, error } of result) {
        if (error) {
          console.error(`Failed to delete business platform`, error);
          return { ok: false, error: "Unexpected error" };
        }

        delete updatedPlatformURLs[data!.platform_id];
      }
    }
  }

  let coverImageUrl: string | null = updateBusinessData.cover_image_url ?? null;
  let coverPhotoWarning: string | undefined;
  const photoField = formData.get(FieldNames.forBusinessPhoto());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (photoField instanceof File && photoField.size > 0 && user) {
    const uploaded = await uploadBusinessCoverPhoto(supabase, {
      userId: user.id,
      businessId,
      file: photoField,
    });
    if (uploaded.ok) {
      const { error: coverUpdateError } = await supabase
        .from("businesses")
        .update({ cover_image_url: uploaded.publicUrl })
        .eq("id", businessId);
      if (!coverUpdateError) {
        coverImageUrl = uploaded.publicUrl;
      } else {
        console.error("Error saving cover_image_url:", coverUpdateError);
        coverPhotoWarning =
          "Photo uploaded but could not be saved to your profile. Try again.";
      }
    } else {
      console.error("Cover photo upload failed:", uploaded.message);
      coverPhotoWarning = uploaded.message;
    }
  }

  revalidatePath(Paths.DASHBOARD);
  revalidatePath(businessPath(businessId));
  if (user?.id) {
    revalidateTag(getBusinessListTag(user.id));
  }
  return {
    ok: true,
    data: {
      ...updateBusinessData,
      cover_image_url: coverImageUrl,
      platform_urls: updatedPlatformURLs,
    },
    ...(coverPhotoWarning !== undefined ? { coverPhotoWarning } : {}),
  };
}

export async function deleteBusiness(
  businessId: Tables<"businesses">["id"],
): Promise<APIResponse<Pick<Tables<"businesses">, "id">>> {
  const supabase = createClient();

  // Technically we don't need to delete business_platforms separately
  // since we have ON DELETE CASCADE, but it's good practice to be explicit
  const { error: platformsError } = await supabase
    .from("business_platforms")
    .delete()
    .eq("business_id", businessId);

  if (platformsError) {
    console.error("Error deleting business platforms:", platformsError);
    // Continue anyway, as the CASCADE should handle it
  }

  const { data: deleteData, error } = await supabase
    .from("businesses")
    .delete()
    .eq("id", businessId)
    .select("id")
    .single();

  if (error) {
    console.error("Error deleting business:", error);
    return { ok: false, error };
  }

  revalidatePath(Paths.DASHBOARD);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user?.id) {
    revalidateTag(getBusinessListTag(user.id));
  }
  return { ok: true, data: deleteData };
}

export async function createBusiness(
  userId: UserId,
  formData: FormData,
): Promise<BusinessMutationResponse> {
  const supabase = createClient();

  let platformUrls: PlatformURLs = {};
  try {
    const platformUrlsJson = formData.get(
      FieldNames.forPlatformUrls(),
    ) as string;
    if (platformUrlsJson) {
      platformUrls = JSON.parse(platformUrlsJson);
    }
  } catch (e) {
    console.error("Error parsing platform URLs:", e);
  }

  const { data: platformRows, error: platformsLookupError } = await supabase
    .from("platforms")
    .select("id, name");

  if (platformsLookupError) {
    console.error("Error loading platforms:", platformsLookupError);
    return { ok: false, error: platformsLookupError };
  }

  const validatedPlatformUrls: PlatformURLs = {};
  for (const [idStr, rawUrl] of Object.entries(platformUrls)) {
    const url = String(rawUrl ?? "").trim();
    if (!url) continue;
    const platformId = parseInt(idStr, 10);
    const row = platformRows?.find((p) => p.id === platformId);
    if (!row) continue;
    if (classifyPlatformUrl(url, row.name) === "valid") {
      validatedPlatformUrls[platformId] = normalizePlatformUrlInput(url);
    }
  }

  if (Object.keys(validatedPlatformUrls).length === 0) {
    return {
      ok: false,
      error:
        "At least one valid platform URL is required (Google Maps, Yelp, or TripAdvisor).",
    };
  }

  const businessNameRaw = formData.get(FieldNames.forBusinessName()) as string;
  const businessName = businessNameRaw?.trim() ?? "";
  if (!businessName) {
    return { ok: false, error: "Business name is required." };
  }

  const phoneRaw = (formData.get(FieldNames.forPhone()) as string) || "";
  const phoneDigits = normalizeUsPhoneDigits(phoneRaw);
  if (phoneDigits.length !== 10) {
    return {
      ok: false,
      error: "Phone must be a valid 10-digit US number.",
    };
  }

  const businessData = {
    business_name: businessName,
    address: (formData.get(FieldNames.forAddress()) as string) || "",
    city: formData.get(FieldNames.forCity()) as string,
    state: formData.get(FieldNames.forState()) as string,
    zip_code: formData.get(FieldNames.forZipCode()) as string,
    phone: formatUsPhoneMask(phoneDigits),
    user_id: userId,
  };

  const { data: newBusiness, error: businessError } = await supabase
    .from("businesses")
    .insert(businessData)
    .select()
    .single();

  if (businessError) {
    console.error("Error creating business:", businessError);
    return { ok: false, error: businessError };
  }

  let coverImageUrl: string | null = newBusiness.cover_image_url ?? null;
  let coverPhotoWarning: string | undefined;
  const photoField = formData.get(FieldNames.forBusinessPhoto());
  if (photoField instanceof File && photoField.size > 0) {
    const uploaded = await uploadBusinessCoverPhoto(supabase, {
      userId,
      businessId: newBusiness.id,
      file: photoField,
    });
    if (uploaded.ok) {
      const { error: coverUpdateError } = await supabase
        .from("businesses")
        .update({ cover_image_url: uploaded.publicUrl })
        .eq("id", newBusiness.id);
      if (coverUpdateError) {
        console.error("Error saving cover_image_url:", coverUpdateError);
        coverPhotoWarning =
          "Photo uploaded but could not be saved to your profile. Try again.";
      } else {
        coverImageUrl = uploaded.publicUrl;
      }
    } else {
      console.error("Cover photo upload failed:", uploaded.message);
      coverPhotoWarning = uploaded.message;
    }
  }

  const createdBusiness: FetchedBusiness = {
    ...newBusiness,
    cover_image_url: coverImageUrl,
    platform_urls: {},
  };

  const dataToInsert = Object.entries(validatedPlatformUrls).map(
    ([platformId, url]) => ({
      business_id: newBusiness.id,
      platform_id: parseInt(platformId, 10),
      platform_url: url,
      is_verified: false,
    }),
  );

  const { data: platformData, error: platformError } = await supabase
    .from("business_platforms")
    .insert(dataToInsert)
    .select(
      `
			platform_id,
			platform_url
			`,
    );

  if (platformError) {
    console.error("Error adding platform URLs:", platformError);
  } else if (platformData) {
    platformData.forEach(({ platform_id, platform_url }) => {
      createdBusiness.platform_urls[platform_id] = platform_url;
    });
  }

  revalidatePath(Paths.DASHBOARD);
  revalidateTag(getBusinessListTag(userId));
  return {
    ok: true,
    data: createdBusiness,
    ...(coverPhotoWarning !== undefined ? { coverPhotoWarning } : {}),
  };
}
