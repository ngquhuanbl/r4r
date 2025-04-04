"use server";

import { revalidatePath } from "next/cache";
import { createClient, getUserOrRedirect } from "@/lib/supabase/server";

export async function create({ table, data, path, withUser = false }) {
  const supabase = createClient();
  let user = null;

  // Check if data is an array or a single object
  const isBulkInsert = Array.isArray(data);
  let processedData = data;

  // Handle user attachment if needed
  if (withUser) {
    user = await getUserOrRedirect();

    if (isBulkInsert) {
      processedData =
        data.length > 0
          ? data.map((item) => ({ ...item, user_id: user.id }))
          : [];
    } else {
      processedData = { ...data, user_id: user.id };
    }
  }

  if (isBulkInsert && processedData.length === 0) {
    return [];
  }

  let query = supabase.from(table).insert(processedData);

  try {
    if (!isBulkInsert) {
      const { data: record, error } = await query.select().single();

      if (error) {
        if (error.code === "23505") {
          // Duplicate entry, return a meaningful response instead of throwing
          return {
            success: false,
            message: "This image is already in the collection.",
          };
        }
        throw error;
      }

      if (path) {
        revalidatePath(path);
      }

      return {
        ...record,
        id: record?.external_id || record?.id,
        success: true,
      };
    } else {
      const { data: records, error } = await query.select();

      if (error) {
        if (error.code === "23505") {
          return {
            success: false,
            message: "Some images were already in the collection.",
          };
        }
        throw error;
      }

      if (path) {
        revalidatePath(path);
      }

      return records.map((record) => ({
        ...record,
        id: record?.external_id || record?.id,
        success: true,
      }));
    }
  } catch (error) {
    console.log(error);
    return { success: false, message: "An unexpected error occurred." };
  }
}
