import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AccountSettingsForm } from "@/components/account/account-settings-form";
import { Paths } from "@/constants/paths";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Account",
  description: "Manage your profile and appearance.",
};

export default async function AccountPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(Paths.LOGIN);
  }

  const billingEnabled =
    process.env.NEXT_PUBLIC_BILLING_ENABLED === "true";

  return (
    <div className="pb-28 pt-6 md:pt-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            User settings
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Account</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your public identity and preferences for Review4Review.
          </p>
        </div>
        {billingEnabled ? (
          <Link
            href={Paths.BILLING}
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Billing
          </Link>
        ) : null}
      </div>
      <div className="mt-8 max-w-xl">
        <AccountSettingsForm user={user} />
      </div>
    </div>
  );
}
