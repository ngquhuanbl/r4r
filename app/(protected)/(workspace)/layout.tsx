import {
  fetchIncomingReviews,
  fetchOutgoingReviews,
} from "../actions/review-actions";
import { fetchBusinesses } from "../actions/business-actions";
import { fetchMetrics } from "../metrics/actions";
import { WorkspaceHydrator } from "./workspace-hydrator";
import { getUserOrRedirect } from "@/lib/supabase/server";
import {
  INCOMING_REVIEWS_PAGE_SIZE,
  OUTGOING_REVIEWS_PAGE_SIZE,
} from "@/constants/reviews";
import { unwrap } from "@/utils/api";

interface LayoutProps {
  children: React.ReactNode;
}

export default async function WorkspaceLayout({ children }: LayoutProps) {
  const user = await getUserOrRedirect();
  const userId = user.id;

  const [myBusinesses, metrics, incomingReviews, outgoingReviews] =
    await Promise.all([
      unwrap(fetchBusinesses(userId)),
      unwrap(fetchMetrics(userId)),
      unwrap(fetchIncomingReviews(userId, 1, INCOMING_REVIEWS_PAGE_SIZE)),
      unwrap(fetchOutgoingReviews(userId, 1, OUTGOING_REVIEWS_PAGE_SIZE)),
    ]);

  return (
    <WorkspaceHydrator
      data={{
        userId,
        myBusinesses,
        metrics,
        incomingReviews,
        outgoingReviews,
      }}
    >
      {children}
    </WorkspaceHydrator>
  );
}
