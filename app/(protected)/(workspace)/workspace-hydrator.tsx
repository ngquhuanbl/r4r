"use client";

import { useMemo, useRef } from "react";

import { useSetupRealtime } from "@/lib/hooks/realtime/use-set-up-realtime";
import { useSubscribeToTopics } from "@/lib/hooks/realtime/use-subscribe-to-topics";
import { realtimeTopic } from "@/lib/hooks/realtime/topics";
import { myBusinessesActions } from "@/lib/redux/slices/my-business";
import { businessTaskCapacityActions } from "@/lib/redux/slices/business-task-capacity";
import { myBusinessesSelectors } from "@/lib/redux/slices/my-business";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import type { FetchedBusiness } from "@/types/dashboard";
import type { UserId } from "@/types/shared";

import type { ReactNode } from "react";

export interface WorkspaceInitialData {
  userId: UserId;
  myBusinesses: FetchedBusiness[];
}

interface Props {
  readonly data: WorkspaceInitialData;
  readonly children: ReactNode;
}

export function WorkspaceHydrator({ data, children }: Props) {
  const dispatch = useAppDispatch();
  const myBusinesses = useAppSelector(myBusinessesSelectors.selectData);
  const hydrated = useRef(false);

  if (!hydrated.current) {
    dispatch(myBusinessesActions.loadInitData(data.myBusinesses));
    hydrated.current = true;
  }

  const businessReviewTopics = useMemo(
    () =>
      myBusinesses.flatMap((business) => [
        realtimeTopic.reviewsIncomingBusiness.getKey({
          businessId: business.id,
        }),
        realtimeTopic.reviewsOutgoingBusiness.getKey({
          businessId: business.id,
        }),
      ]),
    [myBusinesses],
  );

  useSetupRealtime({
    userId: data.userId,
  });

  /**
   * Consumes realtime topic ticks and converts them into dashboard dirty IDs.
   * This keeps channel setup isolated from cache invalidation policy.
   */
  useSubscribeToTopics(
    businessReviewTopics,
    (changedTopics) => {
      const impacted = new Set<number>();
      for (const topic of changedTopics) {
        const id =
          realtimeTopic.reviewsBusiness.getArgsFromKey(topic)?.businessId;
        if (id == null) continue;
        impacted.add(id);
      }
      dispatch(
        businessTaskCapacityActions.maybeMarkDirty(Array.from(impacted)),
      );
    },
    { enabled: businessReviewTopics.length > 0 },
  );

  /** Consumes channel health topic and updates cache trust flag. */
  useSubscribeToTopics(
    [realtimeTopic.reviewsChannelUnhealthyUser.getKey({ userId: data.userId })],
    () => {
      dispatch(businessTaskCapacityActions.setCanTrustCurrentDirtySet(false));
    },
  );

  return children;
}
