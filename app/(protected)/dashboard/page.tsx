import { Metadata } from "next";

import { DashboardLocationsGrid } from "@/components/dashboard/DashboardLocationsGrid";

import { PreloadResources } from "./preload-resources";

export const metadata: Metadata = {
  title: "Dashboard | R4R",
  description: `Manage all your businesses in one place. Track review tasks, monitor performance, and start new review exchanges on R4R.`,
};

export default function Page() {
  return (
    <>
      <PreloadResources />
      <section className="w-full min-w-0 self-stretch px-16 py-7 pb-16 grow flex">
        <DashboardLocationsGrid />
      </section>
    </>
  );
}
