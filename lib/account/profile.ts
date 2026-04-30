import type { User } from "@supabase/supabase-js";

const OAUTH_SKIP_FINISH_PROFILE = new Set(["google", "azure"]);

/**
 * Magic-link / email users must set display name; Google & Microsoft SSO skip (spec).
 */
export function needsFinishProfile(user: User): boolean {
  const identities = user.identities ?? [];
  if (
    identities.some((i) => OAUTH_SKIP_FINISH_PROFILE.has(i.provider ?? ""))
  ) {
    return false;
  }

  const meta = user.user_metadata as Record<string, unknown> | undefined;
  if (meta?.profile_completed === true) {
    return false;
  }

  const dn = meta?.display_name;
  if (typeof dn === "string" && dn.trim().length >= 2) {
    return false;
  }

  return true;
}

export function getDisplayName(user: User): string {
  const m = user.user_metadata as Record<string, unknown> | undefined;
  if (m?.display_name && typeof m.display_name === "string" && m.display_name.trim()) {
    return m.display_name.trim();
  }
  if (m?.full_name && typeof m.full_name === "string" && m.full_name.trim()) {
    return m.full_name.trim();
  }
  if (m?.name && typeof m.name === "string" && m.name.trim()) {
    return m.name.trim();
  }
  const email = user.email;
  if (email) return email.split("@")[0] ?? "User";
  return "User";
}

function firstNonEmptyString(
  obj: Record<string, unknown> | undefined,
  keys: string[],
): string | undefined {
  if (!obj) return undefined;
  for (const key of keys) {
    const v = obj[key];
    if (typeof v === "string" && v.trim().length > 0) {
      return v.trim();
    }
  }
  return undefined;
}

/**
 * Resolved avatar URL for UI (custom upload or OAuth picture).
 * Custom `avatar_url` in metadata wins. Google/Microsoft often put the photo only on
 * `identities[].identity_data` until merged into `user_metadata`; we read both.
 */
export function getAvatarUrl(user: User): string | undefined {
  const m = user.user_metadata as Record<string, unknown> | undefined;
  const fromMeta = firstNonEmptyString(m, [
    "avatar_url",
    "picture",
    "picture_url",
    "photo_url",
  ]);
  if (fromMeta) return fromMeta;

  for (const identity of user.identities ?? []) {
    let data = identity.identity_data as
      | Record<string, unknown>
      | string
      | undefined;
    if (typeof data === "string") {
      try {
        data = JSON.parse(data) as Record<string, unknown>;
      } catch {
        data = undefined;
      }
    }
    const fromIdentity = firstNonEmptyString(
      data && typeof data === "object" ? data : undefined,
      ["avatar_url", "picture", "picture_url", "photo_url"],
    );
    if (fromIdentity) return fromIdentity;
  }

  return undefined;
}

export type ProviderBadge = {
  short: string;
  label: string;
};

export function getProviderBadge(user: User): ProviderBadge {
  const raw =
    (user.app_metadata as Record<string, unknown> | undefined)?.provider ??
    user.identities?.[0]?.provider;
  const p = typeof raw === "string" ? raw : "email";
  if (p === "google") return { short: "G", label: "Google" };
  if (p === "azure" || p === "microsoft") return { short: "M", label: "Microsoft" };
  if (p === "github") return { short: "GH", label: "GitHub" };
  return { short: "E", label: "Email" };
}
