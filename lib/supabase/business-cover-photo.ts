import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

const BUCKET = "business-photos";
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

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

  if (!ALLOWED.has(file.type)) {
    return {
      ok: false,
      message: "Image must be JPEG, PNG, or WebP.",
    };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, message: "Image must be 5MB or smaller." };
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
