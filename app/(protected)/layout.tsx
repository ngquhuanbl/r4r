import { NextStep, NextStepProvider } from "nextstepjs";

import StepCard from "@/components/shared/CardStep";
import { Footer } from "@/components/shared/footer";
import { Header } from "@/components/shared/header";
import { ONBOARDING_STEPS } from "@/constants/dashboard/onboarding";
import { INCOMING_REVIEWS_PAGE_SIZE } from "@/constants/dashboard/ui";
import { createClient } from "@/lib/supabase/server";
import { unwrap } from "@/utils/api";

import {
  fetchIncomingReviews,
  fetchOutgoingReviews,
  fetchPendingReviewRequests,
  fetchPlatforms,
  fetchReviewStatuses,
} from "./home/actions";
import { processAutoConnect } from "./home/auto-connect";
import { fetchMetrics } from "./metrics/actions";
import { fetchBusinesses } from "./my-businesses/actions";
import { StoreProvider } from "./StoreProvider";

interface LayoutProps {
  children: React.ReactNode;
}

export default async function Layout({ children }: LayoutProps) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userId = user!.id;

  // Process auto-connect queue on page visit (fire and forget)
  // This runs in parallel with data fetching but we don't wait for the result
  // The Realtime subscription will pick up any new invitations
  // Feature flag: set NEXT_PUBLIC_ENABLE_AUTO_CONNECT=true in .env to enable
  const isAutoConnectEnabled =
    process.env.NEXT_PUBLIC_ENABLE_AUTO_CONNECT === "true";

  if (isAutoConnectEnabled) {
    processAutoConnect(userId).catch((err) =>
      console.error("Auto-connect processing error:", err)
    );
  }

  const [
    incomingReviews,
    outgoingReviews,
    reviewRequests,
    myBusinesses,
    reviewStatuses,
    platforms,
    metrics,
  ] = await Promise.all([
    unwrap(fetchIncomingReviews(userId, 1, INCOMING_REVIEWS_PAGE_SIZE)),
    unwrap(fetchOutgoingReviews(userId, 1, INCOMING_REVIEWS_PAGE_SIZE)),
    unwrap(fetchPendingReviewRequests(userId)),
    unwrap(fetchBusinesses(userId)),
    unwrap(fetchReviewStatuses()),
    unwrap(fetchPlatforms()),
    unwrap(fetchMetrics(userId)),
  ]);

  return (
    <StoreProvider
      initialData={{
        user: user!,
        incomingReviews,
        outgoingReviews,
        reviewRequests,
        myBusinesses,
        reviewStatuses,
        platforms,
        metrics,
      }}
    >
      <NextStepProvider>
        <NextStep steps={ONBOARDING_STEPS} cardComponent={StepCard}>
          <div className="flex flex-col min-h-screen">
            <Header userId={user!.id} email={user!.email} />

            {/* Page content */}
            <main className="grow flex flex-col items-center py-6">
              <div className="max-w-7xl px-4 pl-6 sm:px-6 lg:px-8 grow flex flex-col w-full gap-10">
                {children}
              </div>
            </main>
            <Footer />
          </div>
        </NextStep>
      </NextStepProvider>
    </StoreProvider>
  );
}
