import type { User } from "@supabase/supabase-js";

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

/** Resolved avatar URL for UI (custom upload or OAuth picture). */
export function getAvatarUrl(user: User): string | undefined {
  const m = user.user_metadata as Record<string, unknown> | undefined;
  if (m?.avatar_url && typeof m.avatar_url === "string" && m.avatar_url.length > 0) {
    return m.avatar_url;
  }
  if (m?.picture && typeof m.picture === "string" && m.picture.length > 0) {
    return m.picture;
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
