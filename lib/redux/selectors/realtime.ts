import { createSelector } from "@reduxjs/toolkit";

import type { RootState } from "../store";

/**
 * Selector factory for realtime topic ticks scoped to provided topics only.
 * This avoids subscribing to unrelated realtime topics in consumers.
 * Please use with shallowEqual to avoid unnecessary re-renders.
 * @param topics - The topics to select.
 * @returns A selector that returns the topic ticks.
 */
export const makeSelectTopicTicks = (topics: string[]) =>
  createSelector(
    [(state: RootState) => state.realtime_signal.byTopic],
    (byTopic): Record<string, number> => {
      const result: Record<string, number> = {};
      for (const topic of topics) {
        result[topic] = byTopic[topic] ?? 0;
      }
      return result;
    },
  );
