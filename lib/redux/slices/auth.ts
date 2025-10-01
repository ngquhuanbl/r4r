import { createSlice } from "@reduxjs/toolkit";

import type { PayloadAction } from "@reduxjs/toolkit";
import type { User } from "@supabase/supabase-js";

type AuthState = {
  user: User | null;
  isAdmin: boolean;
};

export const authSlice = createSlice({
  name: "auth",
  initialState: { user: null, isAdmin: false } as AuthState,
  reducers: {
    setCredentials: (state, { payload }: PayloadAction<User>) => {
      state.user = payload;
      state.isAdmin = payload.id === process.env.NEXT_PUBLIC_ADMIN_ID;
    },
  },
  selectors: {
    selectUserId: (state) => state.user!.id!,
    selectEmail: (state) => state.user!.email!,
    selectIsAdmin: (state) => state.isAdmin,
  },
});

export const authActions = {
  ...authSlice.actions,
};

export const authSelectors = {
  ...authSlice.selectors,
};
