"use server";
import { revalidatePath } from "next/cache";

import { Paths } from "@/constants/paths";
import { createClient } from "@/lib/supabase/server";
import { FetchedBusiness, PlatformURLs } from "@/types/dashboard";
import { Tables } from "@/types/database";
import { APIResponse, UserId } from "@/types/shared";
import { FieldNames } from "@/utils/my-business";

export async function fetchBusinesses(
  userId: UserId
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
				created_at,
				updated_at,
				platforms:business_platforms (
					id,
					platform_id,
					platform_url
				)
				`
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

export async function updateBusiness(
  businessId: Tables<"businesses">["id"],
  formData: FormData
): Promise<APIResponse<FetchedBusiness>> {
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
				created_at,
				updated_at,
				platforms:business_platforms (
					id,
					platform_id,
					platform_url
				)
				`
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
        `Unexpected duplicated business platform: (businessId, ${businessId}) - (platformId, ${platform_id}) - (id, ${id})`
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
        FieldNames.forSinglePlatformURL(platform.id)
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
            id: platform.id,
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
      				`
            )
            .maybeSingle()
        )
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
          }))
        )
        .select(
          `
							platform_id,
							platform_url
							`
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
            .maybeSingle()
        )
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

  revalidatePath(Paths.MY_BUSINESSES);
  return {
    ok: true,
    data: {
      ...updateBusinessData,
      platform_urls: updatedPlatformURLs,
    },
  };
}

export async function deleteBusiness(
  businessId: Tables<"businesses">["id"]
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

  revalidatePath(Paths.MY_BUSINESSES);
  return { ok: true, data: deleteData };
}

export async function createBusiness(
  userId: UserId,
  formData: FormData
): Promise<APIResponse<FetchedBusiness>> {
  const supabase = createClient();

  // Try to parse the platform URLs JSON
  let platformUrls: PlatformURLs = {};
  try {
    const platformUrlsJson = formData.get(
      FieldNames.forPlatformUrls()
    ) as string;
    if (platformUrlsJson) {
      platformUrls = JSON.parse(platformUrlsJson);
    }
  } catch (e) {
    console.error("Error parsing platform URLs:", e);
  }

  const businessData = {
    business_name: formData.get(FieldNames.forBusinessName()) as string,
    address: (formData.get(FieldNames.forAddress()) as string) || "",
    city: formData.get(FieldNames.forCity()) as string,
    state: formData.get(FieldNames.forState()) as string,
    zip_code: formData.get(FieldNames.forZipCode()) as string,
    phone: (formData.get(FieldNames.forPhone()) as string) || "",
    user_id: userId,
  };

  // 1. Insert the business
  const { data: newBusiness, error: businessError } = await supabase
    .from("businesses")
    .insert(businessData)
    .select()
    .single();

  if (businessError) {
    console.error("Error creating business:", businessError);
    return { ok: false, error: businessError };
  }

  const createdBusiness: FetchedBusiness = {
    ...newBusiness,
    platform_urls: {},
  };

  // 2. If we have platform URLs, insert them into business_platforms
  if (Object.keys(platformUrls).length > 0) {
    const dataToInsert = Object.entries(platformUrls).map(
      ([platformId, url]) => ({
        business_id: newBusiness.id,
        platform_id: parseInt(platformId),
        platform_url: url,
        is_verified: false,
      })
    );

    const { data: platformData, error: platformError } = await supabase
      .from("business_platforms")
      .insert(dataToInsert)
      .select(
        `
				platform_id,
				platform_url
				`
      );

    if (platformError) {
      console.error("Error adding platform URLs:", platformError);
      // We don't return error here as the business was created successfully
    } else {
      platformData.forEach(({ platform_id, platform_url }) => {
        createdBusiness.platform_urls[platform_id] = platform_url;
      });
    }
  }

  revalidatePath(Paths.MY_BUSINESSES);
  return { ok: true, data: createdBusiness };
}
