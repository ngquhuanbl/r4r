"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Deletes multiple records from a specified table where the specified column matches any ID in the provided array
 * @param {Object} params - The parameters for the delete operation
 * @param {string} params.table - The table name to delete from
 * @param {string[]} params.ids - Array of values to match against
 * @param {string} [params.matchOn="external_id"] - The column to match against (defaults to "external_id")
 * @param {string} [params.path] - Optional path to revalidate after deletion
 */

export async function destroy({ table, ids, match = "external_id", path }) {
  const supabase = createClient();

  const { data, count } = await supabase
    .from(table)
    .delete()
    .in(match, ids)
    .select();

  if (path) {
    revalidatePath(path);
  }

  return {
    count: count || 0,
    data,
  };
}