"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Fetch all businesses for a user with their associated platforms
export async function fetchBusinesses(userId) {
  const supabase = createClient();

  // Fetch the businesses first
  const { data: businesses, error: businessError } = await supabase
    .from("businesses")
    .select(
      `
      id,
      business_name,
      phone,
      address,
      city,
      state,
      zip_code
    `,
    )
    .eq("user_id", userId)
    .order("business_name", { ascending: true });

  if (businessError) {
    console.error("Error fetching businesses:", businessError);
    return [];
  }

  if (!businesses || businesses.length === 0) {
    return [];
  }

  // For each business, fetch their associated platform data
  const businessesWithPlatforms = await Promise.all(
    businesses.map(async (business) => {
      const { data: platformData, error: platformError } = await supabase
        .from("business_platforms")
        .select(
          `
          id,
          platform_id,
          platform_url,
          platform_business_id,
          is_verified,
          platforms (
            id,
            name,
            color
          )
        `,
        )
        .eq("business_id", business.id);

      if (platformError) {
        console.error(
          `Error fetching platforms for business ${business.id}:`,
          platformError,
        );
        return { ...business, platforms: [] };
      }

      // Convert the platform data to a format similar to the old platform_urls
      // This maintains backwards compatibility with the UI
      const platformUrls = {};
      if (platformData) {
        platformData.forEach((platform) => {
          if (platform.platform_url) {
            platformUrls[platform.platform_id] = platform.platform_url;
          }
        });
      }

      return {
        ...business,
        platform_urls: platformUrls,
        platforms: platformData || [],
      };
    }),
  );

  return businessesWithPlatforms;
}

// Create a new business
export async function createBusiness(formData, userId) {
  const supabase = createClient();

  // Try to parse the platform URLs JSON
  let platformUrls = {};
  try {
    const platformUrlsJson = formData.get("platform-urls");
    if (platformUrlsJson) {
      platformUrls = JSON.parse(platformUrlsJson);
    }
  } catch (e) {
    console.error("Error parsing platform URLs:", e);
  }

  const businessData = {
    business_name: formData.get("business-name"),
    address: formData.get("street-address"),
    city: formData.get("city"),
    state: formData.get("state"),
    zip_code: formData.get("postal-code"),
    phone: formData.get("phone") || "",
    user_id: userId,
  };

  // 1. Insert the business
  const { data: newBusiness, error: businessError } = await supabase
    .from("businesses")
    .insert([businessData])
    .select();

  if (businessError) {
    console.error("Error creating business:", businessError);
    return { success: false, error: businessError };
  }

  // 2. If we have platform URLs, insert them into business_platforms
  if (Object.keys(platformUrls).length > 0) {
    const platformData = Object.entries(platformUrls).map(
      ([platformId, url]) => ({
        business_id: newBusiness[0].id,
        platform_id: parseInt(platformId),
        platform_url: url,
        is_verified: false,
      }),
    );

    const { error: platformError } = await supabase
      .from("business_platforms")
      .insert(platformData);

    if (platformError) {
      console.error("Error adding platform URLs:", platformError);
      // We don't return error here as the business was created successfully
    }
  }

  revalidatePath("/businesses");
  return { success: true, data: newBusiness };
}

// Update an existing business
export async function updateBusiness(businessId, formData) {
  const supabase = createClient();

  const businessData = {
    business_name: formData.get("business-name"),
    address: formData.get("street-address"),
    city: formData.get("city"),
    state: formData.get("state"),
    zip_code: formData.get("postal-code"),
    phone: formData.get("phone") || "",
  };

  const { data, error } = await supabase
    .from("businesses")
    .update(businessData)
    .eq("id", businessId)
    .select();

  if (error) {
    console.error("Error updating business:", error);
    return { success: false, error };
  }

  revalidatePath("/businesses");
  revalidatePath(`/businesses/${businessId}`);
  return { success: true, data };
}

// Delete a business
export async function deleteBusiness(businessId) {
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

  const { error } = await supabase
    .from("businesses")
    .delete()
    .eq("id", businessId);

  if (error) {
    console.error("Error deleting business:", error);
    return { success: false, error };
  }

  revalidatePath("/businesses");
  return { success: true };
}

// Fetch a single business by ID with its platforms
export async function fetchBusinessById(businessId, userId) {
  const supabase = createClient();

  // Get the business
  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select(
      `
      id,
      business_name,
      phone,
      address,
      city,
      state,
      zip_code
    `,
    )
    .eq("id", businessId)
    .eq("user_id", userId)
    .single();

  if (businessError) {
    console.error("Error fetching business:", businessError);
    return null;
  }

  // Get the business platforms
  const { data: platformData, error: platformError } = await supabase
    .from("business_platforms")
    .select(
      `
      id,
      platform_id,
      platform_url,
      platform_business_id,
      is_verified,
      platforms (
        id, 
        name,
        color
      )
    `,
    )
    .eq("business_id", businessId);

  if (platformError) {
    console.error(
      `Error fetching platforms for business ${businessId}:`,
      platformError,
    );
    business.platforms = [];
    business.platform_urls = {};
    return business;
  }

  // Convert the platform data to a format similar to the old platform_urls
  // This maintains backwards compatibility with the UI
  const platformUrls = {};
  if (platformData) {
    platformData.forEach((platform) => {
      if (platform.platform_url) {
        platformUrls[platform.platform_id] = platform.platform_url;
      }
    });
  }

  business.platforms = platformData || [];
  business.platform_urls = platformUrls;

  return business;
}

// Add platform URL to a business
export async function addPlatformUrl(businessId, platformId, url) {
  const supabase = createClient();

  // Check if the platform already exists for this business
  const { data: existingPlatform, error: checkError } = await supabase
    .from("business_platforms")
    .select("id")
    .eq("business_id", businessId)
    .eq("platform_id", platformId);

  if (checkError) {
    console.error("Error checking platform:", checkError);
    return { success: false, error: checkError };
  }

  if (existingPlatform && existingPlatform.length > 0) {
    // Update existing
    const { error: updateError } = await supabase
      .from("business_platforms")
      .update({
        platform_url: url,
      })
      .eq("id", existingPlatform[0].id);

    if (updateError) {
      console.error("Error updating platform URL:", updateError);
      return { success: false, error: updateError };
    }
  } else {
    // Create new
    const { error: insertError } = await supabase
      .from("business_platforms")
      .insert([
        {
          business_id: businessId,
          platform_id: platformId,
          platform_url: url,
          is_verified: false,
        },
      ]);

    if (insertError) {
      console.error("Error inserting platform URL:", insertError);
      return { success: false, error: insertError };
    }
  }

  revalidatePath(`/businesses/${businessId}`);
  return { success: true };
}

// Remove platform URL from a business
export async function removePlatformUrl(businessId, platformId) {
  const supabase = createClient();

  const { error } = await supabase
    .from("business_platforms")
    .delete()
    .eq("business_id", businessId)
    .eq("platform_id", platformId);

  if (error) {
    console.error("Error removing platform URL:", error);
    return { success: false, error };
  }

  revalidatePath(`/businesses/${businessId}`);
  return { success: true };
}
