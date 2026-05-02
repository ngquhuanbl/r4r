import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import { validateBusinessCoverImageFile } from "@/lib/validation/business-cover-image";

const BUCKET = "business-photos";

function extensionForMime(type: string): string {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "jpg";
}

export async function uploadBusinessCoverPhoto(
  supabase: SupabaseClient<Database>,
  params: {
    userId: string;
    businessId: number;
    file: File;
  },
): Promise<{ ok: true; publicUrl: string } | { ok: false; message: string }> {
  const { userId, businessId, file } = params;

  const validated = validateBusinessCoverImageFile(file);
  if (!validated.ok) {
    return { ok: false, message: validated.message };
  }

  const ext = extensionForMime(file.type);
  const path = `${userId}/${businessId}/cover.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, buf, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    console.error("Storage upload failed:", uploadError);
    return {
      ok: false,
      message: uploadError.message || "Failed to upload image.",
    };
  }

  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { ok: true, publicUrl: pub.publicUrl };
}
