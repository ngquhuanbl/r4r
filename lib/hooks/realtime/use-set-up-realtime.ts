"use client";

import { useEffect } from "react";

import { createClient as createBrowserSupabaseClient } from "@/lib/supabase/client";
import { useAppDispatch } from "@/lib/redux/hooks";
import { realtimeSignalActions } from "@/lib/redux/slices/realtime-signal";
import { realtimeTopic } from "@/lib/hooks/realtime/topics";
import type { UserId } from "@/types/shared";

type RealtimeStatus =
  | "SUBSCRIBED"
  | "TIMED_OUT"
  | "CLOSED"
  | "CHANNEL_ERROR";

type ReviewRowPayload = {
  reviewer_business_id?: number | null;
  reviewed_business_id?: number | null;
};

/**
 * Sets up the workspace reviews Realtime channel and routes impacted business ids
 * into incoming/outgoing callbacks.
 */
export function useSetupRealtime(config: {
  userId: UserId;
  enabled?: boolean;
}) {
  const { userId, enabled = true } = config;
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!enabled) return;

    const supabase = createBrowserSupabaseClient();
    const channel = supabase
      .channel("reviews-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reviews",
          filter: `reviewer_user_id=eq.${userId}`,
        },
        (payload) => {
          const reviewPayload = payload as {
            new?: ReviewRowPayload;
            old?: ReviewRowPayload;
          };
          const ids = new Set<number>();
          for (const id of [
            reviewPayload.new?.reviewer_business_id,
            reviewPayload.old?.reviewer_business_id,
          ]) {
            if (typeof id === "number") {
              ids.add(id);
            }
          }
          if (ids.size > 0) {
            dispatch(
              realtimeSignalActions.bumpTopics(
                Array.from(ids).map((id) =>
                  realtimeTopic.reviewsOutgoingBusiness.getKey({ businessId: id }),
                ),
              ),
            );
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reviews",
          filter: `reviewed_owner_user_id=eq.${userId}`,
        },
        (payload) => {
          const reviewPayload = payload as {
            new?: ReviewRowPayload;
            old?: ReviewRowPayload;
          };
          const ids = new Set<number>();
          for (const id of [
            reviewPayload.new?.reviewed_business_id,
            reviewPayload.old?.reviewed_business_id,
          ]) {
            if (typeof id === "number") {
              ids.add(id);
            }
          }
          if (ids.size > 0) {
            dispatch(
              realtimeSignalActions.bumpTopics(
                Array.from(ids).map((id) =>
                  realtimeTopic.reviewsIncomingBusiness.getKey({ businessId: id }),
                ),
              ),
            );
          }
        },
      )
      .subscribe((status) => {
        if (status === ("CHANNEL_ERROR" as RealtimeStatus) || status === ("TIMED_OUT" as RealtimeStatus)) {
          dispatch(
            realtimeSignalActions.bumpTopic(
              realtimeTopic.reviewsChannelUnhealthyUser.getKey({ userId }),
            ),
          );
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [
    dispatch,
    enabled,
    userId,
  ]);
}
