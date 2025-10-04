import { fetchIncomingReviews } from "@/app/(protected)/home/actions";
import {
  BUSINESS_FILTER_ALL_OPTION,
  INCOMING_REVIEWS_PAGE_SIZE,
  REVIEW_STATUS_FILTER_ALL_OPTION,
} from "@/constants/dashboard/ui";
import {
  FetchedReviewsResponse,
  IncomingReview,
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

const incomingReviewsAdapter = createEntityAdapter<IncomingReview>();

export const incomingReviewsSlice = createSlice({
  name: "incoming_reviews",
  initialState: incomingReviewsAdapter.getInitialState<{
    status: Status;
    page: number;
    totalResults: number;
    filteredBusinessId: Tables<"businesses">["id"];
    filteredStatus: Tables<"review_statuses">["id"];
  }>({
    status: Status.LOADING,
    page: 1,
    totalResults: 0,
    filteredBusinessId: BUSINESS_FILTER_ALL_OPTION.id,
    filteredStatus: REVIEW_STATUS_FILTER_ALL_OPTION.id,
  }),
  reducers: {
    setPage(state, action: PayloadAction<number>) {
      state.page = action.payload;
    },
    setFilteredBusinessId(
      state,
      action: PayloadAction<Tables<"businesses">["id"]>
    ) {
      state.filteredBusinessId = action.payload;
      state.page = 1;
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
      action: PayloadAction<PartialReviewWithId<IncomingReview>>
    ) {
      const data = action.payload;
      incomingReviewsAdapter.updateOne(state, {
        id: data.id,
        changes: data,
      });
    },
    loadInitData(
      state,
      action: PayloadAction<FetchedReviewsResponse<IncomingReview>>
    ) {
      const { data, total_results } = action.payload;
      incomingReviewsAdapter.setAll(state, data);
      state.totalResults = total_results;
      state.status = Status.SUCCEEDED;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchIncomingReviewsThunk.pending, (state) => {
        state.status = Status.LOADING;
      })
      .addCase(fetchIncomingReviewsThunk.fulfilled, (state, action) => {
        state.status = Status.SUCCEEDED;
        const { data, total_results } = action.payload;
        incomingReviewsAdapter.setAll(state, data);
        state.totalResults = total_results;
      })
      .addCase(fetchIncomingReviewsThunk.rejected, (state) => {
        state.status = Status.FAILED;
      });
  },
  selectors: {
    selectPage: (state) => state.page,
    selectTotalResults: (state) => state.totalResults,
    selectStatus: (state) => state.status,
    selectFilteredBusinessId: (state) => state.filteredBusinessId,
    selectFilteredStatus: (state) => state.filteredStatus,
  },
});

const fetchIncomingReviewsThunk = createAppAsyncThunk(
  "incoming_reviews/fetchAll",
  async (
    {
      userId,
      page,
      filteredBusinessId,
      filteredStatus,
    }: {
      userId: UserId;
      page: number;
      filteredBusinessId: Tables<"businesses">["id"];
      filteredStatus: Tables<"review_statuses">["id"];
    },
    { rejectWithValue }
  ) => {
    const response = await fetchIncomingReviews(
      userId,
      page,
      INCOMING_REVIEWS_PAGE_SIZE,
      filteredBusinessId !== BUSINESS_FILTER_ALL_OPTION.id
        ? filteredBusinessId
        : undefined,
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

export const incomingReviewsActions = {
  ...incomingReviewsSlice.actions,
  fetchIncomingReviewsThunk,
};

const adaptorSelector = incomingReviewsAdapter.getSelectors<RootState>(
  (state) => state.incoming_reviews
);

export const incomingReviewsSelectors = {
  ...incomingReviewsSlice.selectors,
  selectData: adaptorSelector.selectAll,
};
