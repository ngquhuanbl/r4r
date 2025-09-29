import { fetchPlatforms } from "@/app/(protected)/home/actions";
import { Tables } from "@/types/database";
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

const platformsAdapter = createEntityAdapter<Tables<"platforms">>();

export const platformsSlice = createSlice({
  name: "platforms",
  initialState: platformsAdapter.getInitialState({
    status: Status.INIT,
  }),
  reducers: {
    loadInitData(state, action: PayloadAction<Tables<"platforms">[]>) {
      platformsAdapter.setAll(state, action.payload);
      state.status = Status.SUCCEEDED;
    },
  },
  selectors: {
    selectStatus: (state) => state.status,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPlatformsThunk.pending, (state) => {
        state.status = Status.LOADING;
      })
      .addCase(fetchPlatformsThunk.fulfilled, (state, action) => {
        state.status = Status.SUCCEEDED;
        platformsAdapter.setAll(state, action.payload);
      })
      .addCase(fetchPlatformsThunk.rejected, (state, action) => {
        state.status = Status.FAILED;
      });
  },
});

const fetchPlatformsThunk = createAppAsyncThunk(
  "platforms/fetchAll",
  async (_, { rejectWithValue }) => {
    const response = await fetchPlatforms();
    if (!response.ok) {
      return rejectWithValue(response.error);
    }
    return response.data;
  },
  {
    condition: (_, { getState }) => {
      const { platforms } = getState();
      if (platforms.status === Status.LOADING) {
        return false;
      }
      return true;
    },
  }
);

export const platformsActions = {
  ...platformsSlice.actions,
  fetchPlatformsThunk,
};

const adaptorSelector = platformsAdapter.getSelectors<RootState>(
  (state) => state.platforms
);

export const platformsSelectors = {
  ...platformsSlice.selectors,
  selectData: adaptorSelector.selectAll,
};
