"use server";

import { createClient } from "@/lib/supabase/server";
import { Tables } from "@/types/database";
import { APIResponse } from "@/types/shared";

export async function fetchReviewStatuses(): Promise<
  APIResponse<Tables<"review_statuses">[]>
> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.from("review_statuses").select("*");

    if (error) {
      console.error("Failed to fetch incoming review status list", error);
      return { ok: false, error: error.message };
    }

    return { ok: true, data: data || [] };
  } catch (e: any) {
    console.error(
      "Unexpected error during incoming review status list fetching",
      e
    );
    return { ok: false, error: e.message || "Unexpected error" };
  }
}

export async function fetchPlatforms(): Promise<
  APIResponse<Tables<"platforms">[]>
> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.from("platforms").select("*");

    if (error) {
      console.error("Failed to fetch platforms", error);
      return { ok: false, error: error.message };
    }

    return { ok: true, data: data || [] };
  } catch (e: any) {
    console.error("Unexpected error during platforms fetching", e);
    return { ok: false, error: e.message || "Unexpected error" };
  }
}
