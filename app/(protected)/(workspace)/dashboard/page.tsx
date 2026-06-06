import { Metadata } from "next";

import { FinishProfileDialog } from "@/components/dashboard/finish-profile-dialog";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { createClient } from "@/lib/supabase/server";

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
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <>
      {user ? <FinishProfileDialog user={user} /> : null}
      <section className="flex w-full min-w-0 flex-1 flex-col py-7 pb-16">
        <DashboardContent />
      </section>
    </>
  );
}
