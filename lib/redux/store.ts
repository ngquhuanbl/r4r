import type { Action, ThunkAction } from "@reduxjs/toolkit";
import {
  combineSlices,
  configureStore,
} from "@reduxjs/toolkit";

import { authSlice } from "./slices/auth";
import { incomingReviewsSlice } from "./slices/incoming-review";
import { metricSlice } from "./slices/metric";
import { myBusinessesSlice } from "./slices/my-business";
import { outgoingReviewsSlice } from "./slices/outgoing-review";
import { platformsSlice } from "./slices/platform";
import { reviewRequestsSlice } from "./slices/review-request";
import { reviewStatusesSlice } from "./slices/review-status";

// `combineSlices` automatically combines the reducers using
// their `reducerPath`s, therefore we no longer need to call `combineReducers`.
const rootReducer = combineSlices(
  reviewStatusesSlice,
  reviewRequestsSlice,
  incomingReviewsSlice,
  myBusinessesSlice,
  outgoingReviewsSlice,
  platformsSlice,
  authSlice,
  metricSlice
);
// Infer the `RootState` type from the root reducer
export type RootState = ReturnType<typeof rootReducer>;

// `makeStore` encapsulates the store configuration to allow
// creating unique store instances, which is particularly important for
// server-side rendering (SSR) scenarios. In SSR, separate store instances
// are needed for each request to prevent cross-request state pollution.
export const makeStore = () => {
  return configureStore({
    reducer: rootReducer,
  });
};

// Infer the return type of `makeStore`
export type AppStore = ReturnType<typeof makeStore>;
// Infer the `AppDispatch` type from the store itself
export type AppDispatch = AppStore["dispatch"];
export type AppThunk<ThunkReturnType = void> = ThunkAction<
  ThunkReturnType,
  RootState,
  unknown,
  Action
>;
