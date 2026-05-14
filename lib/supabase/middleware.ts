import { type NextRequest, NextResponse } from "next/server";

import { Paths } from "@/constants/paths";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export const updateSession = async (request: NextRequest) => {
  function nextWithPathname(): NextResponse {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-next-pathname", request.nextUrl.pathname);
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // This `try/catch` block is only here for the interactive tutorial.
  // Feel free to remove once you have Supabase connected.
  try {
    // Create an unmodified response
    let response = nextWithPathname();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            // If the cookie is updated, update the cookies for the request and response
            request.cookies.set({
              name,
              value,
              ...options,
            });
            response = nextWithPathname();
            response.cookies.set({
              name,
              value,
              ...options,
            });
          },
          remove(name: string, options: CookieOptions) {
            // If the cookie is removed, update the cookies for the request and response
            request.cookies.set({
              name,
              value: "",
              ...options,
            });
            response = nextWithPathname();
            response.cookies.set({
              name,
              value: "",
              ...options,
            });
          },
        },
      }
    );

    // This will refresh session if expired - required for Server Components
    // https://supabase.com/docs/guides/auth/server-side/nextjs
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const path = request.nextUrl.pathname;
    const regexForAuthRoutes =
      /^\/(login|sign-in\/password|forgot-password|new-password)($|\/)/;
    const isAuthEntryRoute = regexForAuthRoutes.test(path);
    /** OAuth/magic-link callback and legal stubs must not require a session first. */
    const isPublicPath =
      /^\/(auth\/callback|terms|privacy)($|\/)/.test(path);

    if (isAuthEntryRoute) {
      if (user) {
        const url = request.nextUrl.clone();
        url.pathname = Paths.DASHBOARD;
        return NextResponse.redirect(url);
      }
    } else if (!isPublicPath && !user) {
      const url = request.nextUrl.clone();
      url.pathname = Paths.LOGIN;
      return NextResponse.redirect(url);
    }

    return response;
  } catch (e) {
    // If you are here, a Supabase client could not be created!
    // This is likely because you have not set up environment variables.
    // Check out http://localhost:3000 for Next Steps.
    return nextWithPathname();
  }
};
