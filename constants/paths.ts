export enum Paths {
  SIGN_IN = "/sign-in",
  SIGN_UP = "/sign-up",
  DASHBOARD = "/dashboard",
  MY_BUSINESSES = "/my-businesses", // V1
  ACCOUNT = "/account",
  FORGOT_PWD = "/forgot-password",
  NEW_PWD = "/new-password",
  ADMIN = "/admin",
}

/** Single-business workspace (V2). */
export function businessPath(businessId: string | number) {
  return `/business/${businessId}`;
}

