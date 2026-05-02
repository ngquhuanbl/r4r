/** File picker hint — matches server upload rules for business cover photos. */
export const BUSINESS_COVER_IMAGE_ACCEPT =
  "image/jpeg,image/png,image/webp" as const;

const ALLOWED = new Set<string>([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export const BUSINESS_COVER_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

export function validateBusinessCoverImageFile(
  file: File,
): { ok: true } | { ok: false; message: string } {
  if (!ALLOWED.has(file.type)) {
    return {
      ok: false,
      message: "Image must be JPEG, PNG, or WebP.",
    };
  }
  if (file.size > BUSINESS_COVER_IMAGE_MAX_BYTES) {
    return { ok: false, message: "Image must be 5MB or smaller." };
  }
  return { ok: true };
}
