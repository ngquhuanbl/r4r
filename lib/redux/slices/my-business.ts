import { fetchBusinesses } from "@/app/(protected)/my-businesses/actions";
import { FetchedBusiness } from "@/types/dashboard";
import { Tables } from "@/types/database";
import { UserId } from "@/types/shared";
import {
  createEntityAdapter,
  createSlice,
  PayloadAction,
} from "@reduxjs/toolkit";

import { createAppAsyncThunk } from "../type-safe";

import type { RootState } from "../store";
export enum Status {
  INIT = "init",
  LOADING = "loading",
  SUCCEEDED = "succeeded",
  FAILED = "failed",
}

const myBusinessesAdapter = createEntityAdapter<FetchedBusiness>();

export const myBusinessesSlice = createSlice({
  name: "my_businesses",
  initialState: myBusinessesAdapter.getInitialState<{
    status: Status;
    error: string | null;
  }>({
    status: Status.INIT,
    error: null,
  }),
  reducers: {
    loadInitData(state, action: PayloadAction<FetchedBusiness[]>) {
      myBusinessesAdapter.setAll(state, action.payload);
      state.status = Status.SUCCEEDED;
    },
    updateById(state, action: PayloadAction<FetchedBusiness>) {
      const data = action.payload;
      myBusinessesAdapter.updateOne(state, {
        id: data.id,
        changes: data,
      });
    },
    deleteById(state, action: PayloadAction<Tables<"businesses">["id"]>) {
      myBusinessesAdapter.removeOne(state, action.payload);
    },
    addData(state, action: PayloadAction<FetchedBusiness>) {
      myBusinessesAdapter.addOne(state, action.payload);
    },
  },
  selectors: {
    selectStatus: (state) => state.status,
    selectError: (state) => state.error,
    selectHasBusinesses: (state) =>
      state.status !== Status.SUCCEEDED || state.ids.length !== 0,
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
  selectEntries: adaptorSelector.selectEntities,
};
