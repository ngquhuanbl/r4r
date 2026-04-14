import { NextStep, NextStepProvider } from "nextstepjs";
import {
  fetchIncomingReviews,
  fetchOutgoingReviews,
  fetchPendingReviewRequests,
  fetchPlatforms,
  fetchReviewStatuses,
} from "./home/actions";

import { Footer } from "@/components/shared/footer";
import { Header } from "@/components/shared/header";
import { INCOMING_REVIEWS_PAGE_SIZE } from "@/constants/dashboard/ui";
import { PROTECTED_CONTENT_SHELL_CLASS } from "@/constants/layout";
import { ONBOARDING_STEPS } from "@/constants/dashboard/onboarding";
import StepCard from "@/components/shared/CardStep";
import { StoreProvider } from "./StoreProvider";
import { createClient } from "@/lib/supabase/server";
import { fetchBusinesses } from "./my-businesses/actions";
import { fetchMetrics } from "./metrics/actions";
import { unwrap } from "@/utils/api";

interface LayoutProps {
  children: React.ReactNode;
}

export default async function Layout({ children }: LayoutProps) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userId = user!.id;

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
            <Header userId={user!.id} />

            <main className="flex min-h-0 w-full flex-1 flex-col">
              <div
                className={`${PROTECTED_CONTENT_SHELL_CLASS} flex min-h-0 flex-1 flex-col`}
              >
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
