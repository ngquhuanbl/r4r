import { type NextRequest, NextResponse } from "next/server";

import { Paths } from "@/constants/paths";
import { isAuthEntryRoute, isPublicRoute } from "@/utils/routing";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export const updateSession = async (request: NextRequest) => {
  const path = request.nextUrl.pathname;
  const authEntryRoute = isAuthEntryRoute(path);
  const publicPath = isPublicRoute(path);

  function nextResponse(): NextResponse {
    return NextResponse.next({
      request,
    });
  }

  try {
    let response = nextResponse();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            request.cookies.set({
              name,
              value,
              ...options,
            });
            response = nextResponse();
            response.cookies.set({
              name,
              value,
              ...options,
            });
          },
          remove(name: string, options: CookieOptions) {
            request.cookies.set({
              name,
              value: "",
              ...options,
            });
            response = nextResponse();
            response.cookies.set({
              name,
              value: "",
              ...options,
            });
          },
        },
      },
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (authEntryRoute) {
      if (user) {
        const url = request.nextUrl.clone();
        url.pathname = Paths.DASHBOARD;
        return NextResponse.redirect(url);
      }
    } else if (!publicPath && !user) {
      const url = request.nextUrl.clone();
      url.pathname = Paths.LOGIN;
      return NextResponse.redirect(url);
    }

    return response;
  } catch (error) {
    console.error("[auth-middleware] session check failed", {
      path,
      error:
        error instanceof Error
          ? { name: error.name, message: error.message }
          : "unknown_error",
    });

    if (publicPath || authEntryRoute) {
      // Continue to the next route for public or auth entry routes.
      return nextResponse();
    }

    // Redirect to auth error page for failed session validation on protected routes.
    const url = request.nextUrl.clone();
    url.pathname = Paths.AUTH_ERROR;
    return NextResponse.redirect(url);
  }
};
