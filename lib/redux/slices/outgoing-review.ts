import { fetchOutgoingReviews } from "@/app/(protected)/home/actions";
import {
  OUTGOING_REVIEWS_PAGE_SIZE,
  REVIEW_STATUS_FILTER_ALL_OPTION,
} from "@/constants/dashboard/ui";
import {
  FetchedReviewsResponse,
  OutgoingReview,
  PartialReviewWithId,
} from "@/types/dashboard";
import { Tables } from "@/types/database";
import { UserId } from "@/types/shared";
import {
  createEntityAdapter,
  createSlice,
  PayloadAction,
} from "@reduxjs/toolkit";

import { RootState } from "../store";
import { createAppAsyncThunk } from "../type-safe";

export enum Status {
  LOADING = "loading",
  SUCCEEDED = "succeeded",
  FAILED = "failed",
}

const outgoingReviewsAdapter = createEntityAdapter<OutgoingReview>();

export const outgoingReviewsSlice = createSlice({
  name: "outgoing_reviews",
  initialState: outgoingReviewsAdapter.getInitialState<{
    status: Status;
    page: number;
    totalResults: number;
    filteredStatus: Tables<"review_statuses">["id"];
  }>({
    status: Status.LOADING,
    page: 1,
    totalResults: 0,
    filteredStatus: REVIEW_STATUS_FILTER_ALL_OPTION.id,
  }),
  reducers: {
    setPage(state, action: PayloadAction<number>) {
      state.page = action.payload;
    },
    setFilteredReviewStatus(
      state,
      action: PayloadAction<Tables<"review_statuses">["id"]>
    ) {
      state.filteredStatus = action.payload;
      state.page = 1;
    },
    updateReview(
      state,
      action: PayloadAction<PartialReviewWithId<OutgoingReview>>
    ) {
      const data = action.payload;
      outgoingReviewsAdapter.updateOne(state, {
        id: data.id,
        changes: data,
      });
    },
    loadInitData(
      state,
      action: PayloadAction<FetchedReviewsResponse<OutgoingReview>>
    ) {
      const { data, total_results } = action.payload;
      outgoingReviewsAdapter.setAll(state, data);
      state.totalResults = total_results;
      state.status = Status.SUCCEEDED;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOutgoingReviewsThunk.pending, (state) => {
        state.status = Status.LOADING;
      })
      .addCase(fetchOutgoingReviewsThunk.fulfilled, (state, action) => {
        state.status = Status.SUCCEEDED;
        const { data, total_results } = action.payload;
        outgoingReviewsAdapter.setAll(state, data);
        state.totalResults = total_results;
      })
      .addCase(fetchOutgoingReviewsThunk.rejected, (state) => {
        state.status = Status.FAILED;
      });
  },
  selectors: {
    selectPage: (state) => state.page,
    selectTotalResults: (state) => state.totalResults,
    selectStatus: (state) => state.status,
    selectFilteredStatus: (state) => state.filteredStatus,
  },
});

const fetchOutgoingReviewsThunk = createAppAsyncThunk(
  "outgoing_reviews/fetchAll",
  async (
    {
      userId,
      page,
      filteredStatus,
    }: {
      userId: UserId;
      page: number;
      filteredStatus: Tables<"review_statuses">["id"];
    },
    { rejectWithValue }
  ) => {
    const response = await fetchOutgoingReviews(
      userId,
      page,
      OUTGOING_REVIEWS_PAGE_SIZE,
      filteredStatus !== REVIEW_STATUS_FILTER_ALL_OPTION.id
        ? filteredStatus
        : undefined
    );
    if (!response.ok) {
      return rejectWithValue(response.error);
    }
    return response.data;
  }
);

export const outgoingReviewsActions = {
  ...outgoingReviewsSlice.actions,
  fetchOutgoingReviewsThunk,
};

const adaptorSelector = outgoingReviewsAdapter.getSelectors<RootState>(
  (state) => state.outgoing_reviews
);

export const outgoingReviewsSelectors = {
  ...outgoingReviewsSlice.selectors,
  selectData: adaptorSelector.selectAll,
};
