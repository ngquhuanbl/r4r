"use client";

import { useMemo } from "react";

import { useSetupRealtime } from "@/lib/hooks/realtime/use-set-up-realtime";
import { useSubscribeToTopics } from "@/lib/hooks/realtime/use-subscribe-to-topics";
import { realtimeTopic } from "@/lib/hooks/realtime/topics";
import { businessTaskCapacityActions } from "@/lib/redux/slices/business-task-capacity";
import { useAppDispatch } from "@/lib/redux/hooks";
import type { UserId } from "@/types/shared";

import type { ReactNode } from "react";

export interface WorkspaceRealtimeBridgeData {
  userId: UserId;
  businessIds: number[];
}

interface Props {
  readonly data: WorkspaceRealtimeBridgeData;
  readonly children: ReactNode;
}

export function WorkspaceRealtimeBridge({ data, children }: Props) {
  const dispatch = useAppDispatch();

  const businessReviewTopics = useMemo(
    () =>
      data.businessIds.flatMap((businessId) => [
        realtimeTopic.reviewsIncomingBusiness.getKey({
          businessId,
        }),
        realtimeTopic.reviewsOutgoingBusiness.getKey({
          businessId,
        }),
      ]),
    [data.businessIds],
  );

  useSetupRealtime({
    userId: data.userId,
  });

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

  useSubscribeToTopics(
    [realtimeTopic.reviewsChannelUnhealthyUser.getKey({ userId: data.userId })],
    () => {
      dispatch(businessTaskCapacityActions.setCanTrustCurrentDirtySet(false));
    },
  );

  return children;
}
