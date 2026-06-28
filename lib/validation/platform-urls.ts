import { PlatformNames } from "@/constants/shared";

export type PlatformUrlKind = "empty" | "valid" | "invalid";

/**
 * Classifies a pasted URL for a specific review platform (Google Maps, Yelp, TripAdvisor).
 */
export function classifyPlatformUrl(
  raw: string,
  platformName: string,
): PlatformUrlKind {
  const trimmed = raw.trim();
  if (!trimmed) return "empty";

  let url: URL;
  try {
    url = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
  } catch {
    return "invalid";
  }

  const host = url.hostname.toLowerCase();

  if (platformName === PlatformNames.Google) {
    if (host === "maps.app.goo.gl" || host === "goo.gl") return "valid";
    // Google Maps / reviews short links (e.g. share.google/…)
    if (host === "share.google" || host.endsWith(".share.google")) {
      if (url.pathname.length > 1) return "valid";
      return "invalid";
    }
    if (host.includes("google.")) {
      if (url.pathname.includes("/maps") || host.startsWith("maps."))
        return "valid";
    }
    return "invalid";
  }

  if (platformName === PlatformNames.Yelp) {
    if (host.includes("yelp.")) return "valid";
    return "invalid";
  }

  if (platformName === PlatformNames.TripAdvisor) {
    if (host.includes("tripadvisor.")) return "valid";
    return "invalid";
  }

  // Other platforms: well-formed http(s) URL
  if (url.protocol === "http:" || url.protocol === "https:") {
    return "valid";
  }
  return "invalid";
}

export function platformLabelForMessage(platformName: string): string {
  if (platformName === PlatformNames.Google) return "Google Maps";
  if (platformName === PlatformNames.Yelp) return "Yelp";
  if (platformName === PlatformNames.TripAdvisor) return "TripAdvisor";
  return "Other";
}

/** Normalize URL for storage (add https if missing). */
export function normalizePlatformUrlInput(raw: string): string {
  const t = raw.trim();
  if (!t) return "";
  return t.includes("://") ? t : `https://${t}`;
}
