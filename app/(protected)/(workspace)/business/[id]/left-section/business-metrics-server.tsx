import { ReviewSnapshotChart } from "@/components/business/review-snapshot-chart";
import type { BusinessReviewSnapshot } from "@/types/business-page";
import type { UserId } from "@/types/shared";

import { fetchBusinessReviewSnapshotCached } from "../actions";

function emptySnapshot(): BusinessReviewSnapshot {
  return {
    received: { accepted: 0, rejected: 0, other: 0 },
    given: { accepted: 0, rejected: 0, other: 0 },
  };
}

export async function BusinessMetricsServer({
  userId,
  businessId,
}: {
  userId: UserId;
  businessId: number;
}) {
  const snapshotRes = await fetchBusinessReviewSnapshotCached(userId, businessId);
  const snapshot = snapshotRes.ok ? snapshotRes.data : emptySnapshot();

  return (
    <div className="rounded-lg border border-border/60 bg-card/30 p-3">
      <p className="mb-2 text-center text-xs font-medium text-muted-foreground">
        Performance snapshot
      </p>
      <ReviewSnapshotChart snapshot={snapshot} />
    </div>
  );
}
