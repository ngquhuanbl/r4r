"use server";

import { headers } from "next/headers";

import { Paths } from "@/constants/paths";
import { createClient } from "@/lib/supabase/server";
import type { APIResponse } from "@/types/shared";

function getOrigin(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  const h = headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  if (!host) return "http://localhost:3000";
  return `${proto}://${host}`;
}

export async function signInWithOAuthProvider(
  provider: "google" | "azure",
): Promise<APIResponse<{ url: string }>> {
  const supabase = createClient();
  const origin = getOrigin();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${origin}${Paths.AUTH_CALLBACK}`,
    },
  });

  if (error) {
    console.error("signInWithOAuthProvider:", error);
    return { ok: false, error: error.message };
  }
  if (!data.url) {
    return { ok: false, error: "Could not start sign-in." };
  }
  return { ok: true, data: { url: data.url } };
}

/**
 * Passwordless email: creates account if new, or sends link to existing user.
 */
export async function sendMagicLink(
  email: string,
): Promise<APIResponse<void>> {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed || !trimmed.includes("@")) {
    return { ok: false, error: "Enter a valid email address." };
  }

  const supabase = createClient();
  const origin = getOrigin();
  const { error } = await supabase.auth.signInWithOtp({
    email: trimmed,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${origin}${Paths.AUTH_CALLBACK}`,
    },
  });

  if (error) {
    console.error("sendMagicLink:", error);
    return { ok: false, error: error.message };
  }
  return { ok: true, data: undefined };
}
