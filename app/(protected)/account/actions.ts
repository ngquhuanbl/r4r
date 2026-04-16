"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { Paths } from "@/constants/paths";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { deleteAllStorageForUser } from "@/lib/supabase/delete-user-storage";
import { createClient } from "@/lib/supabase/server";
import { uploadUserAvatar } from "@/lib/supabase/user-avatar";
import type { TablesInsert } from "@/types/database";
import type { User } from "@supabase/supabase-js";

export type NotificationPreferenceKey =
  | "notify_new_connection"
  | "notify_weekly_summary";

export async function updateNotificationPreference(
  key: NotificationPreferenceKey,
  value: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const { data: row } = await supabase
    .from("user_preferences")
    .select("notify_new_connection, notify_weekly_summary")
    .eq("user_id", user.id)
    .maybeSingle();

  const next: TablesInsert<"user_preferences"> = {
    user_id: user.id,
    notify_new_connection:
      key === "notify_new_connection"
        ? value
        : (row?.notify_new_connection ?? true),
    notify_weekly_summary:
      key === "notify_weekly_summary"
        ? value
        : (row?.notify_weekly_summary ?? false),
  };

  const { error } = await supabase.from("user_preferences").upsert(next, {
    onConflict: "user_id",
  });

  if (error) {
    console.error("updateNotificationPreference:", error);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function saveProfileIdentity(
  formData: FormData,
): Promise<
  | { ok: true; user: User }
  | { ok: false; error: string }
> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const displayName = (formData.get("displayName") as string | null)?.trim();
  if (!displayName) {
    return { ok: false, error: "Display name is required." };
  }

  const avatar = formData.get("avatar");
  const removeCustomAvatar = formData.get("removeCustomAvatar") === "true";

  /** `undefined` = leave as-is; `null` = remove custom; string = new URL */
  let avatarPatch: string | null | undefined;

  if (removeCustomAvatar) {
    avatarPatch = null;
  } else if (avatar instanceof File && avatar.size > 0) {
    const up = await uploadUserAvatar(supabase, { userId: user.id, file: avatar });
    if (!up.ok) return { ok: false, error: up.message };
    avatarPatch = up.publicUrl;
  }

  const existing = (user.user_metadata ?? {}) as Record<string, unknown>;
  const nextMeta: Record<string, unknown> = {
    ...existing,
    display_name: displayName,
  };
  if (avatarPatch !== undefined) {
    if (avatarPatch === null) {
      delete nextMeta.avatar_url;
    } else {
      nextMeta.avatar_url = avatarPatch;
    }
  }

  const { data, error } = await supabase.auth.updateUser({
    data: nextMeta as typeof user.user_metadata,
  });

  if (error || !data.user) {
    console.error("saveProfileIdentity:", error);
    return { ok: false, error: error?.message ?? "Failed to save profile." };
  }

  revalidatePath("/", "layout");
  return { ok: true, user: data.user };
}

/** On success, redirects to sign-in (client does not receive a return value). */
export async function deleteAccount(): Promise<{ ok: false; error: string } | void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(Paths.SIGN_IN);
  }

  let admin: ReturnType<typeof createServiceRoleClient>;
  try {
    admin = createServiceRoleClient();
  } catch (e) {
    console.error("deleteAccount: service role missing", e);
    return { ok: false, error: "Account deletion is not configured on the server." };
  }

  const { error: rpcError } = await admin.rpc("delete_user_account_data", {
    target_user_id: user.id,
  });
  if (rpcError) {
    console.error("delete_user_account_data:", rpcError);
    return { ok: false, error: rpcError.message };
  }

  try {
    await deleteAllStorageForUser(admin, user.id);
  } catch (e) {
    console.error("deleteAllStorageForUser:", e);
  }

  const { error: delError } = await admin.auth.admin.deleteUser(user.id);
  if (delError) {
    console.error("auth.admin.deleteUser:", delError);
    return { ok: false, error: delError.message };
  }

  await supabase.auth.signOut();
  redirect(Paths.SIGN_IN);
}
