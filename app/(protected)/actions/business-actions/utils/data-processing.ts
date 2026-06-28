import { formatUsPhoneMask, normalizeUsPhoneDigits } from "@/lib/phone-us";
import {
  classifyPlatformUrl,
  normalizePlatformUrlInput,
} from "@/lib/validation/platform-urls";
import { AddressValue } from "@/types/address";
import type { FetchedBusiness, PlatformURLs } from "@/types/dashboard";
import type { Tables } from "@/types/database";
import { FieldNames } from "@/utils/my-business";

export type ValidatedBusinessCore = Pick<
  Tables<"businesses">,
  "business_name" | "address" | "city" | "state" | "zip_code" | "phone"
>;

type BusinessFormDataInput = {
  addressFields: AddressValue;
  businessName: string;
  imageFile: File | null;
  phoneDigits: string;
  platformUrls: Record<number, string>;
  platforms: PlatformRow[];
};

type ParseResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

type PlatformRow = Pick<Tables<"platforms">, "id" | "name">;

const AT_LEAST_ONE_PLATFORM_ERROR =
  "At least one valid platform URL is required (Google Maps, Yelp, or TripAdvisor).";

/** Validates core business profile fields from create/edit FormData. */
export function parseValidatedBusinessCoreForm(
  formData: FormData,
): ParseResult<ValidatedBusinessCore> {
  const businessName =
    (formData.get(FieldNames.forBusinessName()) as string)?.trim() ?? "";
  if (!businessName) {
    return { ok: false, error: "Business name is required." };
  }

  const phoneRaw = (formData.get(FieldNames.forPhone()) as string) || "";
  const phoneDigits = normalizeUsPhoneDigits(phoneRaw);
  if (phoneDigits.length !== 10) {
    return {
      ok: false,
      error: "Phone must be a valid 10-digit US number.",
    };
  }

  const address = (
    (formData.get(FieldNames.forAddress()) as string) || ""
  ).trim();
  const city = ((formData.get(FieldNames.forCity()) as string) || "").trim();
  const state = ((formData.get(FieldNames.forState()) as string) || "").trim();
  const zip_code = (
    (formData.get(FieldNames.forZipCode()) as string) || ""
  ).trim();

  if (!address || !city || !state || !zip_code) {
    return {
      ok: false,
      error: "Address, city, state, and ZIP are required.",
    };
  }

  return {
    ok: true,
    data: {
      address,
      business_name: businessName,
      city,
      phone: formatUsPhoneMask(phoneDigits),
      state: state.toUpperCase(),
      zip_code,
    },
  };
}

/** Builds FormData payload for create business action. */
export function buildCreateBusinessFormData({
  addressFields,
  businessName,
  imageFile,
  phoneDigits,
  platformUrls,
  platforms,
}: BusinessFormDataInput): FormData {
  const fd = buildCommonBusinessFormData({
    addressFields,
    businessName,
    imageFile,
    phoneDigits,
  });

  const urls: PlatformURLs = {};
  for (const p of platforms) {
    const raw = (platformUrls[p.id] ?? "").trim();
    if (classifyPlatformUrl(raw, p.name) === "valid") {
      urls[p.id] = normalizePlatformUrlInput(raw);
    }
  }
  fd.set(FieldNames.forPlatformUrls(), JSON.stringify(urls));

  return fd;
}

/** Builds FormData payload for edit business action. */
export function buildEditBusinessFormData({
  addressFields,
  businessName,
  imageFile,
  phoneDigits,
  platformUrls,
  platforms,
}: BusinessFormDataInput): FormData {
  const fd = buildCommonBusinessFormData({
    addressFields,
    businessName,
    imageFile,
    phoneDigits,
  });

  for (const p of platforms) {
    const raw = (platformUrls[p.id] ?? "").trim();
    if (raw && classifyPlatformUrl(raw, p.name) === "valid") {
      fd.set(
        FieldNames.forSinglePlatformURL(p.id),
        normalizePlatformUrlInput(raw),
      );
    } else {
      fd.set(FieldNames.forSinglePlatformURL(p.id), "");
    }
  }

  return fd;
}

/**
 * Validates platform URLs from the create-business FormData JSON blob.
 * Non-empty values must be valid for their platform; empty values are omitted.
 */
export function parseValidatedCreatePlatformUrls(
  formData: FormData,
  platformRows: PlatformRow[],
): ParseResult<PlatformURLs> {
  const platformUrlsJson = formData.get(
    FieldNames.forPlatformUrls(),
  ) as string | null;

  let parsed: PlatformURLs = {};
  if (platformUrlsJson) {
    try {
      parsed = JSON.parse(platformUrlsJson) as PlatformURLs;
    } catch {
      return { ok: false, error: "Invalid platform URL data." };
    }
  }

  const platformById = new Map(platformRows.map((row) => [row.id, row]));
  const validated: PlatformURLs = {};

  for (const [idStr, rawUrl] of Object.entries(parsed)) {
    const trimmed = String(rawUrl ?? "").trim();
    if (!trimmed) continue;

    const platformId = Number(idStr);
    const row = platformById.get(platformId);
    if (!row) {
      return { ok: false, error: "Invalid platform." };
    }

    if (classifyPlatformUrl(trimmed, row.name) !== "valid") {
      return { ok: false, error: `Invalid URL for ${row.name}.` };
    }

    validated[platformId] = normalizePlatformUrlInput(trimmed);
  }

  if (Object.keys(validated).length === 0) {
    return { ok: false, error: AT_LEAST_ONE_PLATFORM_ERROR };
  }

  return { ok: true, data: validated };
}

/**
 * Validates per-platform URL fields from the edit-business FormData.
 * Empty inputs are omitted from the result; `havePlatformUrlsChanged` + sync
 * treat omitted ids as removals when a junction row previously existed.
 */
export function parseValidatedEditPlatformUrls(
  formData: FormData,
  platformRows: PlatformRow[],
): ParseResult<PlatformURLs> {
  const validated: PlatformURLs = {};

  for (const platform of platformRows) {
    const raw =
      (formData.get(FieldNames.forSinglePlatformURL(platform.id)) as string) ??
      "";
    const trimmed = raw.trim();
    if (!trimmed) continue;

    if (classifyPlatformUrl(trimmed, platform.name) !== "valid") {
      return { ok: false, error: `Invalid URL for ${platform.name}.` };
    }

    validated[platform.id] = normalizePlatformUrlInput(trimmed);
  }

  if (Object.keys(validated).length === 0) {
    return { ok: false, error: AT_LEAST_ONE_PLATFORM_ERROR };
  }

  return { ok: true, data: validated };
}

/**
 * Returns whether validated core profile fields differ from the stored business row.
 * Drives the metadata portion of the `businesses` update patch.
 */
export function hasCoreMetadataChanged(
  existing: ValidatedBusinessCore,
  next: ValidatedBusinessCore,
): boolean {
  return (
    existing.business_name !== next.business_name ||
    existing.address !== next.address ||
    existing.city !== next.city ||
    existing.state !== next.state ||
    existing.zip_code !== next.zip_code ||
    existing.phone !== next.phone
  );
}

/**
 * Returns whether the next platform URL set differs from the stored set.
 * Compares both keys and values so cleared platforms and new links are detected.
 */
export function havePlatformUrlsChanged(
  existing: PlatformURLs,
  next: PlatformURLs,
): boolean {
  const existingIds = Object.keys(existing).map(Number);
  const nextIds = Object.keys(next).map(Number);

  if (existingIds.length !== nextIds.length) {
    return true;
  }

  for (const platformId of nextIds) {
    if (existing[platformId] !== next[platformId]) {
      return true;
    }
  }

  for (const platformId of existingIds) {
    if (next[platformId] === undefined) {
      return true;
    }
  }

  return false;
}

/** Builds a platform-id map from nested business_platform rows. */
export function platformUrlsFromBusinessPlatformRows(
  rows: Array<
    Pick<Tables<"business_platforms">, "platform_id" | "platform_url">
  >,
): PlatformURLs {
  const platform_urls: PlatformURLs = {};
  for (const row of rows) {
    platform_urls[row.platform_id] = row.platform_url;
  }
  return platform_urls;
}

type BusinessPlatformRow = Pick<
  Tables<"business_platforms">,
  "id" | "platform_id" | "platform_url"
>;

export type BusinessRowWithPlatforms = Pick<
  Tables<"businesses">,
  | "id"
  | "business_name"
  | "phone"
  | "address"
  | "city"
  | "state"
  | "zip_code"
  | "cover_image_url"
  | "created_at"
  | "updated_at"
> & {
  platforms: BusinessPlatformRow[] | null;
};

/** Maps a Supabase business row (with nested platforms) to `FetchedBusiness`. */
export function mapBusinessRowWithPlatforms(
  row: BusinessRowWithPlatforms,
): FetchedBusiness {
  const { platforms, ...rest } = row;
  const platform_urls: FetchedBusiness["platform_urls"] = {};
  (platforms ?? []).forEach((platformRow) => {
    if (platformRow.platform_url != null) {
      platform_urls[platformRow.platform_id] = platformRow.platform_url;
    }
  });

  return {
    ...rest,
    platform_urls,
  };
}

function buildCommonBusinessFormData({
  addressFields,
  businessName,
  imageFile,
  phoneDigits,
}: Omit<BusinessFormDataInput, "platformUrls" | "platforms">): FormData {
  const fd = new FormData();
  fd.set(FieldNames.forBusinessName(), businessName.trim());

  const line1 = addressFields.line1.trim();
  const address = addressFields.line2.trim()
    ? `${line1}, ${addressFields.line2.trim()}`
    : line1;

  fd.set(FieldNames.forAddress(), address);
  fd.set(FieldNames.forCity(), addressFields.city.trim());
  fd.set(FieldNames.forState(), addressFields.state.trim().toUpperCase());
  fd.set(FieldNames.forZipCode(), addressFields.zip.trim());
  fd.set(FieldNames.forPhone(), formatUsPhoneMask(phoneDigits));

  if (imageFile) {
    fd.append(FieldNames.forBusinessPhoto(), imageFile);
  }

  return fd;
}
