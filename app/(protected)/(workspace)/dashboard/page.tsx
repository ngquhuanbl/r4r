import { Metadata } from "next";

import { fetchBusinessesCached } from "@/app/(protected)/actions/business-actions";
import { FinishProfileDialog } from "@/components/dashboard/finish-profile-dialog";
import { DashboardContentClient } from "@/components/dashboard/dashboard-content-client";
import { getUserOrRedirect } from "@/lib/supabase/server";
import { unwrap } from "@/utils/api";

export const metadata: Metadata = {
  title: "Dashboard | R4R",
  description: `Manage all your businesses in one place. Track review tasks, monitor performance, and start new review exchanges on R4R.`,
};

/**
 * Dashboard page:
 * * Display business list in grid layout and provide create business dialog.
 * * Handle profile completion dialog for new users.
 */
export default async function Page() {
  const user = await getUserOrRedirect();
  const businesses = await unwrap(fetchBusinessesCached(user.id));

  return (
    <>
      <FinishProfileDialog user={user} />
      <section className="flex w-full min-w-0 flex-1 flex-col py-7 pb-16">
        <DashboardContentClient businesses={businesses} />
      </section>
    </>
  );
}
