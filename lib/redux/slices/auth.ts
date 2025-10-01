import { createSlice } from "@reduxjs/toolkit";

import type { PayloadAction } from "@reduxjs/toolkit";
import type { User } from "@supabase/supabase-js";

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
    selectEmail: (state) => state.user!.email!,
  },
});

export const authActions = {
  ...authSlice.actions,
};

export const authSelectors = {
  ...authSlice.selectors,
};
