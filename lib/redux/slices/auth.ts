import { User } from "@/types/shared";
import { createSlice } from "@reduxjs/toolkit";

import type { PayloadAction } from "@reduxjs/toolkit";

type AuthState = {
  user: User | null;
};

export const authSlice = createSlice({
  name: "auth",
  initialState: { user: null } as AuthState,
  reducers: {
    setCredentials: (state, { payload }: PayloadAction<User>) => {
      state.user = payload;
    },
  },
  selectors: {
    selectUserId: (state) => state.user!.id!,
  },
});

export const authActions = {
  ...authSlice.actions,
};

export const authSelectors = {
  ...authSlice.selectors,
};
