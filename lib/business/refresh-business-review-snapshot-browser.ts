import { computeBusinessReviewSnapshot } from "@/lib/business/compute-business-review-snapshot";
import { createClient } from "@/lib/supabase/client";
import type { BusinessReviewSnapshot } from "@/types/business-page";
import type { Tables } from "@/types/database";
import type { APIResponse } from "@/types/shared";

/**
 * Recompute chart counts in the browser (no Server Action) so the left panel stays
 * current after verify/submit without a full page reload.
 */
export async function refreshBusinessReviewSnapshot(
  businessId: Tables<"businesses">["id"],
): Promise<APIResponse<BusinessReviewSnapshot>> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Unauthorized" };
  }

  const { data: owned } = await supabase
    .from("businesses")
    .select("id")
    .eq("id", businessId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!owned) {
    return { ok: false, error: "Business not found" };
  }

  return computeBusinessReviewSnapshot(supabase, user.id, businessId);
}
