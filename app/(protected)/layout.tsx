import { headers } from "next/headers";
import { NextStep, NextStepProvider } from "nextstepjs";

import {
  fetchIncomingReviews,
  fetchOutgoingReviews,
  fetchPendingReviewRequests,
  fetchPlatforms,
  fetchReviewStatuses,
} from "./actions/review-actions";

import { Footer } from "@/components/shared/footer";
import { Header } from "@/components/shared/header";
import {
  INCOMING_REVIEWS_PAGE_SIZE,
  OUTGOING_REVIEWS_PAGE_SIZE,
} from "@/constants/dashboard/ui";
import { ONBOARDING_STEPS } from "@/constants/dashboard/onboarding";
import StepCard from "@/components/shared/CardStep";
import { StoreProvider } from "./StoreProvider";
import { createClient } from "@/lib/supabase/server";
import { fetchBusinesses } from "./actions/business-actions";
import { fetchMetrics } from "./metrics/actions";
import type { IncomingReview, OutgoingReview, ReviewRequest } from "@/types/dashboard";
import { unwrap } from "@/utils/api";

interface LayoutProps {
  children: React.ReactNode;
}

function emptyReviewList<T>(): { data: T[]; total_results: number } {
  return { data: [], total_results: 0 };
}

export default async function Layout({ children }: LayoutProps) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userId = user!.id;

  const pathname = headers().get("x-next-pathname") ?? "";
  const skipReviewLists =
    pathname === "/account" ||
    pathname.startsWith("/account/") ||
    pathname === "/billing" ||
    pathname.startsWith("/billing/");

  const [myBusinesses, reviewStatuses, platforms, metrics] = await Promise.all([
    unwrap(fetchBusinesses(userId)),
    unwrap(fetchReviewStatuses()),
    unwrap(fetchPlatforms()),
    unwrap(fetchMetrics(userId)),
  ]);

  let incomingReviews: { data: IncomingReview[]; total_results: number };
  let outgoingReviews: { data: OutgoingReview[]; total_results: number };
  let reviewRequests: ReviewRequest[];

  if (skipReviewLists) {
    incomingReviews = emptyReviewList<IncomingReview>();
    outgoingReviews = emptyReviewList<OutgoingReview>();
    reviewRequests = [];
  } else {
    const [inc, out, req] = await Promise.all([
      unwrap(fetchIncomingReviews(userId, 1, INCOMING_REVIEWS_PAGE_SIZE)),
      unwrap(fetchOutgoingReviews(userId, 1, OUTGOING_REVIEWS_PAGE_SIZE)),
      unwrap(fetchPendingReviewRequests(userId)),
    ]);
    incomingReviews = inc;
    outgoingReviews = out;
    reviewRequests = req;
  }

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
          <div className="flex min-h-screen flex-col">
            <Header user={user!} />

            <main className="flex min-h-0 w-full flex-1 flex-col">
              <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col px-4 md:px-8 lg:px-16">
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
