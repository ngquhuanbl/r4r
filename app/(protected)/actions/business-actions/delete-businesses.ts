"use server";

import { revalidateBusinessCaches } from "@/app/(protected)/actions/business-actions/utils/revalidation";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";
import type { APIResponse } from "@/types/shared";

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

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user?.id) {
    revalidateBusinessCaches(user.id, businessId);
  }
  return { ok: true, data: deleteData };
}
