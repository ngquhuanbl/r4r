import { Metadata } from "next";

import { FinishProfileDialog } from "@/components/dashboard/finish-profile-dialog";
import { DashboardLocationsGrid } from "@/components/dashboard/DashboardLocationsGrid";
import { createClient } from "@/lib/supabase/server";

import { PreloadResources } from "./preload-resources";

export const metadata: Metadata = {
  title: "Dashboard | R4R",
  description: `Manage all your businesses in one place. Track review tasks, monitor performance, and start new review exchanges on R4R.`,
};

export default async function Page() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <>
      <PreloadResources />
      {user ? <FinishProfileDialog user={user} /> : null}
      <section className="flex w-full min-w-0 flex-1 flex-col py-7 pb-16">
        <DashboardLocationsGrid />
      </section>
    </>
  );
}
