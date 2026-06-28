import type { SupabaseClient } from "@supabase/supabase-js";

import { uploadBusinessCoverPhoto } from "@/lib/supabase/business-cover-photo";
import type { Database, Tables } from "@/types/database";
import type { UserId } from "@/types/shared";
import { FieldNames } from "@/utils/my-business";

type UploadCoverPhotoResult = {
  coverPhotoWarning?: string;
  uploadedUrl: string | null;
};

/** Whether the edit form includes a new cover photo file (not just an empty file input). */
export function hasFormCoverPhoto(formData: FormData): boolean {
  const photoField = formData.get(FieldNames.forBusinessPhoto());
  return photoField instanceof File && photoField.size > 0;
}

/**
 * Uploads a new cover photo to storage when the form includes a file.
 * Does not write to `businesses` — callers persist `cover_image_url` themselves.
 */
export async function uploadBusinessCoverFromForm(
  supabase: SupabaseClient<Database>,
  userId: UserId,
  businessId: Tables<"businesses">["id"],
  formData: FormData,
): Promise<UploadCoverPhotoResult> {
  const photoField = formData.get(FieldNames.forBusinessPhoto());
  if (!(photoField instanceof File) || photoField.size === 0) {
    return { uploadedUrl: null };
  }

  const uploaded = await uploadBusinessCoverPhoto(supabase, {
    businessId,
    file: photoField,
    userId,
  });

  if (!uploaded.ok) {
    console.error("Cover photo upload failed:", uploaded.message);
    return {
      coverPhotoWarning: uploaded.message,
      uploadedUrl: null,
    };
  }

  return { uploadedUrl: uploaded.publicUrl };
}
