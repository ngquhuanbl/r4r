import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AccountSettingsForm } from "@/components/account/account-settings-form";
import { Paths } from "@/constants/paths";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export const metadata: Metadata = {
  title: "Account",
  description: "Manage your profile, notifications, and appearance.",
};

export default async function AccountPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(Paths.SIGN_IN);
  }

  const { data: prefs } = await supabase
    .from("user_preferences")
    .select("notify_new_connection, notify_weekly_summary")
    .eq("user_id", user.id)
    .maybeSingle();

  const initialPreferences: Pick<
    Tables<"user_preferences">,
    "notify_new_connection" | "notify_weekly_summary"
  > = {
    notify_new_connection: prefs?.notify_new_connection ?? true,
    notify_weekly_summary: prefs?.notify_weekly_summary ?? false,
  };

  return (
    <div className="pb-28 pt-6 md:pt-8">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        User settings
      </p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight">Account</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Your public identity and preferences for Review4Review.
      </p>
      <div className="mt-8 max-w-xl">
        <AccountSettingsForm user={user} initialPreferences={initialPreferences} />
      </div>
    </div>
  );
}
