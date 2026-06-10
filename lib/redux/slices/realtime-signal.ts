import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type RealtimeSignalState = {
  /** The mapping of topic to event count. */
  byTopic: Record<string, number>;
  /** The mapping of topic to the timestamp of the last event. */
  lastEventAtByTopic: Record<string, number>;
};

const initialState: RealtimeSignalState = {
  byTopic: {},
  lastEventAtByTopic: {},
};

/**
 * The realtime signal slice is used to track the number of Supabase Realtime channel events that have occurred on a given topic.
 */
export const realtimeSignalSlice = createSlice({
  name: "realtime_signal",
  initialState,
  reducers: {
    bumpTopic(state, action: PayloadAction<string>) {
      const topic = action.payload;
      state.byTopic[topic] = (state.byTopic[topic] ?? 0) + 1;
      state.lastEventAtByTopic[topic] = Date.now();
    },
    bumpTopics(state, action: PayloadAction<string[]>) {
      const now = Date.now();
      for (const topic of action.payload) {
        state.byTopic[topic] = (state.byTopic[topic] ?? 0) + 1;
        state.lastEventAtByTopic[topic] = now;
      }
    },
    clearTopic(state, action: PayloadAction<string>) {
      delete state.byTopic[action.payload];
      delete state.lastEventAtByTopic[action.payload];
    },
    clearAll(state) {
      state.byTopic = {};
      state.lastEventAtByTopic = {};
    },
  },
  selectors: {
    selectByTopic: (state) => state.byTopic,
    selectLastEventAtByTopic: (state) => state.lastEventAtByTopic,
  },
});

export const realtimeSignalActions = {
  ...realtimeSignalSlice.actions,
};

export const realtimeSignalSelectors = {
  ...realtimeSignalSlice.selectors,
};
