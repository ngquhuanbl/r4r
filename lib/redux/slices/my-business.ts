import { fetchBusinesses } from "@/app/(protected)/home/actions";
import {
  createEntityAdapter,
  createSlice,
} from "@reduxjs/toolkit";

import type { RootState } from "../store";
import { createAppAsyncThunk } from "../type-safe";
import { UserId } from "@/types/shared";
import { Tables } from "@/types/database";

export enum Status {
  INIT = "init",
  LOADING = "loading",
  SUCCEEDED = "succeeded",
  FAILED = "failed",
}

const myBusinessesAdapter = createEntityAdapter<Tables<'businesses'>>();

export const myBusinessesSlice = createSlice({
  name: "my_businesses",
  initialState: myBusinessesAdapter.getInitialState<{
    status: Status;
    error: string | null;
  }>({
    status: Status.INIT,
    error: null,
  }),
  reducers: {},
  selectors: {
    selectStatus: (state) => state.status,
    selectError: (state) => state.error,
		selectHasBusinesses: (state) => state.status !== Status.SUCCEEDED || state.ids.length !== 0
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyBusinessesThunk.pending, (state) => {
        state.status = Status.LOADING;
      })
      .addCase(fetchMyBusinessesThunk.fulfilled, (state, action) => {
        state.status = Status.SUCCEEDED;
        myBusinessesAdapter.setAll(state, action.payload);
      })
      .addCase(fetchMyBusinessesThunk.rejected, (state, action) => {
        state.status = Status.FAILED;
        state.error = action.error.message || "Unexpected error";
      });
  },
});

const fetchMyBusinessesThunk = createAppAsyncThunk(
  "my_businesses/fetchAll",
  async (userId: UserId, { rejectWithValue }) => {
    const response = await fetchBusinesses(userId);
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

export const myBusinessesActions = {
  ...myBusinessesSlice.actions,
  fetchMyBusinessesThunk,
};

const adaptorSelector = myBusinessesAdapter.getSelectors<RootState>(
  (state) => state.my_businesses
);

export const myBusinessesSelectors = {
  ...myBusinessesSlice.selectors,
  selectData: adaptorSelector.selectAll,
};
