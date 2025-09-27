import { fetchPendingReviewRequests as fetchReviewRequestsFromServer } from "@/app/(protected)/home/actions";
import {
  createEntityAdapter,
  createSlice,
  PayloadAction,
} from "@reduxjs/toolkit";

import type { RootState } from "../store";
import { createAppAsyncThunk } from "../type-safe";
import { ReviewRequest, UpdatedReviewRequestsStatus } from "@/types/dashboard";
import { UserId } from "@/types/shared";

export enum Status {
  INIT = "init",
  LOADING = "loading",
  SUCCEEDED = "succeeded",
  FAILED = "failed",
}

const reviewRequestsAdapter = createEntityAdapter<ReviewRequest>();

export const reviewRequestsSlice = createSlice({
  name: "review_requests",
  initialState: reviewRequestsAdapter.getInitialState<{
    status: Status;
    error: string | null;
  }>({
    status: Status.INIT,
    error: null,
  }),
  reducers: {
    updateStatus(state, action: PayloadAction<UpdatedReviewRequestsStatus>) {
      const changes = action.payload;
      reviewRequestsAdapter.updateOne(state, {
        id: changes.id,
        changes: action.payload,
      });
    },
    requestRemoved: reviewRequestsAdapter.removeOne,
  },
  selectors: {
    selectStatus: (state) => state.status,
    selectError: (state) => state.error,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReviewRequestsThunk.pending, (state) => {
        state.status = Status.LOADING;
      })
      .addCase(fetchReviewRequestsThunk.fulfilled, (state, action) => {
        state.status = Status.SUCCEEDED;
        reviewRequestsAdapter.setAll(state, action.payload);
      })
      .addCase(fetchReviewRequestsThunk.rejected, (state, action) => {
        state.status = Status.FAILED;
        state.error = action.error.message || "Unexpected error";
      });
  },
});

const fetchReviewRequestsThunk = createAppAsyncThunk(
  "review_requests/fetchAll",
  async (userId: UserId, { rejectWithValue }) => {
    const response = await fetchReviewRequestsFromServer(userId);
    if (!response.ok) {
      return rejectWithValue(response.error);
    }
    return response.data;
  },
  {
    condition: (_, { getState }) => {
      const { review_requests } = getState();
      if (review_requests.status === Status.LOADING) {
        return false;
      }
      return true;
    },
  }
);

export const reviewRequestsActions = {
  ...reviewRequestsSlice.actions,
  fetchReviewRequestsThunk,
};

const adaptorSelector = reviewRequestsAdapter.getSelectors<RootState>(
  (state) => state.review_requests
);

export const reviewRequestsSelectors = {
  ...reviewRequestsSlice.selectors,
  selectData: adaptorSelector.selectAll,
};
