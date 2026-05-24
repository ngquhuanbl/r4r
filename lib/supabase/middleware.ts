import { type NextRequest, NextResponse } from "next/server";

import { Paths } from "@/constants/paths";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export const updateSession = async (request: NextRequest) => {
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

    const path = request.nextUrl.pathname;
    const regexForAuthRoutes =
      /^\/(login|sign-in\/password|forgot-password|new-password)($|\/)/;
    const isAuthEntryRoute = regexForAuthRoutes.test(path);
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
  } catch {
    return nextResponse();
  }
};
