export enum Paths {
  /** Canonical auth entry (unified login / magic link). */
  LOGIN = "/login",
  /** Legacy URL; use Next.js redirects to {@link Paths.LOGIN}. */
  SIGN_IN = "/sign-in",
  SIGN_UP = "/sign-up",
  AUTH_CALLBACK = "/auth/callback",
  /** Locations grid and primary post-login overview. */
  DASHBOARD = "/dashboard",
  ACCOUNT = "/account",
  BILLING = "/billing",
  FORGOT_PWD = "/forgot-password",
  NEW_PWD = "/new-password",
}

/** Single-business workspace. */
export function businessPath(businessId: string | number) {
  return `/business/${businessId}`;
}

