import { fetchReviewStatuses as fetchReviewStatusesFromServer } from "@/app/(protected)/home/actions";
import { Tables } from "@/types/database";
import { createEntityAdapter, createSlice } from "@reduxjs/toolkit";

import type { RootState } from "../store";
import { createAppAsyncThunk } from "../type-safe";

export enum Status {
  INIT = "init",
  LOADING = "loading",
  SUCCEEDED = "succeeded",
  FAILED = "failed",
}

const reviewStatusesAdapter = createEntityAdapter<Tables<"review_statuses">>();

export const reviewStatusesSlice = createSlice({
  name: "review_statuses",
  initialState: reviewStatusesAdapter.getInitialState({
    status: Status.INIT,
  }),
  reducers: {},
  selectors: {
    selectStatus: (state) => state.status,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReviewStatusesThunk.pending, (state) => {
        state.status = Status.LOADING;
      })
      .addCase(fetchReviewStatusesThunk.fulfilled, (state, action) => {
        state.status = Status.SUCCEEDED;
        reviewStatusesAdapter.setAll(state, action.payload);
      })
      .addCase(fetchReviewStatusesThunk.rejected, (state, action) => {
        state.status = Status.FAILED;
      });
  },
});

const fetchReviewStatusesThunk = createAppAsyncThunk(
  "review_statuses/fetchAll",
  async (_, { rejectWithValue }) => {
    const response = await fetchReviewStatusesFromServer();
    if (!response.ok) {
      return rejectWithValue(response.error);
    }
    return response.data;
  },
  {
    condition: (_, { getState }) => {
      const { review_statuses } = getState();
      if (review_statuses.status === Status.LOADING) {
        return false;
      }
      return true;
    },
  }
);

export const reviewStatusesActions = {
  ...reviewStatusesSlice.actions,
  fetchReviewStatusesThunk,
};

const adaptorSelector = reviewStatusesAdapter.getSelectors<RootState>(
  (state) => state.review_statuses
);

export const reviewStatusesSelectors = {
  ...reviewStatusesSlice.selectors,
  selectData: adaptorSelector.selectAll,
  selectById: adaptorSelector.selectById,
};
