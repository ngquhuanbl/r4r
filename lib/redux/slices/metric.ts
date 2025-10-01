import { Metrics } from "@/types/metric";
import { createSlice } from "@reduxjs/toolkit";

import type { PayloadAction } from "@reduxjs/toolkit";

type MetricState = Metrics;

export const metricSlice = createSlice({
  name: "metrics",
  initialState: {
    total_incoming_all: 0,
    total_incoming_verified: 0,
    total_outgoing_all: 0,
    total_outgoing_verified: 0,
  } as MetricState,
  reducers: {
    setMetric: (state, { payload }: PayloadAction<MetricState>) => {
      state.total_incoming_verified = payload.total_incoming_verified;
      state.total_incoming_all = payload.total_incoming_all;
      state.total_outgoing_verified = payload.total_outgoing_verified;
      state.total_outgoing_all = payload.total_outgoing_all;
    },
  },
  selectors: {
    selectData: (state) => state,
  },
});

export const metricActions = {
  ...metricSlice.actions,
};

export const metricSelectors = {
  ...metricSlice.selectors,
};
