"use client";

import { useEffect, useMemo, useRef } from "react";
import { shallowEqual } from "react-redux";

import { useAppSelector } from "@/lib/redux/hooks";
import { makeSelectTopicTicks } from "@/lib/redux/selectors/realtime";

type UseSubscribeToTopicsOptions = {
  enabled?: boolean;
  fireOnMountIfHot?: boolean;
};

/**
 * Subscribes to scoped realtime topics and invokes callback only when selected
 * topic ticks increase. Unrelated topics do not trigger this hook.
 */
export function useSubscribeToTopics(
  topics: string[],
  onChange: (changedTopics: string[]) => void,
  options?: UseSubscribeToTopicsOptions,
) {
  const { enabled = true, fireOnMountIfHot = false } = options ?? {};

  const normalizedTopics = useMemo(() => {
    return Array.from(new Set(topics)).sort();
  }, [topics]);

  /** This memoization is required to keep the selector cache intact across renders. */
  const selectTopicTicks = useMemo(
    () => makeSelectTopicTicks(normalizedTopics),
    [normalizedTopics],
  );
  const ticksByTopic = useAppSelector(selectTopicTicks, shallowEqual);
  const prevTicksRef = useRef<Record<string, number>>({});
  const hasMountedRef = useRef(false);

  useEffect(() => {
    if (!enabled || normalizedTopics.length === 0) {
      prevTicksRef.current = ticksByTopic;
      hasMountedRef.current = true;
      return;
    }

    const prev = prevTicksRef.current;
    const changedTopics: string[] = [];

    for (const topic of normalizedTopics) {
      const currentTick = ticksByTopic[topic] ?? 0;
      const prevTick = prev[topic] ?? 0;

      if (!hasMountedRef.current) {
        if (fireOnMountIfHot && currentTick > 0) {
          changedTopics.push(topic);
        }
      } else if (currentTick > prevTick) {
        changedTopics.push(topic);
      }
    }

    prevTicksRef.current = ticksByTopic;
    hasMountedRef.current = true;

    if (changedTopics.length > 0) {
      onChange(changedTopics);
    }
  }, [enabled, fireOnMountIfHot, normalizedTopics, onChange, ticksByTopic]);
}
