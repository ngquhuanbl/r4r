import { Footer } from "@/components/shared/footer";
import { Header } from "@/components/shared/header";
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

  const [
    incomingReviews,
    outgoingReviews,
    reviewRequests,
    myBusinesses,
    reviewStatuses,
    platforms,
  ] = await Promise.all([
    unwrap(fetchIncomingReviews(userId, 1, INCOMING_REVIEWS_PAGE_SIZE)),
    unwrap(fetchOutgoingReviews(userId, 1, INCOMING_REVIEWS_PAGE_SIZE)),
    unwrap(fetchPendingReviewRequests(userId)),
    unwrap(fetchBusinesses(userId)),
    unwrap(fetchReviewStatuses()),
    unwrap(fetchPlatforms()),
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
      }}
    >
      <div className="flex flex-col min-h-screen">
        <Header userId={user!.id} email={user!.email} />

        {/* Page content */}
        <main className="flex-1">
          <div className="py-6">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </StoreProvider>
  );
}
