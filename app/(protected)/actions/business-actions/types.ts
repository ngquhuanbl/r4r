import type { FetchedBusiness } from "@/types/dashboard";

/** Create/update business — optional warning when profile saved but cover upload failed. */
export type BusinessMutationResponse =
  | { ok: true; data: FetchedBusiness; coverPhotoWarning?: string }
  | { ok: false; error: unknown };
