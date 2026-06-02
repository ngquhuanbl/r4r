const AUTH_ENTRY_ROUTE_REGEX =
  /^\/(login|sign-in\/password|forgot-password|new-password)($|\/)/;

const PUBLIC_ROUTE_REGEX =
  /^\/(auth\/callback|auth\/error|terms|privacy)($|\/)/;

/**
 * Returns true when a route is an auth-entry page intended for unauthenticated users.
 */
export function isAuthEntryRoute(pathname: string): boolean {
  return AUTH_ENTRY_ROUTE_REGEX.test(pathname);
}

/**
 * Returns true when a route is publicly accessible without a session.
 */
export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTE_REGEX.test(pathname);
}

